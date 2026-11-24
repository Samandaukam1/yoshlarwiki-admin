import "server-only";

import { headers } from "next/headers";

import { createAdminClient } from "./supabase/admin";
import type { Database } from "./supabase/database.types";

export type BotSettings = Database["public"]["Tables"]["bot_settings"]["Row"];
export type BotAdmin = Database["public"]["Tables"]["bot_admins"]["Row"];

type TgResponse<T> = { ok: boolean; result?: T; description?: string };

/** Telegram Bot API chaqiruvi. Xato bo'lsa `ok: false` qaytaradi, otmaydi. */
export async function tg<T = unknown>(
  token: string,
  method: string,
  params: Record<string, unknown> = {},
): Promise<TgResponse<T>> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    return (await res.json()) as TgResponse<T>;
  } catch (error) {
    return { ok: false, description: error instanceof Error ? error.message : "network" };
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function getBotSettings(): Promise<BotSettings | null> {
  const db = createAdminClient();
  const { data } = await db.from("bot_settings").select("*").eq("id", 1).maybeSingle();
  return data;
}

/** Bot ulangan bo'lsa token qaytaradi. */
export async function getBotToken(): Promise<string | null> {
  const settings = await getBotSettings();
  return settings?.bot_token && settings.connected_at ? settings.bot_token : null;
}

/**
 * Admin panel manzili — avtomatik aniqlanadi, env kiritish shart emas:
 * 1) NEXT_PUBLIC_ADMIN_URL (ixtiyoriy, o'z domeningiz bo'lsa)
 * 2) Vercel production domeni (Vercel o'zi beradi)
 * 3) joriy so'rov manzili (host sarlavhasi)
 */
export async function adminBaseUrl(): Promise<string> {
  const clean = (u: string) => u.replace(/\/+$/, "");
  if (process.env.NEXT_PUBLIC_ADMIN_URL) return clean(process.env.NEXT_PUBLIC_ADMIN_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${clean(process.env.VERCEL_PROJECT_PRODUCTION_URL)}`;
  }
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // so'rovdan tashqarida chaqirilgan
  }
  return "http://localhost:3000";
}

/**
 * Telegram adminlarga xabar yuboradi.
 * `preferId` berilsa — avval o'sha admin(ga), u topilmasa barcha faol adminlarga.
 */
export async function notifyBotAdmins(
  text: string,
  options: { preferId?: string | null; replyMarkup?: unknown; onlyPreferred?: boolean } = {},
): Promise<number> {
  const token = await getBotToken();
  if (!token) return 0;

  const db = createAdminClient();
  const { data: admins } = await db
    .from("bot_admins")
    .select("id, chat_id")
    .eq("is_active", true)
    .not("chat_id", "is", null);

  let targets = admins ?? [];
  if (options.preferId) {
    const preferred = targets.filter((a) => a.id === options.preferId);
    if (preferred.length || options.onlyPreferred) targets = preferred;
  }

  let sent = 0;
  for (const admin of targets) {
    const res = await tg(token, "sendMessage", {
      chat_id: admin.chat_id,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(options.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
    });
    if (res.ok) sent += 1;
  }
  return sent;
}
