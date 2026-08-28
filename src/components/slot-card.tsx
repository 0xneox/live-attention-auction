import { Link } from "@tanstack/react-router";
import { formatPaise } from "@/lib/money";
import type { BoardSlot } from "@/lib/auction";
import { Button } from "@/components/ui/button";

export function SlotCard({ slot }: { slot: BoardSlot }) {
  const taken = slot.status === "sold" || slot.status === "installing" || slot.status === "live";

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-panel">
      <div className="relative aspect-4/3 overflow-hidden bg-surface">
        {slot.image_url ? (
          <img
            src={slot.image_url}
            alt={`${slot.vehicle_name} — ${slot.position_label} advertising slot`}
            loading="lazy"
            width={1280}
            height={960}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <span className="absolute left-3 top-3 rounded bg-background/85 px-2 py-1 label-xs text-foreground">
          {slot.position_label}
        </span>
        {slot.reserved ? (
          <span className="absolute right-3 top-3 rounded bg-accent px-2 py-1 label-xs text-accent-foreground">
            Payment pending
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-lg font-bold uppercase">
            {slot.name} — {slot.position_label}
          </h3>
          <p className="label-xs">
            {slot.vehicle_name} · {slot.city} · {slot.dimensions ?? "—"}
          </p>
        </div>

        <div className="flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="label-xs">{slot.current_bid_id ? "Current bid" : "Opening price"}</p>
            <p className="numeric text-2xl font-bold text-money">
              {formatPaise(slot.current_amount_paise || slot.base_price_paise)}
            </p>
            <p className="label-xs mt-1">
              {slot.leader_handle ? `@${slot.leader_handle} leads` : "No bids yet"} ·{" "}
              {slot.bid_count} bids
            </p>
          </div>
          <div className="text-right">
            <p className="label-xs">Min next</p>
            <p className="numeric text-sm">{formatPaise(slot.min_next_paise)}</p>
          </div>
        </div>

        <Link to="/slots/$slug" params={{ slug: slot.slug }} className="mt-auto">
          <Button className="w-full" variant={taken ? "secondary" : "default"}>
            {taken ? "View campaign" : slot.current_bid_id ? "Outbid →" : "Open this slot →"}
          </Button>
        </Link>
      </div>
    </article>
  );
}
