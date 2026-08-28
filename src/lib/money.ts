/**
 * Money is ALWAYS integer minor units (paise). Never floats, never rupee floats.
 * Convert at the edges only: user input -> paise, paise -> display string.
 */

export function formatPaise(paise: number | string | null | undefined): string {
  const value = Number(paise ?? 0);
  const rupees = Math.round(value) / 100;
  const hasFraction = Math.round(value) % 100 !== 0;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Bare number, no symbol — for tickers and big display numbers. */
export function formatPaiseBare(paise: number | string | null | undefined): string {
  return formatPaise(paise).replace("₹", "");
}

/** Parse a rupee string from an input field into integer paise. */
export function rupeesToPaise(input: string | number): number | null {
  const cleaned = String(input).replace(/[^0-9.]/g, "");
  if (cleaned === "" || cleaned === ".") return null;
  const rupees = Number(cleaned);
  if (!Number.isFinite(rupees) || rupees < 0) return null;
  return Math.round(rupees * 100);
}

export function paiseToRupeeString(paise: number | string | null | undefined): string {
  const value = Math.round(Number(paise ?? 0));
  return String(value / 100);
}

export function relativeTime(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
}
