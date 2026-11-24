/**
 * Loyiha sozlamalari — Vercel'da qo'shimcha o'zgaruvchi kiritish shart emas.
 *
 * Supabase URL va publishable kalit ommaviy (brauzerga baribir ketadi),
 * shuning uchun shu yerda turadi. Kerak bo'lsa env orqali almashtirish mumkin.
 *
 * Vercel'da FAQAT bitta maxfiy kalit kerak: SUPABASE_SERVICE_ROLE_KEY.
 */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://olgrimictocmxhhwragu.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZ3JpbWljdG9jbXhoaHdyYWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMzY5NDMsImV4cCI6MjEwMzgxMjk0M30.ryZgiw1eCu-h2V_h2fUKBuVO1HIb0Zg7XDSZ9GtfqYU";

/** Asosiy (foydalanuvchi) sayt manzili. */
export const USER_SITE_URL = (process.env.NEXT_PUBLIC_USER_SITE_URL || "https://yoshlarwiki.uz").replace(
  /\/+$/,
  "",
);
