"use server";

import { revalidatePath } from "next/cache";

import type { AboutContent } from "./types";
import type { SettingsResult } from "../seo/types";
import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** "@yoshlarwiki", "yoshlarwiki" yoki to'liq havola → to'liq havola. */
function normalizeSocial(raw: string, base: string): string {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${base}${raw.replace(/^@/, "")}`;
}

/**
 * "Biz haqimizda" sahifasi matnini, badal to'lovini, qoidalarni va
 * ijtimoiy tarmoq havolalarini saqlaydi.
 *
 * Matn `about` kaliti ostida saqlanadi (yozuv bo'lmasa — yaratiladi).
 * Telegram/Instagram esa butun sayt uchun yagona manba bo'lgan
 * `contacts` sozlamasiga yoziladi.
 */
export async function saveAbout(
  _previous: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  const admin = await requireAdmin();
  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda oʻzgartirish uchun ruxsat yoʻq." };
  }

  const intro = value(formData, "intro");
  if (intro.length < 20) {
    return {
      status: "error",
      message: "Umumiy maʼlumot kamida 20 ta belgidan iborat boʻlsin.",
    };
  }

  const feeAmount = value(formData, "fee_amount").replace(/\D/g, "");
  if (feeAmount.length > 12) {
    return { status: "error", message: "Narx juda katta — tekshirib koʻring." };
  }

  const rules = formData
    .getAll("rules")
    .map((rule) => String(rule).trim())
    .filter(Boolean)
    .slice(0, 30);

  const about: AboutContent = {
    intro,
    fee_enabled: formData.get("fee_enabled") === "on",
    fee_title: value(formData, "fee_title") || "Badal toʻlovi",
    fee_amount: feeAmount,
    fee_currency: value(formData, "fee_currency") || "soʻm",
    fee_period: value(formData, "fee_period"),
    fee_description: value(formData, "fee_description"),
    rules_title: value(formData, "rules_title") || "Qoidalar",
    rules,
  };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: contactRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "contacts")
    .maybeSingle();

  const contacts = {
    ...((contactRow?.value ?? {}) as Record<string, unknown>),
    telegram: normalizeSocial(value(formData, "telegram"), "https://t.me/"),
    instagram: normalizeSocial(value(formData, "instagram"), "https://instagram.com/"),
  };

  const { error } = await supabase.from("site_settings").upsert(
    [
      { key: "about", value: about, is_public: true, updated_by: admin.id, updated_at: now },
      { key: "contacts", value: contacts, is_public: true, updated_by: admin.id, updated_at: now },
    ],
    { onConflict: "key" },
  );

  if (error) {
    return { status: "error", message: "Saqlashda xatolik yuz berdi." };
  }

  revalidatePath("/biz-haqimizda");
  revalidatePath("/sozlamalar");
  return {
    status: "success",
    message: "Saqlandi. Saytda bir daqiqa ichida yangilanadi.",
  };
}
