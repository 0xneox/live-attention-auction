import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BoardSlot = {
  id: string;
  slug: string;
  name: string;
  position_label: string;
  dimensions: string | null;
  image_url: string | null;
  status: string;
  base_price_paise: number;
  minimum_increment_paise: number;
  vehicle_id: string;
  vehicle_name: string;
  city: string;
  route_description: string | null;
  estimated_daily_impressions: number | null;
  current_bid_id: string | null;
  current_amount_paise: number;
  leader_handle: string | null;
  leader_name: string | null;
  min_next_paise: number;
  reserved: boolean;
  reservation_expires_at: string | null;
  bid_count: number;
};

export type FeedEvent = {
  id: string;
  created_at: string;
  amount_paise: number;
  slot_id: string;
  slot_slug: string;
  slot_name: string;
  position_label: string;
  actor: string;
  previous_actor: string | null;
  previous_amount_paise: number | null;
};

export type RoundStats = {
  round_id: string;
  name: string;
  status: string;
  starts_at: string;
  ends_at: string;
  campaign_duration_days: number;
  currency: string;
  total_raised_paise: number;
  bid_count: number;
  open_slots: number;
};

export const boardQuery = queryOptions({
  queryKey: ["board"],
  queryFn: async (): Promise<BoardSlot[]> => {
    const { data, error } = await supabase.from("slot_board").select("*").order("slug");
    if (error) throw error;
    return (data ?? []) as unknown as BoardSlot[];
  },
});

export const feedQuery = queryOptions({
  queryKey: ["feed"],
  queryFn: async (): Promise<FeedEvent[]> => {
    const { data, error } = await supabase.from("activity_feed").select("*").limit(25);
    if (error) throw error;
    return (data ?? []) as unknown as FeedEvent[];
  },
});

export const roundQuery = queryOptions({
  queryKey: ["round"],
  queryFn: async (): Promise<RoundStats | null> => {
    const { data, error } = await supabase
      .from("round_stats")
      .select("*")
      .eq("status", "live")
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as RoundStats | null;
  },
});

export function slotQuery(slug: string) {
  return queryOptions({
    queryKey: ["slot", slug],
    queryFn: async (): Promise<BoardSlot | null> => {
      const { data, error } = await supabase
        .from("slot_board")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as BoardSlot | null;
    },
  });
}

export type SlotBid = {
  id: string;
  amount_paise: number;
  status: string;
  created_at: string;
  user_id: string;
  profiles: { handle: string | null; display_name: string } | null;
};

export function slotBidsQuery(slotId: string | undefined) {
  return queryOptions({
    queryKey: ["slot-bids", slotId],
    enabled: Boolean(slotId),
    queryFn: async (): Promise<SlotBid[]> => {
      if (!slotId) return [];
      const { data, error } = await supabase
        .from("bids")
        .select("id, amount_paise, status, created_at, user_id, profiles(handle, display_name)")
        .eq("slot_id", slotId)
        .in("status", ["paid", "outbid", "won"])
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as SlotBid[];
    },
  });
}

/**
 * Single centralised realtime layer: one channel for the whole auction.
 * Any bid/slot/round change invalidates the derived queries.
 */
export function useAuctionRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["board"] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["round"] });
      void queryClient.invalidateQueries({ queryKey: ["slot"] });
      void queryClient.invalidateQueries({ queryKey: ["slot-bids"] });
      void queryClient.invalidateQueries({ queryKey: ["my-bids"] });
    };

    const channel = supabase
      .channel("auction-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "slots" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, invalidate)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/** Approximate live viewer count via realtime presence — never a fabricated number. */
export function useWatchingCount(setCount: (n: number) => void) {
  useEffect(() => {
    const id = Math.random().toString(36).slice(2);
    const channel = supabase.channel("watching", { config: { presence: { key: id } } });
    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track({ at: Date.now() });
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [setCount]);
}

export type BidOutcome =
  | { outcome: "leading"; bid_id: string; amount_paise: number }
  | { outcome: "refund_due"; bid_id: string; winning_amount_paise: number }
  | { outcome: "already_leading" | "won" | "stale"; bid_id: string; status?: string };

export async function placeBid(args: {
  slotId: string;
  amountPaise: number;
  artworkPath: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc("place_bid", {
    p_slot_id: args.slotId,
    p_amount_paise: args.amountPaise,
    p_artwork_path: args.artworkPath,
  });
  if (error) throw error;
  return data as unknown as string;
}

export async function confirmPayment(bidId: string, providerPaymentId: string) {
  const { data, error } = await supabase.rpc("confirm_payment", {
    p_bid_id: bidId,
    p_provider_payment_id: providerPaymentId,
  });
  if (error) throw error;
  return data as unknown as BidOutcome;
}

/** Turns a raw postgres error message from place_bid into human copy. */
export function bidErrorMessage(message: string): string {
  if (message.includes("SLOT_RESERVED"))
    return "Someone is currently paying for this slot. Refresh in a few minutes.";
  if (message.includes("ROUND_CLOSED")) return "This round is closed. No more bids.";
  if (message.includes("SLOT_CLOSED")) return "This slot is no longer taking bids.";
  if (message.includes("BID_TOO_LOW")) {
    const min = message.split("BID_TOO_LOW:")[1]?.replace(/\D/g, "");
    return min
      ? `Too low — the minimum next bid is ₹${(Number(min) / 100).toLocaleString("en-IN")}.`
      : "Your bid is below the minimum next bid.";
  }
  if (message.includes("AUTH_REQUIRED")) return "Sign in to bid.";
  return "Could not place that bid. Try again.";
}
