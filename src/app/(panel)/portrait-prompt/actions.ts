"use server";

import { revalidatePath } from "next/cache";

import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PromptState } from "./types";

export async function savePrompt(
  _previous: PromptState,
  formData: FormData,
): Promise<PromptState> {
  const admin = await requireAdmin();

  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda oʻzgartirish uchun ruxsat yoʻq." };
  }

  const prompt = String(formData.get("prompt") ?? "");

  if (prompt.trim().length < 50) {
    return {
      status: "error",
      message: "Prompt juda qisqa — kamida 50 ta belgi boʻlishi kerak.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      value: { prompt },
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "portrait_prompt");

  if (error) {
    return {
      status: "error",
      message: "Saqlashda xatolik yuz berdi. Qayta urinib koʻring.",
    };
  }

  revalidatePath("/portrait-prompt");

  return {
    status: "success",
    message: `Saqlandi — ${prompt.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ta belgi.`,
  };
}
