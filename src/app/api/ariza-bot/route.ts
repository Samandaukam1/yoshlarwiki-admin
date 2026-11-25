import type { NextRequest } from "next/server";

import {
  applicationsPage,
  cleanUsername,
  findApplicationsByUsername,
  formatApplication,
  getApplication,
  getArizaBotSettings,
  rejectApplication,
  type ArizaBotAdmin,
  type ListKind,
} from "@/lib/ariza-bot";
import { STATUS_LABELS, type ApplicationStatus } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeHtml, tg } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* Telegram turlari (faqat kerakli maydonlar)                         */
/* ------------------------------------------------------------------ */

type TgUser = { id: number; username?: string };
type TgMessage = { message_id: number; chat: { id: number; type: string }; from?: TgUser; text?: string };
type TgCallback = { id: string; from: TgUser; data?: string; message?: TgMessage };
type TgUpdate = { message?: TgMessage; callback_query?: TgCallback };

type BotState = { step?: "cancel" };

const BTN_NEW = "🆕 Yangi arizalar";
const BTN_ALL = "📋 Jami arizalar";
const BTN_CANCEL_APP = "❌ Arizani bekor qilish";
const BTN_BACK = "⬅️ Orqaga";

const MENU = {
  keyboard: [[{ text: BTN_NEW }, { text: BTN_ALL }], [{ text: BTN_CANCEL_APP }]],
  resize_keyboard: true,
  is_persistent: true,
};
const BACK_KB = { keyboard: [[{ text: BTN_BACK }]], resize_keyboard: true };

/* ------------------------------------------------------------------ */
/* Webhook                                                            */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const settings = await getArizaBotSettings();
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
    console.error("[ariza-bot] update xatosi", error);
  }

  // Telegram qayta yubormasligi uchun har doim 200.
  return Response.json({ ok: true });
}

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                       */
/* ------------------------------------------------------------------ */

function send(token: string, chatId: number, text: string, extra: Record<string, unknown> = {}) {
  return tg(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...extra,
  });
}

/** Admin faqat Telegram ID bo'yicha taniladi (username o'zgarishi mumkin). */
async function findAdmin(user: TgUser): Promise<ArizaBotAdmin | null> {
  const { data } = await createAdminClient()
    .from("ariza_bot_admins")
    .select("*")
    .eq("telegram_id", user.id)
    .maybeSingle();
  return data;
}

async function setState(adminId: string, state: BotState) {
  await createAdminClient().from("ariza_bot_admins").update({ state }).eq("id", adminId);
}

