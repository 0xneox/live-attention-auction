import { Link } from "@tanstack/react-router";
import { formatPaise, relativeTime } from "@/lib/money";
import type { FeedEvent } from "@/lib/auction";

/**
 * The screenshot moment. Newest event gets the big treatment; everything else
 * drops into the ticker below it.
 */
export function MomentFeed({ events }: { events: FeedEvent[] }) {
  const [latest, ...rest] = events;

  return (
    <section aria-label="Live activity" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="label-xs">Live activity</h2>
        <span className="label-xs">{events.length} events</span>
      </div>

      {latest ? (
        <Link
          key={latest.id}
          to="/slots/$slug"
          params={{ slug: latest.slot_slug }}
          className="block animate-tick-in rounded-lg border border-accent bg-card p-5 shadow-moment"
        >
          <p className="label-xs text-accent">🔥 {relativeTime(latest.created_at)}</p>
          <p className="mt-3 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            {latest.previous_actor ? (
              <>
                @{latest.actor} <span className="text-muted-foreground">outbid</span> @
                {latest.previous_actor}
              </>
            ) : (
              <>
                @{latest.actor} <span className="text-muted-foreground">opened</span>{" "}
                {latest.slot_name}
              </>
            )}
          </p>
          <p className="mt-2 numeric text-3xl font-bold text-money sm:text-4xl">
            {latest.previous_amount_paise ? (
              <>
                <span className="text-muted-foreground line-through decoration-1">
                  {formatPaise(latest.previous_amount_paise)}
                </span>{" "}
                → {formatPaise(latest.amount_paise)}
              </>
            ) : (
              formatPaise(latest.amount_paise)
            )}
          </p>
          <p className="mt-3 label-xs">
            {latest.slot_name} · {latest.position_label}
          </p>
        </Link>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6">
          <p className="label-xs">No bids yet</p>
          <p className="mt-2 font-display text-xl uppercase">
            Nine slots. Nobody has claimed one.
          </p>
        </div>
      )}

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {rest.slice(0, 10).map((event) => (
          <li key={event.id}>
            <Link
              to="/slots/$slug"
              params={{ slug: event.slot_slug }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted"
            >
              <span className="numeric text-xs text-muted-foreground w-16 shrink-0">
                {relativeTime(event.created_at)}
              </span>
              <span className="truncate">
                @{event.actor}
                {event.previous_actor ? (
                  <span className="text-muted-foreground"> outbid @{event.previous_actor}</span>
                ) : (
                  <span className="text-muted-foreground"> opened</span>
                )}
              </span>
              <span className="flex-1" />
              <span className="numeric text-money">{formatPaise(event.amount_paise)}</span>
              <span className="label-xs hidden sm:inline">{event.slot_name}</span>
            </Link>
          </li>
        ))}
        {rest.length === 0 ? (
          <li className="px-4 py-3 label-xs">Every new bid lands here instantly.</li>
        ) : null}
      </ul>
    </section>
  );
}
