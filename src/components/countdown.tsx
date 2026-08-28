import { useEffect, useState } from "react";

/**
 * Display-only. The server decides when a round actually closes; this is a
 * rendering of `ends_at`, never the authority.
 */
export function Countdown({ endsAt }: { endsAt: string | null | undefined }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!endsAt) return <span className="numeric">--:--:--</span>;
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return <span className="numeric text-live">CLOSED</span>;

  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className="numeric">
      {days > 0 ? `${days}d ` : ""}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
