import { redirect } from "next/navigation";

import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

export type AdminUser = Database["public"]["Tables"]["admin_users"]["Row"];

/**
 * Joriy admin foydalanuvchini qaytaradi.
 * Sessiya yo'q yoki foydalanuvchi admin ro'yxatida bo'lmasa — /login ga yo'naltiradi.
 *
 * Bu proxy'dagi tekshiruvdan tashqari ikkinchi qatlam: sahifa
 * to'g'ridan-to'g'ri render qilinganda ham himoya ishlaydi.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin || !admin.is_active) redirect("/login?xato=ruxsat");

  return admin;
}

/** Kontent o'zgartira oladigan rollar. */
export function canWrite(admin: AdminUser) {
  return ["owner", "admin", "editor"].includes(admin.role);
}

export const ROLE_LABELS: Record<string, string> = {
  owner: "Egasi",
  admin: "Administrator",
  editor: "Muharrir",
  viewer: "Kuzatuvchi",
};
