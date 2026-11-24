"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { canWrite, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeChannel } from "@/lib/channel-post";
import { adminBaseUrl, getBotSettings, tg } from "@/lib/telegram";
import type { BotResult } from "./types";

async function guard() {
  const admin = await requireAdmin();
  if (!canWrite(admin)) throw new Error("forbidden");
  return admin;
}

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/* ------------------------------------------------------------------ */
/* Botni ulash (token + username)                                     */
/* ------------------------------------------------------------------ */

export async function connectBot(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const admin = await guard();
  const token = text(fd, "bot_token");
  const username = text(fd, "bot_username").replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
  const current = await getBotSettings();
  const ttl = Number.parseInt(text(fd, "link_ttl_hours") || String(current?.link_ttl_hours ?? 24), 10);

  if (!/^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(token)) {
    return { status: "error", message: "Bot API token notoʻgʻri. @BotFather bergan tokenni toʻliq kiriting." };
  }
  if (!Number.isFinite(ttl) || ttl < 1 || ttl > 720) {
    return { status: "error", message: "Havola muddati 1 dan 720 soatgacha boʻlishi kerak." };
  }

  const me = await tg<{ username: string; first_name: string }>(token, "getMe");
  if (!me.ok || !me.result) {
    return { status: "error", message: `Telegram tokenni qabul qilmadi: ${me.description ?? "nomaʼlum xato"}` };
  }
  if (username && me.result.username.toLowerCase() !== username.toLowerCase()) {
    return {
      status: "error",
      message: `Token @${me.result.username} botiga tegishli, siz @${username} deb yozdingiz.`,
    };
  }

  const base = await adminBaseUrl();
  if (!base.startsWith("https://")) {
    return {
      status: "error",
      message: `Webhook uchun HTTPS manzil kerak (hozirgi: ${base}). Botni Vercel’dagi admin paneldan ulang.`,
    };
  }

  const secret = randomBytes(24).toString("hex");
  const webhookUrl = `${base}/api/telegram`;

  const hook = await tg(token, "setWebhook", {
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  if (!hook.ok) {
    return { status: "error", message: `Webhook oʻrnatilmadi: ${hook.description ?? "xato"}` };
  }

  await tg(token, "setMyCommands", {
    commands: [
      { command: "start", description: "Bosh menyu" },
      { command: "anketa", description: "Yangi anketa havolasi" },
      { command: "stat", description: "Statistika" },
      { command: "bekor", description: "Bekor qilish" },
    ],
  });

  const { error } = await createAdminClient()
    .from("bot_settings")
    .upsert({
      id: 1,
      bot_token: token,
      bot_username: me.result.username,
      webhook_secret: secret,
      webhook_url: webhookUrl,
      link_ttl_hours: ttl,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    });

  if (error) return { status: "error", message: "Sozlamalar saqlanmadi (migratsiya bajarilganmi?)." };

  revalidatePath("/bot");
  return { status: "success", message: `@${me.result.username} ulandi.` };
}

export async function saveLinkTtl(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const admin = await guard();
  const ttl = Number.parseInt(text(fd, "link_ttl_hours"), 10);
  if (!Number.isFinite(ttl) || ttl < 1 || ttl > 720) {
    return { status: "error", message: "1 dan 720 soatgacha kiriting." };
  }
  await createAdminClient()
    .from("bot_settings")
    .update({ link_ttl_hours: ttl, updated_at: new Date().toISOString(), updated_by: admin.id })
    .eq("id", 1);
  revalidatePath("/bot");
  return { status: "success", message: `Yangi havolalar ${ttl} soat amal qiladi.` };
}

export async function disconnectBot() {
  const admin = await guard();
  const settings = await getBotSettings();
  if (settings?.bot_token) await tg(settings.bot_token, "deleteWebhook", { drop_pending_updates: true });
  await createAdminClient()
    .from("bot_settings")
    .update({
      bot_token: null,
      webhook_secret: null,
      webhook_url: null,
      connected_at: null,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
    .eq("id", 1);
  revalidatePath("/bot");
}

/* ------------------------------------------------------------------ */
/* Telegram adminlar                                                  */
/* ------------------------------------------------------------------ */

export async function addBotAdmin(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const admin = await guard();
  const name = text(fd, "full_name");
  const handle = text(fd, "telegram")
    .replace(/^https?:\/\/t\.me\//i, "")
    .replace(/^@/, "")
    .trim();

  if (name.length < 2) return { status: "error", message: "Ismni kiriting." };
  if (!handle) return { status: "error", message: "Telegram username yoki ID kiriting." };

  const isId = /^\d{5,15}$/.test(handle);
  if (!isId && !/^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(handle)) {
    return { status: "error", message: "Username notoʻgʻri (masalan: @yoshlarwiki) yoki raqamli ID kiriting." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bot_admins").insert({
    full_name: name,
    telegram_username: isId ? null : handle.toLowerCase(),
    telegram_id: isId ? Number(handle) : null,
    created_by: admin.id,
  });

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Bu Telegram admin allaqachon qoʻshilgan." : "Qoʻshib boʻlmadi.",
    };
  }

  revalidatePath("/bot");
  return { status: "success", message: `${name} qoʻshildi. Endi u botda /start bosishi kerak.` };
}

export async function toggleBotAdmin(fd: FormData) {
  await guard();
  const supabase = await createClient();
  await supabase
    .from("bot_admins")
    .update({ is_active: fd.get("active") === "1", state: {} })
    .eq("id", text(fd, "id"));
  revalidatePath("/bot");
}

export async function deleteBotAdmin(fd: FormData) {
  await guard();
  const supabase = await createClient();
  await supabase.from("bot_admins").delete().eq("id", text(fd, "id"));
  revalidatePath("/bot");
}

/* ------------------------------------------------------------------ */
/* Kanal va post ostidagi havolalar                                   */
/* ------------------------------------------------------------------ */

function cleanUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const url = /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, "")}`;
  try {
    return new URL(url).toString();
  } catch {
    return null;
  }
}

export async function saveChannelSettings(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const admin = await guard();
  const rawChannel = text(fd, "channel");
  const channel = rawChannel ? normalizeChannel(rawChannel) : "";
  if (rawChannel && !channel) {
    return { status: "error", message: "Kanal havolasi notoʻgʻri. Masalan: https://t.me/yoshlarwiki yoki @yoshlarwiki" };
  }

  const instagram = cleanUrl(text(fd, "instagram_url"));
  const telegram = cleanUrl(text(fd, "telegram_url"));
  const apply = cleanUrl(text(fd, "apply_url"));
  if (text(fd, "apply_url") && !apply) return { status: "error", message: "Ariza havolasi notoʻgʻri." };
  if (text(fd, "instagram_url") && !instagram) return { status: "error", message: "Instagram havolasi notoʻgʻri." };
  if (text(fd, "telegram_url") && !telegram) return { status: "error", message: "Telegram havolasi notoʻgʻri." };

  // Bot kanalni ko'ra oladimi — tekshiramiz.
  let warning = "";
  const settings = await getBotSettings();
  if (channel && settings?.bot_token) {
    const chat = await tg<{ title?: string }>(settings.bot_token, "getChat", { chat_id: channel });
    if (!chat.ok) warning = " Diqqat: bot kanalni topa olmadi — botni kanalga admin qiling.";
  }

  const { error } = await createAdminClient()
    .from("bot_settings")
    .update({
      channel: channel || null,
      instagram_url: instagram,
      telegram_url: telegram,
      apply_url: apply,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
    .eq("id", 1);

  if (error) return { status: "error", message: "Saqlanmadi (yangi SQL ishga tushirilganmi?)." };
  revalidatePath("/bot");
  return { status: warning ? "error" : "success", message: `Saqlandi.${warning}` };
}
