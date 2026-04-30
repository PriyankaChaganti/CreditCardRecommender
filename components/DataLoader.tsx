"use client";

import { useEffect } from "react";

import { loadCatalog, setCatalogCache } from "@/lib/catalogLoader";
import { loadMerchantMap } from "@/lib/merchant";
import { useCardsStore } from "@/store/useCardsStore";

export function DataLoader() {
  const hydrate = useCardsStore((s) => s.hydrate);
  const hydrated = useCardsStore((s) => s.hydrated);

  useEffect(() => {
    async function init() {
      const [catalogData] = await Promise.all([loadCatalog(), loadMerchantMap()]);
      setCatalogCache(catalogData);
      if (!hydrated) await hydrate();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
