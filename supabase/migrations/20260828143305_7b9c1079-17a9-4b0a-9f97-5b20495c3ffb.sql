-- ============ ROLES ============
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'bidder',
  handle text unique,
  created_at timestamptz not null default now()
);
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles are public" on public.profiles for select to anon, authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table public.profile_contact (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profile_contact to authenticated;
grant all on public.profile_contact to service_role;
alter table public.profile_contact enable row level security;
create policy "own contact" on public.profile_contact for all to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ============ INVENTORY ============
create type public.vehicle_status as enum ('draft','active','retired');
create type public.slot_status as enum ('open','bidding','sold','installing','live','expired');
create type public.round_status as enum ('draft','live','closed');
create type public.bid_status as enum ('pending_payment','paid','outbid','won','expired');
create type public.payment_status as enum ('created','paid','failed','refund_due','refunded');
create type public.campaign_status as enum ('pending','artwork_submitted','printed','installed','live','expired');

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  public_name text not null,
  city text not null,
  route_description text,
  driver_name text,
  driver_contact text,
  consent_status text not null default 'pending',
  agreement_doc_url text,
  estimated_daily_impressions integer,
  photos text[] not null default '{}',
  status public.vehicle_status not null default 'active',
  created_at timestamptz not null default now()
);
grant select on public.vehicles to anon, authenticated;
grant all on public.vehicles to service_role;
alter table public.vehicles enable row level security;
create policy "vehicles public read" on public.vehicles for select to anon, authenticated using (true);
create policy "admins write vehicles" on public.vehicles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
grant insert, update, delete on public.vehicles to authenticated;

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status public.round_status not null default 'draft',
  campaign_duration_days integer not null default 30,
  currency text not null default 'INR',
  created_at timestamptz not null default now()
);
grant select on public.rounds to anon, authenticated;
grant insert, update, delete on public.rounds to authenticated;
grant all on public.rounds to service_role;
alter table public.rounds enable row level security;
create policy "rounds public read" on public.rounds for select to anon, authenticated using (true);
create policy "admins write rounds" on public.rounds for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.slots (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  slug text not null unique,
  name text not null,
  position_label text not null,
  dimensions text,
  base_price_paise bigint not null default 50000,
  minimum_increment_paise bigint not null default 5000,
  image_url text,
  status public.slot_status not null default 'open',
  current_bid_id uuid,
  reservation_bid_id uuid,
  reservation_expires_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.slots to anon, authenticated;
grant insert, update, delete on public.slots to authenticated;
grant all on public.slots to service_role;
alter table public.slots enable row level security;
create policy "slots public read" on public.slots for select to anon, authenticated using (true);
create policy "admins write slots" on public.slots for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ BIDS / PAYMENTS ============
create table public.bids (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  slot_id uuid not null references public.slots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  status public.bid_status not null default 'pending_payment',
  artwork_path text,
  created_at timestamptz not null default now(),
  outbid_at timestamptz
);
create index bids_slot_idx on public.bids (slot_id, created_at desc);
create index bids_user_idx on public.bids (user_id, created_at desc);
grant select on public.bids to anon, authenticated;
grant update, delete on public.bids to authenticated;
grant all on public.bids to service_role;
alter table public.bids enable row level security;
create policy "bids public read" on public.bids for select to anon, authenticated using (true);
create policy "admins fix bids" on public.bids for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

alter table public.slots add constraint slots_current_bid_fk foreign key (current_bid_id) references public.bids(id) on delete set null;
alter table public.slots add constraint slots_reservation_bid_fk foreign key (reservation_bid_id) references public.bids(id) on delete set null;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bid_id uuid not null references public.bids(id) on delete cascade,
  provider text not null default 'mock',
  provider_order_id text,
  provider_payment_id text,
  amount_paise bigint not null,
  status public.payment_status not null default 'created',
  webhook_verified boolean not null default false,
  receipt_url text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "own payments read" on public.payments for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins fix payments" on public.payments for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  winning_bid_id uuid not null references public.bids(id) on delete cascade,
  slot_id uuid not null references public.slots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.campaign_status not null default 'pending',
  install_date date,
  campaign_start date,
  campaign_end date,
  proof_photo_url text,
  proof_video_url text,
  created_at timestamptz not null default now(),
  unique (winning_bid_id)
);
grant select on public.campaigns to anon, authenticated;
grant insert, update, delete on public.campaigns to authenticated;
grant all on public.campaigns to service_role;
alter table public.campaigns enable row level security;
create policy "campaigns public read" on public.campaigns for select to anon, authenticated using (true);
create policy "admins write campaigns" on public.campaigns for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.payment_policy (
  id integer primary key default 1 check (id = 1),
  policy_type text not null default 'non_refundable',
  description_text text not null default 'If you''re outbid, your payment is not refunded. This is what keeps every bid real.',
  updated_at timestamptz not null default now()
);
grant select on public.payment_policy to anon, authenticated;
grant update on public.payment_policy to authenticated;
grant all on public.payment_policy to service_role;
alter table public.payment_policy enable row level security;
create policy "policy public read" on public.payment_policy for select to anon, authenticated using (true);
create policy "admins write policy" on public.payment_policy for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.payment_policy (id) values (1);

