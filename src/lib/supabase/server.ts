import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY belgilanishi shart.",
  );
}

/**
 * Server komponentlar va server actionlar uchun Supabase mijozi.
 * Sessiya cookie orqali o'qiladi, barcha so'rovlar RLS ostida bajariladi.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(url!, anonKey!, {
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
