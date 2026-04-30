"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useCardsStore } from "@/store/useCardsStore";

export function CardsProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useCardsStore((s) => s.hydrate);
  const hydrated = useCardsStore((s) => s.hydrated);

  useEffect(() => {
    const supabase = createClient();
    // onAuthStateChange fires immediately with INITIAL_SESSION (covering first load)
    // and again on SIGNED_IN / SIGNED_OUT, so we never need a separate hydrate() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      hydrate().catch(() => {
        // If Supabase is unreachable (bad env vars, network error) still
        // unblock the UI so the app renders in a degraded state.
        useCardsStore.setState({ hydrated: true });
      });
    });
    return () => subscription.unsubscribe();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-24 text-sm text-zinc-500">
        Loading your wallet…
      </div>
    );
  }

  return <>{children}</>;
}
