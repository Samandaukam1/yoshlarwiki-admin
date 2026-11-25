import { after, type NextRequest } from "next/server";

import { createAnketaWithLink, formatTashkent, getAnketaStats } from "@/lib/anketa-server";
import { publishAnketaById } from "@/lib/anketa-publish";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeHtml, getBotSettings, tg, type BotAdmin } from "@/lib/telegram";

export const dynamic = "force-dynamic";
// «Ha» bosilganda post rasmi va kanalga yuborish uchun vaqt.
export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/* Telegram turlari (faqat kerakli maydonlar)                         */
/* ------------------------------------------------------------------ */

type TgUser = { id: number; username?: string; first_name?: string };
type TgMessage = { message_id: number; chat: { id: number; type: string }; from?: TgUser; text?: string };
type TgCallback = { id: string; from: TgUser; data?: string; message?: TgMessage };
type TgUpdate = { message?: TgMessage; callback_query?: TgCallback };

type BotState = { step?: "gender" | "name"; gender?: "erkak" | "ayol" };

const BTN_NEW = "📝 Anketa yaratish";
const BTN_STATS = "📊 Statistika";
const BTN_CANCEL = "❌ Bekor qilish";

const MENU = {
  keyboard: [[{ text: BTN_NEW }], [{ text: BTN_STATS }]],
  resize_keyboard: true,
  is_persistent: true,
};

const CANCEL_KB = { keyboard: [[{ text: BTN_CANCEL }]], resize_keyboard: true };

const GENDER_KB = {
  inline_keyboard: [
    [
      { text: "♂️ Erkak", callback_data: "g:erkak" },
      { text: "♀️ Ayol", callback_data: "g:ayol" },
    ],
  ],
};

