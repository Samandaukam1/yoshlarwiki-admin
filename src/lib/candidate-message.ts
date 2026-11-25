/**
 * Profil chop etilgach nomzodga yuboriladigan xabar.
 * WEB SAHIFA va TELEGRAM ostida F.I.Sh yoziladi, havola uning ichida bo'ladi.
 * Server (bot) va brauzer (nusxalash tugmasi) uchun umumiy.
 */

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Telegram HTML (parse_mode: HTML). */
export function candidateMessageHtml(name: string, profileUrl: string, postUrl: string | null): string {
  return [
    "🎉 <b>Tabriklaymiz! Sizning profilingiz chop etildi</b>",
    "",
    "🌐 <b>WEB SAHIFA</b>",
    `<a href="${esc(profileUrl)}">${esc(name)}</a>`,
    ...(postUrl ? ["", "✈️ <b>TELEGRAM</b>", `<a href="${esc(postUrl)}">${esc(name)}</a>`] : []),
    "",
    "<i>YoshlarWiki — Yoshlar ensiklopediyasi</i>",
  ].join("\n");
}

/** Nusxalash uchun boy matn (HTML) — Telegram'ga qo'yilganda havolalar F.I.Sh ichida qoladi. */
export function candidateMessageRich(name: string, profileUrl: string, postUrl: string | null): string {
  return candidateMessageHtml(name, profileUrl, postUrl).replace(/\n/g, "<br>");
}

/** Oddiy matn (boy matn qo'llab-quvvatlanmasa) — havolalar ochiq yoziladi. */
export function candidateMessagePlain(name: string, profileUrl: string, postUrl: string | null): string {
  return [
    "🎉 Tabriklaymiz! Sizning profilingiz chop etildi",
    "",
    "🌐 WEB SAHIFA",
    `${name}: ${profileUrl}`,
    ...(postUrl ? ["", "✈️ TELEGRAM", `${name}: ${postUrl}`] : []),
    "",
    "YoshlarWiki — Yoshlar ensiklopediyasi",
  ].join("\n");
}
