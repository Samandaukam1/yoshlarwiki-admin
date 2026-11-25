"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { getArizaBotSettings } from "@/lib/ariza-bot";
import { canWrite, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminBaseUrl, tg } from "@/lib/telegram";
import type { BotResult } from "../bot/types";

async function guard() {
  const admin = await requireAdmin();
  if (!canWrite(admin)) throw new Error("forbidden");
  return admin;
}

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/* ------------------------------------------------------------------ */
/* Botni ulash (token + username)                                     */
/* ------------------------------------------------------------------ */

export async function connectArizaBot(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const admin = await guard();
  const token = text(fd, "bot_token");
  const username = text(fd, "bot_username").replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");

  if (!/^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(token)) {
    return { status: "error", message: "Bot API token notoʻgʻri. @BotFather bergan tokenni toʻliq kiriting." };
  }

  const me = await tg<{ username: string }>(token, "getMe");
  if (!me.ok || !me.result) {
    return { status: "error", message: `Telegram tokenni qabul qilmadi: ${me.description ?? "nomaʼlum xato"}` };
  }
  if (username && me.result.username.toLowerCase() !== username.toLowerCase()) {
    return { status: "error", message: `Token @${me.result.username} botiga tegishli, siz @${username} deb yozdingiz.` };
  }

  // Anketa boti bilan bir xil bot bo'lmasin — webhook bir-birini o'chirib qo'yadi.
  const { data: anketaBot } = await createAdminClient().from("bot_settings").select("bot_username").eq("id", 1).maybeSingle();
  if (anketaBot?.bot_username && anketaBot.bot_username.toLowerCase() === me.result.username.toLowerCase()) {
    return { status: "error", message: "Bu bot anketa boti sifatida ulangan. Ariza boti uchun @BotFather’da alohida bot yarating." };
  }

  const base = await adminBaseUrl();
  if (!base.startsWith("https://")) {
    return { status: "error", message: `Webhook uchun HTTPS manzil kerak (hozirgi: ${base}). Botni Vercel’dagi admin paneldan ulang.` };
  }

  const secret = randomBytes(24).toString("hex");
  const webhookUrl = `${base}/api/ariza-bot`;
  const hook = await tg(token, "setWebhook", {
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  if (!hook.ok) return { status: "error", message: `Webhook oʻrnatilmadi: ${hook.description ?? "xato"}` };

  await tg(token, "setMyCommands", {
    commands: [
      { command: "start", description: "Bosh menyu" },
      { command: "yangi", description: "Yangi arizalar" },
      { command: "jami", description: "Jami arizalar" },
      { command: "bekor", description: "Arizani bekor qilish" },
    ],
  });

  const { error } = await createAdminClient()
    .from("ariza_bot_settings")
    .upsert({
      id: 1,
      bot_token: token,
      bot_username: me.result.username,
      webhook_secret: secret,
      webhook_url: webhookUrl,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    });
  if (error) return { status: "error", message: "Sozlamalar saqlanmadi (yangi SQL ishga tushirilganmi?)." };

  revalidatePath("/ariza-bot");
  return { status: "success", message: `@${me.result.username} ulandi.` };
}

export async function disconnectArizaBot() {
  const admin = await guard();
  const settings = await getArizaBotSettings();
  if (settings?.bot_token) await tg(settings.bot_token, "deleteWebhook", { drop_pending_updates: true });
  await createAdminClient()
    .from("ariza_bot_settings")
    .update({
      bot_token: null,
      webhook_secret: null,
      webhook_url: null,
      connected_at: null,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
    .eq("id", 1);
  revalidatePath("/ariza-bot");
}

/* ------------------------------------------------------------------ */
/* Adminlar (faqat Telegram ID)                                       */
/* ------------------------------------------------------------------ */

export async function addArizaBotAdmin(_prev: BotResult, fd: FormData): Promise<BotResult> {
  const admin = await guard();
  const name = text(fd, "full_name");
  const id = text(fd, "telegram_id").replace(/\s/g, "");

  if (name.length < 2) return { status: "error", message: "Ismni kiriting." };
  if (!/^\d{5,15}$/.test(id)) {
    return { status: "error", message: "Telegram ID faqat raqamlardan iborat boʻladi (masalan: 123456789)." };
  }

  const { error } = await createAdminClient().from("ariza_bot_admins").insert({
    full_name: name,
    telegram_id: Number(id),
    created_by: admin.id,
  });
  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Bu Telegram ID allaqachon qoʻshilgan." : "Qoʻshib boʻlmadi (yangi SQL ishga tushirilganmi?).",
    };
  }

  revalidatePath("/ariza-bot");
  return { status: "success", message: `${name} qoʻshildi. Endi u botga kirib /start bosadi.` };
}

export async function toggleArizaBotAdmin(fd: FormData) {
  await guard();
  await createAdminClient()
    .from("ariza_bot_admins")
    .update({ is_active: fd.get("active") === "1", state: {} })
    .eq("id", text(fd, "id"));
  revalidatePath("/ariza-bot");
}

export async function deleteArizaBotAdmin(fd: FormData) {
  await guard();
  await createAdminClient().from("ariza_bot_admins").delete().eq("id", text(fd, "id"));
  revalidatePath("/ariza-bot");
}
