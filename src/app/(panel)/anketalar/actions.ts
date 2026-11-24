"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canWrite, requireAdmin } from "@/lib/auth";
import { sanitizeAnswers } from "@/lib/anketa";
import { createCandidateFromAnketa, profileUrlFor } from "@/lib/anketa-server";
import { postToChannel } from "@/lib/channel-post";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeHtml, notifyBotAdmins } from "@/lib/telegram";
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

/* 1. Tasdiqlash → profil (qoralama) yaratiladi */
export async function approveAnketa(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { admin, anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  if (anketa.status !== "yuborildi") return { status: "error", message: "Faqat yuborilgan anketani tasdiqlash mumkin." };

  const res = await createCandidateFromAnketa(anketa, admin.id);
  if (!res.ok) return { status: "error", message: res.message };

  refresh(anketa.id);
  return { status: "success", message: "Tasdiqlandi — nomzod profili (qoralama) yaratildi." };
}

/* 2. To'lovni tekshirish — havolani yaratgan Telegram adminga boradi */
export async function requestPayment(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  if (anketa.status !== "tasdiqlandi") return { status: "error", message: "Avval anketani tasdiqlang." };

  if (!anketa.created_by_bot_admin) {
    return { status: "error", message: "Bu anketa havolasini yaratgan Telegram admin topilmadi." };
  }

  const a = sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);
  const tgUser = a.telegram.replace(/^@/, "");

  const text = [
    "💳 <b>Toʻlovni tekshiring</b>",
    `👤 ${escapeHtml(a.full_name || anketa.full_name)}`,
    tgUser ? `✈️ @${escapeHtml(tgUser)}` : null,
    a.phone ? `📞 ${escapeHtml(a.phone)}` : null,
    "",
    "Toʻlov qilinganmi?",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const keyboard: { text: string; url?: string; callback_data?: string }[][] = [
    [
      { text: "✅ Ha", callback_data: `pay:ok:${anketa.id}` },
      { text: "❌ Yoʻq", callback_data: `pay:no:${anketa.id}` },
    ],
  ];
  if (tgUser) keyboard.unshift([{ text: `💬 @${tgUser} bilan chat`, url: `https://t.me/${tgUser}` }]);

  // FAQAT havolani yaratgan Telegram adminga.
  const sent = await notifyBotAdmins(text, {
    preferId: anketa.created_by_bot_admin,
    onlyPreferred: true,
    replyMarkup: { inline_keyboard: keyboard },
  });

  if (!sent) {
    return {
      status: "error",
      message: "Yuborilmadi: havolani yaratgan admin faol emas yoki bot ulanmagan.",
    };
  }

  await createAdminClient()
    .from("anketalar")
    .update({ payment_status: "kutilmoqda", payment_requested_at: new Date().toISOString() })
    .eq("id", anketa.id);

  refresh(anketa.id);
  return { status: "success", message: "Botga yuborildi. Admin «Ha» ni bossa, toʻlov avtomatik belgilanadi." };
}

/* Qo'lda belgilash (bot ishlamasa) */
export async function markPaidManually(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { admin, anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  await createAdminClient()
    .from("anketalar")
    .update({
      payment_status: "tolandi",
      payment_confirmed_at: new Date().toISOString(),
      payment_confirmed_by: admin.full_name || admin.email,
    })
    .eq("id", anketa.id);
  refresh(anketa.id);
  return { status: "success", message: "Toʻlov qilingan deb belgilandi." };
}

/* 3. Saytda chiqarish → kanalga post → yaratgan adminga xabar */
export async function publishAnketa(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  if (!anketa.candidate_id) return { status: "error", message: "Profil hali yaratilmagan." };
  if (anketa.payment_status !== "tolandi") return { status: "error", message: "Toʻlov tasdiqlanmagan." };

  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data: candidate, error: pubError } = await db
    .from("candidates")
    .update({ status: "published", published_at: now })
    .eq("id", anketa.candidate_id)
    .select("slug")
    .single();
  if (pubError || !candidate) return { status: "error", message: "Profilni nashr qilib boʻlmadi." };

  const profileUrl = profileUrlFor(candidate.slug);
  const post = await postToChannel(anketa, profileUrl);

  await db
    .from("anketalar")
    .update({
      status: "nashr_etildi",
      published_at: now,
      profile_url: profileUrl,
      post_url: post.ok ? post.url : null,
    })
    .eq("id", anketa.id);

  const a = sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);
  await notifyBotAdmins(
    [
      "✅ <b>Profil tayyor</b>",
      `👤 ${escapeHtml(a.full_name || anketa.full_name)}`,
      a.telegram ? `✈️ ${escapeHtml(a.telegram)}` : null,
      `🔗 ${escapeHtml(profileUrl)}`,
      post.ok ? `📢 Telegram post yuborildi: ${escapeHtml(post.url)}` : `📢 Post yuborilmadi`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    { preferId: anketa.created_by_bot_admin, onlyPreferred: true },
  );

  refresh(anketa.id);
  revalidatePath("/nomzodlar");
  return post.ok
    ? { status: "success", message: "Profil saytda, Telegram post yuborildi." }
    : { status: "error", message: `Profil saytda. ${post.message}` };
}

/* Kanalga qayta yuborish (post chiqmagan bo'lsa) */
export async function repostToChannel(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const { anketa, error } = await load(fd);
  if (!anketa) return { status: "error", message: error ?? "Xatolik." };
  if (anketa.status !== "nashr_etildi" || !anketa.profile_url) {
    return { status: "error", message: "Avval profilni saytda chiqaring." };
  }
  const post = await postToChannel(anketa, anketa.profile_url);
  if (!post.ok) return { status: "error", message: post.message };
  await createAdminClient().from("anketalar").update({ post_url: post.url }).eq("id", anketa.id);
  refresh(anketa.id);
  return { status: "success", message: "Telegram post yuborildi." };
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
