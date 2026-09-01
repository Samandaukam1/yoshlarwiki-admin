"use server";

import { revalidatePath } from "next/cache";

import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SettingsResult } from "../seo/types";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Aloqa ma'lumotlarini saqlaydi. */
export async function saveContacts(
  _previous: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  const admin = await requireAdmin();
  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda oʻzgartirish uchun ruxsat yoʻq." };
  }

  const email = value(formData, "email");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: "error", message: "Email manzili notoʻgʻri." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      value: {
        email,
        telegram: value(formData, "telegram"),
        instagram: value(formData, "instagram"),
        youtube: value(formData, "youtube"),
      },
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "contacts");

  if (error) {
    return { status: "error", message: "Saqlashda xatolik yuz berdi." };
  }

  revalidatePath("/sozlamalar");
  return { status: "success", message: "Aloqa maʼlumotlari saqlandi." };
}

/** Promokod qo'shadi. */
export async function addPromocode(
  _previous: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  const admin = await requireAdmin();
  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda promokod qoʻshish uchun ruxsat yoʻq." };
  }

  const code = value(formData, "code").toUpperCase().replace(/\s+/g, "");
  if (code.length < 3) {
    return { status: "error", message: "Promokod kamida 3 ta belgidan iborat boʻlsin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("promocodes").insert({
    code,
    label: value(formData, "label") || null,
  });

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Bu promokod allaqachon mavjud." : "Qoʻshib boʻlmadi.",
    };
  }

  revalidatePath("/sozlamalar");
  return { status: "success", message: `«${code}» qoʻshildi.` };
}

export async function togglePromocode(formData: FormData) {
  const admin = await requireAdmin();
  if (!canWrite(admin)) return;

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  const supabase = await createClient();
  await supabase.from("promocodes").update({ is_active: !active }).eq("id", id);
  revalidatePath("/sozlamalar");
}

export async function deletePromocode(formData: FormData) {
  const admin = await requireAdmin();
  if (!canWrite(admin)) return;

  const supabase = await createClient();
  await supabase.from("promocodes").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/sozlamalar");
}
