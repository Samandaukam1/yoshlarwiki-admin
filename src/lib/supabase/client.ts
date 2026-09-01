"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/** Brauzer mijozi — faqat anon kalit ishlatiladi. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
