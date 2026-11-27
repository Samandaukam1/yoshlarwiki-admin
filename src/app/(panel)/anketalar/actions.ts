"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canWrite, requireAdmin } from "@/lib/auth";
import { normalizePhone, normalizeUsername, sanitizeAnswers } from "@/lib/anketa";
import { askPayment, publishAnketaById, syncAnketaAfterEdit } from "@/lib/anketa-publish";
import { postToChannel } from "@/lib/channel-post";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BotResult } from "../bot/types";

async function load(fd: FormData) {
  const admin = await requireAdmin();
  if (!canWrite(admin)) return { admin, anketa: null, error: "Sizda ruxsat yoʻq." } as const;
  const id = String(fd.get("id") ?? "");
  const { data: anketa } = await createAdminClient().from("anketalar").select("*").eq("id", id).maybeSingle();
  if (!anketa) return { admin, anketa: null, error: "Anketa topilmadi." } as const;
  return { admin, anketa, error: null } as const;
}

function refresh(id: string) {
  revalidatePath(`/anketalar/${id}`);
  revalidatePath("/anketalar");
  revalidatePath("/bot");
}

const EDITABLE = new Set(["yuborildi", "tasdiqlandi", "nashr_etildi"]);

/* «To'lov qildimi?» xabarini botga qayta yuborish */
export async function requestPayment(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  if (anketa.status !== "yuborildi" && anketa.status !== "tasdiqlandi") {
    return { status: "error", message: "Anketa hali yuborilmagan yoki allaqachon chop etilgan." };
  }
  const res = await askPayment(anketa);
  refresh(anketa.id);
  return { status: res.ok ? "success" : "error", message: res.ok ? `${res.message} Admin «Ha» ni bossa, profil avtomatik chop etiladi.` : res.message };
}

/* Qo'lda: to'lov qilingan → avtomatik chop etiladi */
export async function markPaidManually(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { admin, anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  const res = await publishAnketaById(anketa.id, {
    claimPayment: true,
    confirmedBy: admin.full_name || admin.email,
  });
  refresh(anketa.id);
  revalidatePath("/nomzodlar");
  return { status: res.ok ? "success" : "error", message: res.message };
}

/* Saytda chiqarish (to'lov tasdiqlangan, lekin chop etish oxiriga yetmagan bo'lsa) */
export async function publishAnketa(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  const res = await publishAnketaById(anketa.id);
  refresh(anketa.id);
  revalidatePath("/nomzodlar");
  return { status: res.ok ? "success" : "error", message: res.message };
}

/* Kanalga yuborish / mavjud postni yangi shablon bilan yangilash (eski profillar uchun ham) */
export async function repostToChannel(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  if (anketa.status !== "nashr_etildi" || !anketa.profile_url) {
    return { status: "error", message: "Avval profilni saytda chiqaring." };
  }
  const post = await postToChannel(anketa, anketa.profile_url, { update: true });
  if (!post.ok) return { status: "error", message: post.message };
  const db = createAdminClient();
  const fields = { post_url: post.url, post_image_url: post.imageUrl };
  const [{ error: anketaError }, { error: candidateError }] = await Promise.all([
    db.from("anketalar").update(fields).eq("id", anketa.id),
    anketa.candidate_id
      ? db.from("candidates").update({
          ...fields,
          ...(post.url !== anketa.post_url ? { posted_at: new Date().toISOString() } : {}),
        }).eq("id", anketa.candidate_id)
      : Promise.resolve({ error: null }),
  ]);
  refresh(anketa.id);
  revalidatePath("/nomzodlar");
  if (anketaError || candidateError) {
    return { status: "error", message: `Post yuborildi, lekin havola yozilmadi: ${post.url}` };
  }
  return {
    status: "success",
    message: post.url === anketa.post_url ? "Post yangi shablonda yangilandi." : "Telegram post yuborildi.",
  };
}

/* ------------------------------------------------------------------ */
/* Tahrirlash: matnlar                                                */
/* ------------------------------------------------------------------ */

export async function saveAnketaEdits(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  if (!EDITABLE.has(anketa.status)) {
    return { status: "error", message: "Bu holatdagi anketani tahrirlab boʻlmaydi." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("answers") ?? "{}"));
  } catch {
    return { status: "error", message: "Maʼlumotlar notoʻgʻri." };
  }

  const previous = sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);
  const answers = sanitizeAnswers(raw);
  answers.skipped = previous.skipped.filter((key) => {
    // To'ldirilgan bo'lim endi "ma'lumot yo'q" emas.
    if (key === "achievements") return !answers.achievements.some((x) => x.title.trim());
    if (key === "experience") return !answers.experience.some((x) => x.title.trim());
    if (key === "projects") return !answers.projects.some((x) => x.title.trim());
    if (key === "study") return !answers.study_place.trim();
    if (key === "activity") return !answers.activity.trim();
    if (key === "about") return !answers.about.trim();
    if (key === "birth") return !answers.birth_date && !answers.birth_place.trim();
    if (key === "extra") return !answers.extra.trim();
    return true;
  });
  answers.full_name = answers.full_name.replace(/\s+/g, " ").trim();
  answers.instagram = normalizeUsername(answers.instagram);
  answers.telegram = normalizeUsername(answers.telegram);
  answers.phone = normalizePhone(answers.phone) || answers.phone.trim();
  // Bo'sh qatorlarni tashlaymiz.
  answers.experience = answers.experience.filter((x) => x.title.trim());
  answers.achievements = answers.achievements.filter((x) => x.title.trim());
  answers.projects = answers.projects.filter((x) => x.title.trim());
  answers.socials = answers.socials.filter((x) => x.url.trim());

  if (answers.full_name.length < 3) return { status: "error", message: "F.I.Sh ni toʻliq yozing." };

  const { error: saveError } = await createAdminClient()
    .from("anketalar")
    .update({ answers_fixed: answers, full_name: answers.full_name })
    .eq("id", anketa.id);
  if (saveError) return { status: "error", message: "Saqlanmadi." };

  const res = await syncAnketaAfterEdit(anketa.id);
  refresh(anketa.id);
  revalidatePath("/nomzodlar");
  return { status: res.ok ? "success" : "error", message: res.ok ? res.message : res.message };
}

