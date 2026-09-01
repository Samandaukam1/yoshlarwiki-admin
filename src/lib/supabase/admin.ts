import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * SERVICE ROLE mijozi — RLS ni chetlab o'tadi.
 *
 * `server-only` importi tufayli bu modul brauzer bundle'iga tushsa,
 * build vaqtida xatolik beradi. Faqat quyidagi holatlarda ishlatiladi:
 *  - Storage'ga fayl yuklash/o'chirish
 *  - auth.users bilan ishlash (admin qo'shish)
 *
 * Oddiy CRUD uchun ISHLATILMAYDI — u RLS ostidagi mijoz orqali bajariladi.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY server muhitida belgilanmagan.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
