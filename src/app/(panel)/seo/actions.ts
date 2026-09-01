"use server";

import { revalidatePath } from "next/cache";

import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SettingsResult } from "./types";

export async function saveSeoDefaults(
  _previous: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  const admin = await requireAdmin();
  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda oʻzgartirish uchun ruxsat yoʻq." };
  }

  const value = (key: string) => String(formData.get(key) ?? "").trim();

  const title = value("title");
  const description = value("description");

  if (title.length < 5 || description.length < 20) {
    return {
      status: "error",
      message: "Sarlavha va tavsif yetarlicha toʻliq boʻlishi kerak.",
    };
  }

  const keywords = value("keywords")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      value: {
        site_name: value("site_name") || "YoshlarWiki",
        title,
        description,
        keywords,
        og_image: value("og_image"),
      },
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "seo_defaults");

  if (error) {
    return { status: "error", message: "Saqlashda xatolik yuz berdi." };
  }

  revalidatePath("/seo");
  return { status: "success", message: "SEO sozlamalari saqlandi." };
}
