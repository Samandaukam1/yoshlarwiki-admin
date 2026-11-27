import "server-only";

import { sanitizeAnswers, type AnketaAnswers } from "./anketa";
import {
  createCandidateFromAnketa,
  profileUrlFor,
  updateCandidateFromAnketa,
  type Anketa,
} from "./anketa-server";
import { candidateMessageHtml } from "./candidate-message";
import { postToChannel } from "./channel-post";
import { createAdminClient } from "./supabase/admin";
import { escapeHtml, notifyBotAdmins } from "./telegram";

type Result = { ok: true; message: string } | { ok: false; message: string };

async function loadAnketa(id: string): Promise<Anketa | null> {
  const { data } = await createAdminClient().from("anketalar").select("*").eq("id", id).maybeSingle();
  return data;
}

const answersOf = (anketa: Anketa): AnketaAnswers => sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);

/** Havolani yaratgan Telegram adminga (u bo'lmasa — barcha faol adminlarga). */
function notifyCreator(anketa: Anketa, text: string, replyMarkup?: unknown) {
  return notifyBotAdmins(text, {
    preferId: anketa.created_by_bot_admin,
    onlyPreferred: !!anketa.created_by_bot_admin,
    replyMarkup,
  });
}

/* ------------------------------------------------------------------ */
/* 1. Anketa yuborildi → botga «To'lov qildimi?»                      */
/* ------------------------------------------------------------------ */