-- ============ VIEWS ============
create view public.slot_board with (security_invoker = on) as
select
  s.id, s.slug, s.name, s.position_label, s.dimensions, s.image_url, s.status,
  s.base_price_paise, s.minimum_increment_paise, s.vehicle_id,
  v.public_name as vehicle_name, v.city, v.route_description, v.estimated_daily_impressions,
  s.current_bid_id,
  coalesce(b.amount_paise, 0) as current_amount_paise,
  p.handle as leader_handle,
  p.display_name as leader_name,
  case when b.id is null then s.base_price_paise else b.amount_paise + s.minimum_increment_paise end as min_next_paise,
  (s.reservation_bid_id is not null and s.reservation_expires_at > now()) as reserved,
  s.reservation_expires_at,
  (select count(*) from public.bids bb where bb.slot_id = s.id and bb.status in ('paid','outbid','won')) as bid_count
from public.slots s
join public.vehicles v on v.id = s.vehicle_id
left join public.bids b on b.id = s.current_bid_id
left join public.profiles p on p.id = b.user_id;
grant select on public.slot_board to anon, authenticated;

create view public.activity_feed with (security_invoker = on) as
select * from (
  select
    b.id,
    b.created_at,
    b.amount_paise,
    b.slot_id,
    s.slug as slot_slug,
    s.name as slot_name,
    s.position_label,
    coalesce(p.handle, p.display_name, 'bidder') as actor,
    lag(coalesce(p.handle, p.display_name, 'bidder')) over (partition by b.slot_id order by b.created_at) as previous_actor,
    lag(b.amount_paise) over (partition by b.slot_id order by b.created_at) as previous_amount_paise
  from public.bids b
  join public.slots s on s.id = b.slot_id
  left join public.profiles p on p.id = b.user_id
  where b.status in ('paid','outbid','won')
) t
order by created_at desc;
grant select on public.activity_feed to anon, authenticated;

create view public.round_stats with (security_invoker = on) as
select
  r.id as round_id, r.name, r.status, r.starts_at, r.ends_at, r.campaign_duration_days, r.currency,
  coalesce((select sum(amount_paise) from public.bids where round_id = r.id and status in ('paid','outbid','won')), 0) as total_raised_paise,
  (select count(*) from public.bids where round_id = r.id and status in ('paid','outbid','won')) as bid_count,
  (select count(*) from public.slots where status in ('open','bidding')) as open_slots
from public.rounds r;
grant select on public.round_stats to anon, authenticated;

-- ============ BID ENGINE ============
create or replace function public.release_expired_reservations()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer := 0;
begin
  with expired as (
    select id, reservation_bid_id from public.slots
    where reservation_bid_id is not null and reservation_expires_at < now()
    for update
  )
  update public.bids b set status = 'expired'
  from expired e
  where b.id = e.reservation_bid_id and b.status = 'pending_payment';

  update public.slots set reservation_bid_id = null, reservation_expires_at = null
  where reservation_bid_id is not null and reservation_expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end $$;
grant execute on function public.release_expired_reservations() to anon, authenticated;

