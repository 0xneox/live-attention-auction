import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  handle: string | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function handleFromUser(user: User): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const raw =
    (typeof meta["handle"] === "string" && meta["handle"]) ||
    (typeof meta["name"] === "string" && meta["name"]) ||
    (user.email ?? "bidder").split("@")[0] ||
    "bidder";
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20) || "bidder";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadProfile(user: User) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, handle")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
    } else {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const displayName =
        (typeof meta["name"] === "string" && meta["name"]) || (user.email ?? "bidder");
      const base = handleFromUser(user);
      const candidate = `${base}${Math.floor(Math.random() * 90 + 10)}`;
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: user.id, display_name: String(displayName), handle: candidate })
        .select("id, display_name, handle")
        .maybeSingle();
      if (created) setProfile(created as Profile);
      await supabase
        .from("profile_contact")
        .upsert({
          id: user.id,
          email: user.email ?? null,
          phone: typeof meta["phone"] === "string" ? (meta["phone"] as string) : null,
        });
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    setIsAdmin(Boolean(roles?.some((r) => r.role === "admin")));
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession?.user) {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    void loadProfile(user);
  }, [session?.user?.id]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setIsAdmin(false);
      },
      refreshProfile: async () => {
        if (session?.user) await loadProfile(session.user);
      },
    }),
    [session, profile, isAdmin, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
