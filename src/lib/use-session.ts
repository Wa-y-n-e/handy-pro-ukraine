import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  rating: number;
  status: "free" | "working" | "offline";
  locked_address: string | null;
  locked_lat: number | null;
  locked_lng: number | null;
  primary_category_slug: string | null;
  verified: boolean;
  has_vehicle: boolean;
  tools_inventory: string | null;
  experience_years: number;
  wallet_balance: number;
}

export type Role = "client" | "master" | "admin";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setRole(null);
      return;
    }
    let mounted = true;
    (async () => {
      const [{ data: pRows }, { data: r }] = await Promise.all([
        supabase.rpc("get_my_profile"),
        supabase.from("user_roles").select("role").eq("user_id", user.id).limit(1).maybeSingle(),
      ]);
      const p = Array.isArray(pRows) ? pRows[0] : null;
      if (!mounted) return;
      setProfile(p as Profile | null);
      setRole((r?.role as Role | null) ?? "client");
    })();
    const ch = supabase
      .channel(`profile-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload) => {
        setProfile(payload.new as Profile);
      })
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [user]);

  return { session, user, profile, role, loading, setProfile };
}
