"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Sahifani har N soniyada yangilaydi — nomzod to'ldirayotganini jonli ko'rish uchun. */
export function LiveRefresh({ seconds = 5, enabled = true }: { seconds?: number; enabled?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds, enabled]);

  return null;
}
