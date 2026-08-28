import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function LiveDot({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 label-xs text-live">
      <span className="size-1.5 rounded-full bg-live animate-pulse-live" />
      {label}
    </span>
  );
}

export function SiteNav() {
  const { user, profile, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-5 px-4">
        <Link to="/" className="font-display text-xl font-bold tracking-tighter">
          21B
        </Link>
        <Link to="/" className="hidden sm:block">
          <LiveDot />
        </Link>
        <Link to="/how-it-works" className="label-xs hover:text-foreground">
          How it works
        </Link>
        <div className="flex-1" />
        {isAdmin ? (
          <Link to="/admin" className="label-xs hover:text-foreground">
            Admin
          </Link>
        ) : null}
        {user ? (
          <>
            <Link to="/dashboard" className="label-xs hover:text-foreground">
              @{profile?.handle ?? "you"}
            </Link>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button variant="secondary" size="sm">
              Sign in
            </Button>
          </Link>
        )}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4">
        <p className="label-xs">
          21B — a live marketplace where physical attention is auctioned in real time.
        </p>
        <div className="flex-1" />
        <Link to="/legal/terms" className="label-xs hover:text-foreground">
          Terms
        </Link>
        <Link to="/legal/bidding" className="label-xs hover:text-foreground">
          Bidding &amp; payment rules
        </Link>
      </div>
    </footer>
  );
}
