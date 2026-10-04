/**
 * Sana chegaralari Toshkent vaqti (UTC+5, yozgi vaqt yo'q) bo'yicha.
 *
 * Server (Vercel) va ma'lumotlar bazasi UTC'da ishlaydi. "Bugun"ni UTC
 * bo'yicha hisoblasak, Toshkentda kun soat 05:00 da "boshlanib" qoladi —
 * tungi arizalar kechagi kunga tushib ketadi.
 */
export const TIME_ZONE = "Asia/Tashkent";

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Toshkent bo'yicha joriy kun boshlanishi (00:00), ISO/UTC ko'rinishida. */
export function startOfTodayTashkent(now: Date = new Date()): string {
  const local = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - TASHKENT_OFFSET_MS).toISOString();
}