create or replace function public.place_bid(p_slot_id uuid, p_amount_paise bigint, p_artwork_path text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_slot public.slots;
  v_round public.rounds;
  v_current bigint;
  v_min bigint;
  v_bid_id uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_slot from public.slots where id = p_slot_id for update;
  if not found then raise exception 'SLOT_NOT_FOUND'; end if;
  if v_slot.status not in ('open','bidding') then raise exception 'SLOT_CLOSED'; end if;

  select * into v_round from public.rounds where status = 'live' order by starts_at desc limit 1;
  if v_round.id is null then raise exception 'ROUND_CLOSED'; end if;
  if now() >= v_round.ends_at then raise exception 'ROUND_CLOSED'; end if;

  if v_slot.reservation_bid_id is not null and v_slot.reservation_expires_at < now() then
    update public.bids set status = 'expired' where id = v_slot.reservation_bid_id and status = 'pending_payment';
    v_slot.reservation_bid_id := null;
  end if;

  if v_slot.reservation_bid_id is not null then
    if exists (select 1 from public.bids where id = v_slot.reservation_bid_id and user_id = v_uid) then
      update public.bids set status = 'expired' where id = v_slot.reservation_bid_id and status = 'pending_payment';
    else
      raise exception 'SLOT_RESERVED';
    end if;
  end if;

  select coalesce(max(amount_paise), 0) into v_current
  from public.bids where slot_id = p_slot_id and status in ('paid','won');

  if v_current = 0 then v_min := v_slot.base_price_paise;
  else v_min := v_current + v_slot.minimum_increment_paise; end if;

  if p_amount_paise < v_min then raise exception 'BID_TOO_LOW:%', v_min; end if;

  insert into public.bids (round_id, slot_id, user_id, amount_paise, status, artwork_path)
  values (v_round.id, p_slot_id, v_uid, p_amount_paise, 'pending_payment', p_artwork_path)
  returning id into v_bid_id;

  update public.slots
  set reservation_bid_id = v_bid_id,
      reservation_expires_at = now() + interval '12 minutes',
      status = case when status = 'open' then 'bidding' else status end
  where id = p_slot_id;

  insert into public.payments (user_id, bid_id, provider, provider_order_id, amount_paise, status)
  values (v_uid, v_bid_id, 'mock', 'mock_' || replace(v_bid_id::text, '-', ''), p_amount_paise, 'created');

  return v_bid_id;
end $$;
grant execute on function public.place_bid(uuid, bigint, text) to authenticated;

create or replace function public.confirm_payment(p_bid_id uuid, p_provider_payment_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_bid public.bids;
  v_slot public.slots;
  v_best bigint;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_bid from public.bids where id = p_bid_id;
  if not found then raise exception 'BID_NOT_FOUND'; end if;
  if v_bid.user_id <> v_uid and not public.has_role(v_uid,'admin') then raise exception 'FORBIDDEN'; end if;

  select * into v_slot from public.slots where id = v_bid.slot_id for update;

  if v_bid.status = 'paid' then return jsonb_build_object('outcome','already_leading','bid_id',p_bid_id); end if;
  if v_bid.status = 'won' then return jsonb_build_object('outcome','won','bid_id',p_bid_id); end if;
  if v_bid.status <> 'pending_payment' then
    return jsonb_build_object('outcome','stale','bid_id',p_bid_id,'status',v_bid.status::text);
  end if;

  select coalesce(max(amount_paise), 0) into v_best
  from public.bids where slot_id = v_bid.slot_id and status in ('paid','won');

  if v_bid.amount_paise > v_best then
    update public.bids set status = 'outbid', outbid_at = now()
    where slot_id = v_bid.slot_id and status = 'paid' and id <> v_bid.id;

    update public.bids set status = 'paid' where id = v_bid.id;

    update public.payments
    set status = 'paid', webhook_verified = true, updated_at = now(),
        provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id)
    where bid_id = v_bid.id;

    update public.slots
    set current_bid_id = v_bid.id, status = 'bidding',
        reservation_bid_id = null, reservation_expires_at = null
    where id = v_bid.slot_id;

    return jsonb_build_object('outcome','leading','bid_id',p_bid_id,'amount_paise',v_bid.amount_paise);
  else
    update public.bids set status = 'outbid', outbid_at = now() where id = v_bid.id;

    update public.payments
    set status = 'refund_due', webhook_verified = true, updated_at = now(),
        provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
        admin_notes = 'Payment landed after a higher bid was already confirmed for this slot. Automatic refund due.'
    where bid_id = v_bid.id;

    update public.slots set reservation_bid_id = null, reservation_expires_at = null
    where id = v_bid.slot_id and reservation_bid_id = v_bid.id;

    return jsonb_build_object('outcome','refund_due','bid_id',p_bid_id,'winning_amount_paise',v_best);
  end if;
end $$;
grant execute on function public.confirm_payment(uuid, text) to authenticated;

create or replace function public.close_round(p_round_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_slot record; v_count integer := 0; v_days integer;
begin
  if not public.has_role(v_uid,'admin') then raise exception 'FORBIDDEN'; end if;
  select campaign_duration_days into v_days from public.rounds where id = p_round_id;
  update public.rounds set status = 'closed' where id = p_round_id;

  for v_slot in
    select s.id as slot_id, b.id as bid_id, b.user_id
    from public.slots s
    join public.bids b on b.id = s.current_bid_id
    where b.round_id = p_round_id and b.status = 'paid'
  loop
    update public.bids set status = 'won' where id = v_slot.bid_id;
    update public.slots set status = 'sold', reservation_bid_id = null, reservation_expires_at = null where id = v_slot.slot_id;
    insert into public.campaigns (winning_bid_id, slot_id, user_id, status, campaign_start, campaign_end)
    values (v_slot.bid_id, v_slot.slot_id, v_slot.user_id, 'pending', current_date, current_date + coalesce(v_days,30))
    on conflict (winning_bid_id) do nothing;
    v_count := v_count + 1;
  end loop;

  update public.bids set status = 'expired'
  where round_id = p_round_id and status = 'pending_payment';

  return v_count;
end $$;
grant execute on function public.close_round(uuid) to authenticated;

-- ============ REALTIME ============
alter publication supabase_realtime add table public.slots;
alter publication supabase_realtime add table public.bids;
alter publication supabase_realtime add table public.campaigns;
alter publication supabase_realtime add table public.rounds;

-- ============ SEED (mock Drop 01 inventory) ============
insert into public.rounds (id, name, starts_at, ends_at, status, campaign_duration_days)
values ('11111111-1111-4111-8111-111111111111', 'Drop 01 — Autos', now() - interval '2 hours', now() + interval '3 days', 'live', 30);

insert into public.vehicles (id, public_name, city, route_description, driver_name, driver_contact, consent_status, estimated_daily_impressions, photos, status) values
('22222222-2222-4222-8222-000000000001','Auto 01','Kochi','Kaloor → Vyttila → Kakkanad, 11 hr/day','Sajeevan K','+91 90000 00001','signed', 9200, '{/images/auto-01.jpg}','active'),
('22222222-2222-4222-8222-000000000002','Auto 02','Kochi','Fort Kochi → Marine Drive → MG Road','Ratheesh P','+91 90000 00002','signed', 11400, '{/images/auto-02.jpg}','active'),
('22222222-2222-4222-8222-000000000003','Auto 03','Bangalore','Indiranagar → Koramangala → HSR','Mahesh B','+91 90000 00003','signed', 14800, '{/images/auto-03.jpg}','active');

insert into public.slots (vehicle_id, slug, name, position_label, dimensions, base_price_paise, minimum_increment_paise, image_url) values
('22222222-2222-4222-8222-000000000001','slot-01','Slot 01','Rear Panel','36 x 22 in', 50000, 5000, '/images/auto-01.jpg'),
('22222222-2222-4222-8222-000000000001','slot-02','Slot 02','Left Side','28 x 14 in', 40000, 5000, '/images/auto-01.jpg'),
('22222222-2222-4222-8222-000000000001','slot-03','Slot 03','Right Side','28 x 14 in', 40000, 5000, '/images/auto-01.jpg'),
('22222222-2222-4222-8222-000000000002','slot-04','Slot 04','Rear Panel','36 x 22 in', 55000, 5000, '/images/auto-02.jpg'),
('22222222-2222-4222-8222-000000000002','slot-05','Slot 05','Left Side','28 x 14 in', 45000, 5000, '/images/auto-02.jpg'),
('22222222-2222-4222-8222-000000000002','slot-06','Slot 06','Right Side','28 x 14 in', 45000, 5000, '/images/auto-02.jpg'),
('22222222-2222-4222-8222-000000000003','slot-07','Slot 07','Rear Panel','36 x 22 in', 70000, 10000, '/images/auto-03.jpg'),
('22222222-2222-4222-8222-000000000003','slot-08','Slot 08','Left Side','28 x 14 in', 60000, 10000, '/images/auto-03.jpg'),
('22222222-2222-4222-8222-000000000003','slot-09','Slot 09','Right Side','28 x 14 in', 60000, 10000, '/images/auto-03.jpg');