/* ------------------------------------------------------------------ */
/* Tahrirlash: rasmni almashtirish (foni brauzerda kesiladi)          */
/* ------------------------------------------------------------------ */

const PHOTO_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export async function createAnketaPhotoUpload(
  id: string,
  mime: string,
  size: number,
  variant: "portrait" | "white",
): Promise<{ ok: true; path: string; uploadToken: string } | { ok: false; message: string }> {
  const fd = new FormData();
  fd.set("id", id);
  const { anketa, error } = await load(fd);
  if (!anketa) return { ok: false, message: error ?? "Xatolik." };
  if (!EDITABLE.has(anketa.status)) return { ok: false, message: "Bu holatdagi anketani tahrirlab boʻlmaydi." };

  const ext = PHOTO_EXT[mime];
  if (!ext) return { ok: false, message: "Faqat PNG, JPG yoki WebP rasm yuklang." };
  if (size > 15 * 1024 * 1024) return { ok: false, message: "Rasm hajmi 15 MB dan oshmasin." };

  const path = `anketa/${anketa.id}/${Date.now().toString(36)}-${variant === "white" ? "oq" : "portret"}.${ext}`;
  const { data, error: upError } = await createAdminClient().storage.from("portraits").createSignedUploadUrl(path);
  if (upError || !data) return { ok: false, message: "Yuklashni boshlab boʻlmadi." };
  return { ok: true, path: data.path, uploadToken: data.token };
}

export async function confirmAnketaPhoto(
  id: string,
  path: string,
  whitePath: string | null,
): Promise<{ ok: boolean; message: string }> {
  const fd = new FormData();
  fd.set("id", id);
  const { anketa, error } = await load(fd);
  if (!anketa) return { ok: false, message: error ?? "Xatolik." };
  const prefix = `anketa/${anketa.id}/`;
  if (!path.startsWith(prefix) || (whitePath && !whitePath.startsWith(prefix))) {
    return { ok: false, message: "Notoʻgʻri fayl." };
  }

  const db = createAdminClient();
  const storage = db.storage.from("portraits");
  const publicUrl = storage.getPublicUrl(path).data.publicUrl;
  const whiteUrl = whitePath ? storage.getPublicUrl(whitePath).data.publicUrl : null;

  await db
    .from("anketalar")
    .update({ photo_url: publicUrl, photo_path: path, photo_white_url: whiteUrl })
    .eq("id", anketa.id);

  const res = await syncAnketaAfterEdit(anketa.id);

  // Eski rasmlarni o'chiramiz (profil endi yangisini ko'rsatadi).
  const marker = "/object/public/portraits/";
  const old = [anketa.photo_path, anketa.photo_white_url?.split(marker)[1]]
    .filter((x): x is string => !!x && x !== path && x !== whitePath)
    .map((x) => decodeURIComponent(x));
  if (old.length) await storage.remove(old);

  refresh(anketa.id);
  revalidatePath("/nomzodlar");
  return { ok: res.ok, message: res.ok ? `Rasm almashtirildi. ${res.message}` : res.message };
}

/* Rad etish */
export async function rejectAnketa(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  const db = createAdminClient();
  await db.from("anketa_links").delete().eq("anketa_id", anketa.id);
  await db.from("anketalar").update({ status: "rad_etildi" }).eq("id", anketa.id);
  refresh(anketa.id);
  return { status: "success", message: "Anketa rad etildi, havola oʻchirildi." };
}

/* O'chirish */
export async function deleteAnketa(fd: FormData) {
  const { anketa } = await load(fd);
  if (!anketa) return;
  const db = createAdminClient();
  // Profilga bog'lanmagan bo'lsa rasmni ham o'chiramiz.
  if (anketa.photo_path && !anketa.candidate_id) {
    await db.storage.from("portraits").remove([anketa.photo_path]);
  }
  await db.from("anketalar").delete().eq("id", anketa.id);
  refresh(anketa.id);
  redirect("/anketalar");
}
