"use server";

import { revalidatePath } from "next/cache";

import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/constants";
import type { ActionResult } from "./types";

/** Ariza statusini o'zgartiradi. Tarix trigger orqali avtomatik yoziladi. */
export async function updateStatus(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda oʻzgartirish uchun ruxsat yoʻq." };
  }

  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("status") ?? "");

  if (!APPLICATION_STATUSES.includes(next as never)) {
    return { status: "error", message: "Notoʻgʻri status." };
  }

  const supabase = await createClient();
  const patch: { status: ApplicationStatus; contacted_at?: string } = {
    status: next as ApplicationStatus,
  };
  if (next === "boglanildi") patch.contacted_at = new Date().toISOString();

  const { error } = await supabase.from("applications").update(patch).eq("id", id);

  if (error) {
    return { status: "error", message: "Statusni saqlab boʻlmadi." };
  }

  revalidatePath("/arizalar");
  revalidatePath(`/arizalar/${id}`);
  revalidatePath("/");
  return { status: "success", message: "Status yangilandi." };
}

/** Arizaga ichki izoh qo'shadi. */
export async function addNote(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda izoh qoldirish uchun ruxsat yoʻq." };
  }

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (body.length < 2) {
    return { status: "error", message: "Izoh juda qisqa." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("application_notes").insert({
    application_id: id,
    author_id: admin.id,
    body: body.slice(0, 4000),
  });

  if (error) {
    return { status: "error", message: "Izohni saqlab boʻlmadi." };
  }

  revalidatePath(`/arizalar/${id}`);
  return { status: "success", message: "Izoh qoʻshildi." };
}

/** Arizani nomzod qoralamasiga aylantiradi. Asl ariza saqlanadi. */
export async function convertToCandidate(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda bu amal uchun ruxsat yoʻq." };
  }

  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("convert_application_to_candidate", {
    p_application_id: id,
  });

  if (error) {
    return { status: "error", message: "Aylantirishda xatolik yuz berdi." };
  }

  const result = data as unknown as {
    ok: boolean;
    already?: boolean;
    candidate_id?: string;
    error?: string;
  };

  if (!result?.ok) {
    return { status: "error", message: result?.error ?? "Aylantirib boʻlmadi." };
  }

  revalidatePath("/arizalar");
  revalidatePath(`/arizalar/${id}`);
  revalidatePath("/nomzodlar");

  return {
    status: "success",
    message: result.already
      ? "Bu ariza allaqachon nomzodga aylantirilgan."
      : "Nomzod qoralamasi yaratildi.",
    candidateId: result.candidate_id,
  };
}