/* ------------------------------------------------------------------ */
/* Webhook                                                            */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const settings = await getBotSettings();
  if (!settings?.bot_token || !settings.webhook_secret || !settings.connected_at) {
    return Response.json({ ok: true });
  }

  if (request.headers.get("x-telegram-bot-api-secret-token") !== settings.webhook_secret) {
    return new Response("forbidden", { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return Response.json({ ok: true });
  }

  try {
    await handleUpdate(settings.bot_token, update);
  } catch (error) {
    console.error("[telegram] update xatosi", error);
  }

  // Telegram qayta yubormasligi uchun har doim 200.
  return Response.json({ ok: true });
}

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                       */
/* ------------------------------------------------------------------ */

async function findAdmin(user: TgUser): Promise<BotAdmin | null> {
  const db = createAdminClient();
  const { data: byId } = await db.from("bot_admins").select("*").eq("telegram_id", user.id).maybeSingle();
  if (byId) return byId;

  if (!user.username) return null;
  const { data: byName } = await db
    .from("bot_admins")
    .select("*")
    .eq("telegram_username", user.username.toLowerCase())
    .maybeSingle();
  return byName;
}

async function setState(adminId: string, state: BotState) {
  await createAdminClient().from("bot_admins").update({ state }).eq("id", adminId);
}

function send(token: string, chatId: number, text: string, extra: Record<string, unknown> = {}) {
  return tg(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

/* ------------------------------------------------------------------ */
/* Asosiy mantiq                                                      */
/* ------------------------------------------------------------------ */

async function handleUpdate(token: string, update: TgUpdate) {
  const from = update.message?.from ?? update.callback_query?.from;
  const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
  if (!from || !chatId) return;

  // Faqat shaxsiy chat
  const chatType = update.message?.chat.type ?? update.callback_query?.message?.chat.type;
  if (chatType && chatType !== "private") return;

  const admin = await findAdmin(from);

  if (!admin || !admin.is_active) {
    if (update.callback_query) {
      await tg(token, "answerCallbackQuery", { callback_query_id: update.callback_query.id, text: "Ruxsat yoʻq" });
    } else {
      await send(
        token,
        chatId,
        `⛔ Ruxsat yoʻq. Telegram ID: <code>${from.id}</code>`,
        { reply_markup: { remove_keyboard: true } },
      );
    }
    return;
  }

  // Telegram ID va chat'ni bog'lab qo'yamiz (keyingi safar username o'zgarsa ham taniydi).
  await createAdminClient()
    .from("bot_admins")
    .update({
      telegram_id: from.id,
      chat_id: chatId,
      last_seen_at: new Date().toISOString(),
      ...(from.username ? { telegram_username: from.username.toLowerCase() } : {}),
    })
    .eq("id", admin.id);

  if (update.callback_query) {
    await handleCallback(token, admin, update.callback_query, chatId);
    return;
  }

  const text = (update.message?.text ?? "").trim();
  const state = (admin.state ?? {}) as BotState;

  if (text === "/start" || text === "/menu") {
    await setState(admin.id, {});
    await send(
      token,
      chatId,
      `Assalomu alaykum, <b>${escapeHtml(admin.full_name)}</b>! 👋`,
      { reply_markup: MENU },
    );
    return;
  }

  if (text === BTN_CANCEL || text === "/bekor") {
    await setState(admin.id, {});
    await send(token, chatId, "Bekor qilindi.", { reply_markup: MENU });
    return;
  }

  if (text === BTN_STATS || text === "/stat") {
    const s = await getAnketaStats();
    await send(
      token,
      chatId,
      [
        "📊 <b>Statistika</b>",
        "",
        `👥 Jami nomzodlar: <b>${s.total}</b>`,
        `📅 Bugungi nomzodlar: <b>${s.today}</b>`,
        `🌐 Saytda: <b>${s.published}</b>`,
      ].join("\n"),
      { reply_markup: MENU },
    );
    return;
  }

  if (text === BTN_NEW || text === "/anketa") {
    await setState(admin.id, { step: "gender" });
    await send(token, chatId, "Nomzod jinsini tanlang:", { reply_markup: GENDER_KB });
    return;
  }

  if (state.step === "gender") {
    await send(token, chatId, "Nomzod jinsini tanlang:", { reply_markup: GENDER_KB });
    return;
  }

  if (state.step === "name" && state.gender) {
    const fullName = text.replace(/\s+/g, " ");
    if (fullName.length < 3 || fullName.length > 120 || fullName.startsWith("/")) {
      await send(token, chatId, "F.I.Sh ni toʻliq yuboring.", {
        reply_markup: CANCEL_KB,
      });
      return;
    }

    const created = await createAnketaWithLink({
      fullName,
      gender: state.gender,
      botAdminId: admin.id,
    });
    await setState(admin.id, {});

    if (!created) {
      await send(token, chatId, "⚠️ Havola yaratilmadi, qayta urinib koʻring.", {
        reply_markup: MENU,
      });
      return;
    }

    const until = formatTashkent(created.expiresAt);

    // Faqat matn va havola — nusxalanganda oddiy matn bo'lib tushadi.
    await tg(token, "sendMessage", {
      chat_id: chatId,
      text: `Assalomu alaykum, ${created.anketa.full_name}!\n\nYoshlarWiki anketasini toʻldiring:\n${created.url}\n\nHavola ${until} gacha amal qiladi.`,
      link_preview_options: { is_disabled: true },
      reply_markup: MENU,
    });
    return;
  }

  await send(token, chatId, "Quyidagi menyudan tanlang 👇", { reply_markup: MENU });
}

async function handleCallback(token: string, admin: BotAdmin, cb: TgCallback, chatId: number) {
  const data = cb.data ?? "";
  const answer = (text?: string) =>
    tg(token, "answerCallbackQuery", { callback_query_id: cb.id, ...(text ? { text } : {}) });

  /* Jins tanlash */
  if (data === "g:erkak" || data === "g:ayol") {
    const gender = data.slice(2) as "erkak" | "ayol";
    await setState(admin.id, { step: "name", gender });
    await answer();
    if (cb.message) {
      await tg(token, "editMessageText", {
        chat_id: chatId,
        message_id: cb.message.message_id,
        text: `Jins: ${gender === "ayol" ? "♀️ Ayol" : "♂️ Erkak"}`,
      });
    }
    await send(token, chatId, "Nomzod F.I.Sh ni yuboring:", { reply_markup: CANCEL_KB });
    return;
  }

  /* To'lovni tasdiqlash: pay:ok:<id> | pay:no:<id>. «Ha» → avtomatik chop etiladi. */
  const pay = /^pay:(ok|no):([0-9a-f-]{36})$/.exec(data);
  if (pay) {
    const [, verdict, id] = pay;
    const db = createAdminClient();
    const { data: anketa } = await db
      .from("anketalar")
      .select("id, full_name, status, payment_status")
      .eq("id", id)
      .maybeSingle();

    if (!anketa) {
      await answer("Anketa topilmadi");
      return;
    }

    const editStatus = (line: string) =>
      cb.message
        ? tg(token, "editMessageText", {
            chat_id: chatId,
            message_id: cb.message.message_id,
            parse_mode: "HTML",
            text: `💳 <b>${escapeHtml(anketa.full_name)}</b> — ${line}`,
          })
        : Promise.resolve();

    if (anketa.status === "nashr_etildi") {
      await answer("Profil allaqachon saytda");
      await editStatus("✅ profil saytda");
      return;
    }

    if (verdict === "no") {
      await db
        .from("anketalar")
        .update({
          payment_status: "tolanmadi",
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: admin.full_name,
        })
        .eq("id", id)
        .neq("payment_status", "tolandi");
      await answer("Belgilandi: toʻlanmagan");
      await editStatus("❌ toʻlanmagan. Keyinroq admin paneldan oʻzgartirish mumkin.");
      return;
    }

    await answer("✅ Toʻlov qilingan — profil chop etilmoqda…");
    await editStatus("✅ toʻlov qilingan, profil chop etilmoqda…");

    // Chop etish (rasm, kanalga post) biroz vaqt oladi — Telegramga javob qaytgach bajariladi.
    after(async () => {
      const res = await publishAnketaById(id, { confirmedBy: admin.full_name, claimPayment: true });
      await editStatus(res.ok ? "✅ toʻlov qilingan, profil chop etildi" : `⚠️ ${escapeHtml(res.message)}`);
    });
    return;
  }

  await answer();
}
