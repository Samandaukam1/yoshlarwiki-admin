"use server";

import { normalizePhone, normalizeUsername, sanitizeAnswers, STEPS } from "@/lib/anketa";
import { polishAnketa } from "@/lib/anketa-polish";
import { loadActiveLink } from "@/lib/anketa-server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "portraits";
const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type Ok<T = object> = ({ ok: true } & T) | { ok: false; message: string };

const INVALID = "Havola yaroqsiz yoki muddati tugagan.";

/* ------------------------------------------------------------------ */
/* Qoralamani avtomatik saqlash — admin jonli kuzatadi                */
/* ------------------------------------------------------------------ */

export async function saveDraft(token: string, raw: unknown, step: number): Promise<Ok> {
  const anketa = await loadActiveLink(token);
  if (!anketa) return { ok: false, message: INVALID };

  const answers = sanitizeAnswers(raw);
  const { error } = await createAdminClient()
    .from("anketalar")
    .update({
      answers,
      current_step: Math.max(0, Math.min(STEPS.length - 1, Math.trunc(step) || 0)),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", anketa.id);

  return error ? { ok: false, message: "Saqlanmadi" } : { ok: true };
}

/* ------------------------------------------------------------------ */
/* Rasm yuklash: imzolangan URL → brauzer to'g'ridan Storage'ga        */
/* ------------------------------------------------------------------ */

export async function createPhotoUpload(
  token: string,
  mime: string,
  size: number,
  variant: "portrait" | "white" = "portrait",
): Promise<Ok<{ path: string; uploadToken: string }>> {
  const anketa = await loadActiveLink(token);
  if (!anketa) return { ok: false, message: INVALID };

  const ext = MIME_EXT[mime];
  if (!ext) return { ok: false, message: "Faqat PNG yoki JPG rasm yuklang." };
  if (size > 15 * 1024 * 1024) return { ok: false, message: "Rasm hajmi 15 MB dan oshmasin." };

  const path = `anketa/${anketa.id}/${Date.now().toString(36)}-${variant === "white" ? "oq" : "portret"}.${ext}`;
  const { data, error } = await createAdminClient().storage.from(BUCKET).createSignedUploadUrl(path);

  if (error || !data) return { ok: false, message: "Yuklashni boshlab boʻlmadi. Qayta urinib koʻring." };
  return { ok: true, path: data.path, uploadToken: data.token };
}

export async function confirmPhoto(
  token: string,
  path: string,
  whitePath?: string,
): Promise<Ok<{ url: string }>> {
  const anketa = await loadActiveLink(token);
  if (!anketa) return { ok: false, message: INVALID };
  const prefix = `anketa/${anketa.id}/`;
  if (!path.startsWith(prefix) || (whitePath && !whitePath.startsWith(prefix))) {
    return { ok: false, message: "Notoʻgʻri fayl." };
  }

  const db = createAdminClient();
  const {
    data: { publicUrl },
  } = db.storage.from(BUCKET).getPublicUrl(path);
  const whiteUrl = whitePath ? db.storage.from(BUCKET).getPublicUrl(whitePath).data.publicUrl : null;

  if (anketa.photo_path && anketa.photo_path !== path) {
    await db.storage.from(BUCKET).remove([anketa.photo_path]);
  }

  await db
    .from("anketalar")
    .update({
      photo_url: publicUrl,
      photo_path: path,
      photo_white_url: whiteUrl,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", anketa.id);

  return { ok: true, url: publicUrl };
}

/* ------------------------------------------------------------------ */
/* Yuborish                                                           */
/* ------------------------------------------------------------------ */

export async function submitAnketa(token: string, raw: unknown): Promise<Ok> {
  const anketa = await loadActiveLink(token);
  if (!anketa) return { ok: false, message: INVALID };

  const answers = sanitizeAnswers(raw);
  answers.full_name = answers.full_name.replace(/\s+/g, " ").trim();
  answers.instagram = normalizeUsername(answers.instagram);
  answers.telegram = normalizeUsername(answers.telegram);
  answers.phone = normalizePhone(answers.phone);

  if (answers.full_name.length < 3) return { ok: false, message: "F.I.Sh ni toʻliq yozing." };
  if (!answers.phone) return { ok: false, message: "Telefon raqamingizni toʻgʻri kiriting: +998 XX XXX XX XX" };
  if (!anketa.photo_url) return { ok: false, message: "Profil rasmini yuklang." };

  const polished = await polishAnketa(answers);
  const db = createAdminClient();

  const { error } = await db
    .from("anketalar")
    .update({
      status: "yuborildi",
      full_name: polished.answers.full_name || anketa.full_name,
      answers,
      answers_fixed: polished.answers,
      seo: polished.seo,
      current_step: STEPS.length - 1,
      submitted_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", anketa.id)
    .eq("status", "toldirilmoqda");

  if (error) return { ok: false, message: "Yuborishda xatolik. Qayta urinib koʻring." };

  // Havola bir martalik: Supabase'dan butunlay o'chiriladi.
  await db.from("anketa_links").delete().eq("anketa_id", anketa.id);

  return { ok: true };
}