export async function askPayment(anketaOrId: Anketa | string): Promise<Result> {
  const anketa = typeof anketaOrId === "string" ? await loadAnketa(anketaOrId) : anketaOrId;
  if (!anketa) return { ok: false, message: "Anketa topilmadi." };

  const a = answersOf(anketa);
  const tgUser = a.telegram.replace(/^@/, "");
  const contact = [tgUser ? `✈️ @${escapeHtml(tgUser)}` : "", a.phone ? `📞 ${escapeHtml(a.phone)}` : ""]
    .filter(Boolean)
    .join(" · ");

  const text = [
    `📝 <b>${escapeHtml(a.full_name || anketa.full_name)} anketani toʻldirdi</b>`,
    contact || null,
    "",
    "💳 Toʻlov qildimi?",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const sent = await notifyCreator(anketa, text, {
    inline_keyboard: [
      [
        { text: "✅ Ha", callback_data: `pay:ok:${anketa.id}` },
        { text: "❌ Yoʻq", callback_data: `pay:no:${anketa.id}` },
      ],
    ],
  });
  if (!sent) return { ok: false, message: "Botga yuborilmadi: havolani yaratgan admin faol emas yoki bot ulanmagan." };

  await createAdminClient()
    .from("anketalar")
    .update({ payment_status: "kutilmoqda", payment_requested_at: new Date().toISOString() })
    .eq("id", anketa.id)
    .neq("payment_status", "tolandi");

  return { ok: true, message: "Botga «Toʻlov qildimi?» xabari yuborildi." };
}

/* ------------------------------------------------------------------ */
/* 2. «Ha» → avtomatik chop etish                                     */
/* ------------------------------------------------------------------ */

/** Mos arizani topib «Nomzodga aylantirildi» deb belgilaydi (Telegram username yoki telefon bo'yicha). */
async function convertMatchingApplication(a: AnketaAnswers, candidateId: string) {
  const username = a.telegram.replace(/^@/, "").trim().toLowerCase();
  const phone = a.phone.replace(/\D/g, "").slice(-9);
  if (!username && phone.length < 9) return;

  const db = createAdminClient();
  const { data: rows } = await db
    .from("applications")
    .select("id, telegram, phone, status")
    .not("status", "in", "(rad_etildi,nomzodga_aylantirildi)")
    .order("created_at", { ascending: false })
    .limit(1000);

  const match = (rows ?? []).find((row) => {
    const u = row.telegram
      .trim()
      .replace(/^https?:\/\/(www\.)?t\.me\//i, "")
      .replace(/^@+/, "")
      .toLowerCase();
    const p = row.phone.replace(/\D/g, "").slice(-9);
    return (username && u === username) || (phone.length === 9 && p === phone);
  });
  if (!match) return;

  await db
    .from("applications")
    .update({ status: "nomzodga_aylantirildi", converted_candidate_id: candidateId })
    .eq("id", match.id);
}

/**
 * Profilni saytda chiqarish + kanalga post + botga xabarlar.
 * `claimPayment: true` — bot «Ha» tugmasidan: to'lovni belgilaydi va ikki
 * marta bosilsa ikkinchisini e'tiborsiz qoldiradi.
 */
export async function publishAnketaById(
  id: string,
  options: { confirmedBy?: string; claimPayment?: boolean } = {},
): Promise<Result> {
  const db = createAdminClient();

  if (options.claimPayment) {
    const { data: claimed } = await db
      .from("anketalar")
      .update({
        payment_status: "tolandi",
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: options.confirmedBy ?? null,
      })
      .eq("id", id)
      .in("status", ["yuborildi", "tasdiqlandi"])
      .neq("payment_status", "tolandi")
      .select("id");
    if (!claimed?.length) return { ok: false, message: "Bu anketa allaqachon belgilangan." };
  }

  let anketa = await loadAnketa(id);
  if (!anketa) return { ok: false, message: "Anketa topilmadi." };
  if (anketa.status === "nashr_etildi") return { ok: true, message: "Profil allaqachon saytda." };
  if (anketa.status !== "yuborildi" && anketa.status !== "tasdiqlandi") {
    return { ok: false, message: "Bu anketani chop etib boʻlmaydi." };
  }
  if (anketa.payment_status !== "tolandi") return { ok: false, message: "Toʻlov tasdiqlanmagan." };

  // Profil (qoralama) hali yo'q bo'lsa — yaratamiz.
  if (!anketa.candidate_id) {
    const created = await createCandidateFromAnketa(anketa, anketa.created_by_admin);
    if (!created.ok) return created;
    anketa = (await loadAnketa(id)) ?? anketa;
  }

  const now = new Date().toISOString();
  const { data: candidate, error: pubError } = await db
    .from("candidates")
    .update({ status: "published", published_at: now })
    .eq("id", anketa.candidate_id!)
    .select("slug")
    .single();
  if (pubError || !candidate) return { ok: false, message: "Profilni nashr qilib boʻlmadi." };

  const profileUrl = profileUrlFor(candidate.slug);
  const post = await postToChannel(anketa, profileUrl);

  await db
    .from("anketalar")
    .update({
      status: "nashr_etildi",
      published_at: now,
      profile_url: profileUrl,
      post_url: post.ok ? post.url : null,
      post_image_url: post.ok ? post.imageUrl : anketa.post_image_url,
    })
    .eq("id", anketa.id);

  if (post.ok) {
    await db
      .from("candidates")
      .update({ post_url: post.url, post_image_url: post.imageUrl, posted_at: now })
      .eq("id", anketa.candidate_id!);
  }

  const a = answersOf(anketa);
  await convertMatchingApplication(a, anketa.candidate_id!);

  const name = a.full_name || anketa.full_name;
  await notifyCreator(
    anketa,
    [
      "✅ <b>Profil tayyor</b>",
      `👤 ${escapeHtml(name)}`,
      a.telegram ? `✈️ ${escapeHtml(a.telegram)}` : null,
      `🔗 ${escapeHtml(profileUrl)}`,
      post.ok ? `📢 Telegram post: ${escapeHtml(post.url)}` : `📢 Post yuborilmadi: ${escapeHtml(post.message)}`,
      "",
      "👇 Quyidagi xabarni nomzodga yuboring (forward qiling):",
    ]
      .filter((line) => line !== null)
      .join("\n"),
  );
  await notifyCreator(anketa, candidateMessageHtml(name, profileUrl, post.ok ? post.url : null));

  return post.ok
    ? { ok: true, message: "Profil saytda, Telegram post yuborildi." }
    : { ok: false, message: `Profil saytda. ${post.message}` };
}

/* ------------------------------------------------------------------ */
/* 3. Tahrirlangandan keyin: profil + kanaldagi post yangilanadi      */
/* ------------------------------------------------------------------ */

export async function syncAnketaAfterEdit(id: string): Promise<Result> {
  const anketa = await loadAnketa(id);
  if (!anketa) return { ok: false, message: "Anketa topilmadi." };
  if (!anketa.candidate_id) return { ok: true, message: "Saqlandi." };

  const updated = await updateCandidateFromAnketa(anketa);
  if (!updated.ok) return { ok: false, message: updated.message ?? "Profil yangilanmadi." };

  if (anketa.status !== "nashr_etildi" || !anketa.profile_url) {
    return { ok: true, message: "Saqlandi, profil yangilandi." };
  }

  const post = await postToChannel(anketa, anketa.profile_url, { update: true });
  if (!post.ok) return { ok: false, message: `Profil yangilandi. ${post.message}` };

  await createAdminClient()
    .from("anketalar")
    .update({ post_url: post.url, post_image_url: post.imageUrl })
    .eq("id", anketa.id);
  await createAdminClient()
    .from("candidates")
    .update({ post_url: post.url, post_image_url: post.imageUrl })
    .eq("id", anketa.candidate_id);

  return post.url === anketa.post_url
    ? { ok: true, message: "Saqlandi: profil va kanaldagi post yangilandi." }
    : { ok: true, message: "Saqlandi: profil yangilandi, kanalga yangi post yuborildi." };
}
