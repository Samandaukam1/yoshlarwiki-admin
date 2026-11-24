import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";

const url = SUPABASE_URL;
const anonKey = SUPABASE_ANON_KEY;

/**
 * Server komponentlar va server actionlar uchun Supabase mijozi.
 * Sessiya cookie orqali o'qiladi, barcha so'rovlar RLS ostida bajariladi.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server komponentdan chaqirilganda cookie yozib bo'lmaydi —
          // sessiyani proxy yangilaydi.
        }
      },
    },
  });
}
