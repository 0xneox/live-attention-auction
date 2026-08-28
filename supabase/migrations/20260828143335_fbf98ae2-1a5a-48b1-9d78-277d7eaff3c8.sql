revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
revoke execute on function public.release_expired_reservations() from anon, public;
revoke execute on function public.place_bid(uuid, bigint, text) from anon, public;
revoke execute on function public.confirm_payment(uuid, text) from anon, public;
revoke execute on function public.close_round(uuid) from anon, public;

grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.release_expired_reservations() to service_role;
grant execute on function public.place_bid(uuid, bigint, text) to authenticated, service_role;
grant execute on function public.confirm_payment(uuid, text) to authenticated, service_role;
grant execute on function public.close_round(uuid) to authenticated, service_role;