import "server-only";

import { AGE_RANGE_LABELS, GENDER_LABELS } from "./constants";
import { createAdminClient } from "./supabase/admin";
import type { Database } from "./supabase/database.types";
import { escapeHtml } from "./telegram";

/**
 * «Ariza boshqaruv bot» — anketa botidan alohida ikkinchi bot.
 * Saytdagi arizalarni ko'rish (yangi / jami, sahifalab) va Telegram
 * username orqali arizani bekor qilish. Faqat Telegram ID bo'yicha
 * qo'shilgan adminlarga ishlaydi.
 */

export type ArizaBotSettings = Database["public"]["Tables"]["ariza_bot_settings"]["Row"];
export type ArizaBotAdmin = Database["public"]["Tables"]["ariza_bot_admins"]["Row"];
type Application = Pick<
  Database["public"]["Tables"]["applications"]["Row"],
  "id" | "full_name" | "phone" | "telegram" | "gender" | "age_range" | "promo_code" | "status" | "created_at"
>;

export const PAGE_SIZE = 10;
export type ListKind = "new" | "all";

const APPLICATION_FIELDS = "id, full_name, phone, telegram, gender, age_range, promo_code, status, created_at";

export async function getArizaBotSettings(): Promise<ArizaBotSettings | null> {
  const { data } = await createAdminClient().from("ariza_bot_settings").select("*").eq("id", 1).maybeSingle();
  return data;
}

/** Ariza ichidagi Telegram → "@username" (havola yoki @ siz yozilgan bo'lsa ham). */
export function cleanUsername(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "")
    .toLowerCase();
}

function formatWhen(iso: string): string {
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("hour")}:${get("minute")} · ${get("day")}.${get("month")}.${get("year")}`;
}

/** Bitta ariza bloki (HTML). */
export function formatApplication(row: Application, n?: number): string {
  const e = escapeHtml;
  const username = cleanUsername(row.telegram);
  return [
    `<b>${n ? `${n}. ` : ""}${e(row.full_name)}</b>`,
    `📞 Telefon: ${e(row.phone)}`,
    `✈️ Telegram: ${username ? `@${e(username)}` : "—"}`,
    `👤 Jins: ${e(GENDER_LABELS[row.gender] ?? row.gender)}`,
    `🎂 Yosh oraligʻi: ${e(AGE_RANGE_LABELS[row.age_range] ?? row.age_range)}`,
    row.promo_code?.trim() ? `🎟 Promo kod: ${e(row.promo_code.trim())}` : null,
    `🕒 ${formatWhen(row.created_at)}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Ro'yxat sahifasi: matn + ⬅️ 1/3 ➡️ tugmalari. */
export async function applicationsPage(
  kind: ListKind,
  page: number,
): Promise<{ text: string; keyboard: unknown | null }> {
  const db = createAdminClient();
  let count = db.from("applications").select("id", { count: "exact", head: true });
  if (kind === "new") count = count.eq("status", "yangi");
  const total = (await count).count ?? 0;

  const title = kind === "new" ? "🆕 <b>Yangi arizalar</b>" : "📋 <b>Jami arizalar</b>";
  if (!total) {
    return { text: kind === "new" ? "🆕 Yangi arizalar yoʻq ✅" : "📋 Hali arizalar yoʻq.", keyboard: null };
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const from = (current - 1) * PAGE_SIZE;

  let query = db
    .from("applications")
    .select(APPLICATION_FIELDS)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (kind === "new") query = query.eq("status", "yangi");
  const { data: rows } = await query;

  const blocks = (rows ?? []).map((row, i) => formatApplication(row, from + i + 1));
  let text = [`${title} — ${total} ta`, `Sahifa ${current}/${pages}`, "", blocks.join("\n\n")].join("\n");
  if (text.length > 4000) text = `${text.slice(0, 3990)}…`;

  const keyboard =
    pages > 1
      ? {
          inline_keyboard: [
            [
              { text: "⬅️", callback_data: current > 1 ? `al:${kind}:${current - 1}` : "noop:first" },
              { text: `${current}/${pages}`, callback_data: "noop:page" },
              { text: "➡️", callback_data: current < pages ? `al:${kind}:${current + 1}` : "noop:last" },
            ],
          ],
        }
      : null;

  return { text, keyboard };
}

/** Telegram username bo'yicha arizalar (eng yangisi birinchi). */
export async function findApplicationsByUsername(username: string): Promise<Application[]> {
  const clean = cleanUsername(username);
  if (!/^[a-z0-9_]{3,32}$/.test(clean)) return [];
  const { data } = await createAdminClient()
    .from("applications")
    .select(APPLICATION_FIELDS)
    .ilike("telegram", `%${clean}%`)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).filter((row) => cleanUsername(row.telegram) === clean).slice(0, 5);
}

export async function getApplication(id: string): Promise<Application | null> {
  const { data } = await createAdminClient().from("applications").select(APPLICATION_FIELDS).eq("id", id).maybeSingle();
  return data;
}

export async function rejectApplication(id: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("applications")
    .update({ status: "rad_etildi" })
    .eq("id", id)
    .neq("status", "rad_etildi")
    .select("id");
  return !!data?.length;
}