async function sendList(token: string, chatId: number, kind: ListKind) {
  const { text, keyboard } = await applicationsPage(kind, 1);
  await send(token, chatId, text, keyboard ? { reply_markup: keyboard } : {});
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
      await send(token, chatId, `⛔ Ruxsat yoʻq.\nTelegram ID: <code>${from.id}</code>`, {
        reply_markup: { remove_keyboard: true },
      });
    }
    return;
  }

  await createAdminClient()
    .from("ariza_bot_admins")
    .update({
      chat_id: chatId,
      last_seen_at: new Date().toISOString(),
      telegram_username: from.username ? from.username.toLowerCase() : admin.telegram_username,
    })
    .eq("id", admin.id);

  if (update.callback_query) {
    await handleCallback(token, update.callback_query, chatId);
    return;
  }

  const text = (update.message?.text ?? "").trim();
  const state = (admin.state ?? {}) as BotState;

  if (text === "/start" || text === "/menu") {
    await setState(admin.id, {});
    await send(token, chatId, `Assalomu alaykum, <b>${escapeHtml(admin.full_name)}</b>! 👋\nArizalarni koʻrish uchun tugmani tanlang.`, {
      reply_markup: MENU,
    });
    return;
  }

  if (text === BTN_BACK || text === "/orqaga") {
    await setState(admin.id, {});
    await send(token, chatId, "Bosh menyu.", { reply_markup: MENU });
    return;
  }

  if (text === BTN_NEW || text === "/yangi") {
    await setState(admin.id, {});
    await sendList(token, chatId, "new");
    return;
  }

  if (text === BTN_ALL || text === "/jami") {
    await setState(admin.id, {});
    await sendList(token, chatId, "all");
    return;
  }

  if (text === BTN_CANCEL_APP || text === "/bekor") {
    await setState(admin.id, { step: "cancel" });
    await send(token, chatId, "Bekor qilinadigan arizaning <b>Telegram username</b>’ini yuboring:\nMasalan: <code>@aliyev_ali</code>", {
      reply_markup: BACK_KB,
    });
    return;
  }

  if (state.step === "cancel") {
    const username = cleanUsername(text);
    const rows = await findApplicationsByUsername(username);
    if (!rows.length) {
      await send(token, chatId, `@${escapeHtml(username || text)} bilan ariza topilmadi. Username’ni tekshirib qayta yuboring:`, {
        reply_markup: BACK_KB,
      });
      return;
    }

    await setState(admin.id, {});
    await send(token, chatId, `Topildi: ${rows.length} ta ariza.`, { reply_markup: MENU });
    for (const row of rows) {
      const done = row.status === "rad_etildi";
      await send(
        token,
        chatId,
        `${formatApplication(row)}\n📌 Holat: ${STATUS_LABELS[row.status as ApplicationStatus] ?? row.status}${done ? "" : "\n\nShu arizani bekor qilasizmi?"}`,
        done
          ? {}
          : {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "✅ Ha, bekor qilinsin", callback_data: `ac:y:${row.id}` },
                    { text: "❌ Yoʻq", callback_data: `ac:n:${row.id}` },
                  ],
                ],
              },
            },
      );
    }
    return;
  }

  await send(token, chatId, "Quyidagi menyudan tanlang 👇", { reply_markup: MENU });
}

async function handleCallback(token: string, cb: TgCallback, chatId: number) {
  const data = cb.data ?? "";
  const answer = (text?: string) =>
    tg(token, "answerCallbackQuery", { callback_query_id: cb.id, ...(text ? { text } : {}) });

  /* Sahifalash: al:<new|all>:<page> */
  const list = /^al:(new|all):(\d{1,4})$/.exec(data);
  if (list && cb.message) {
    const { text, keyboard } = await applicationsPage(list[1] as ListKind, Number(list[2]));
    await tg(token, "editMessageText", {
      chat_id: chatId,
      message_id: cb.message.message_id,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...(keyboard ? { reply_markup: keyboard } : {}),
    });
    await answer();
    return;
  }

  if (data === "noop:first") return void (await answer("Bu birinchi sahifa"));
  if (data === "noop:last") return void (await answer("Bu oxirgi sahifa"));

  /* Bekor qilish: ac:<y|n>:<id> */
  const cancel = /^ac:(y|n):([0-9a-f-]{36})$/.exec(data);
  if (cancel && cb.message) {
    const [, verdict, id] = cancel;
    const row = await getApplication(id);
    if (!row) {
      await answer("Ariza topilmadi");
      return;
    }

    if (verdict === "n") {
      await tg(token, "editMessageText", {
        chat_id: chatId,
        message_id: cb.message.message_id,
        parse_mode: "HTML",
        text: `${formatApplication(row)}\n\n↩️ Bekor qilinmadi.`,
      });
      await answer();
      return;
    }

    const changed = await rejectApplication(id);
    await tg(token, "editMessageText", {
      chat_id: chatId,
      message_id: cb.message.message_id,
      parse_mode: "HTML",
      text: `${formatApplication(row)}\n\n❌ <b>Ariza bekor qilindi</b> (holat: Rad etildi).`,
    });
    await answer(changed ? "Ariza bekor qilindi" : "Allaqachon bekor qilingan");
    return;
  }

  await answer();
}
