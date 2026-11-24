import "server-only";

import { sanitizeAnswers } from "./anketa";
import type { Anketa } from "./anketa-server";
import { escapeHtml, getBotSettings, tg } from "./telegram";

/** Kanal havolasini chat_id ko'rinishiga keltiradi: t.me/abc → @abc, -100… o'zgarmaydi. */
export function normalizeChannel(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^-100\d{5,}$/.test(v)) return v;
  const name = v
    .replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i, "")
    .replace(/^@+/, "")
    .replace(/[/?#].*$/, "");
  return /^[A-Za-z][A-Za-z0-9_]{3,}$/.test(name) ? `@${name}` : "";
}

function postLink(channel: string, messageId: number, username?: string): string {
  if (username) return `https://t.me/${username}/${messageId}`;
  if (channel.startsWith("@")) return `https://t.me/${channel.slice(1)}/${messageId}`;
  return `https://t.me/c/${channel.replace(/^-100/, "")}/${messageId}`;
}

const VISIBLE_LIMIT = 1024; // Telegram rasm osti matni chegarasi

const visibleLength = (html: string) =>
  html.replace(/<[^>]+>/g, "").replace(/&(amp|lt|gt|quot);/g, "x").length;

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length;

/** Gap oxiriga nuqta. */
const dot = (t: string) => (/[.!?…]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);

/** Birinchi harfni kichik qiladi (atoqli ot / qisqartma bo'lmasa). */
function lowerFirst(t: string) {
  const w = t.trim().split(/\s+/)[0] ?? "";
  if (w.length > 1 && w === w.toUpperCase()) return t.trim(); // IT, TATU
  return t.trim().charAt(0).toLowerCase() + t.trim().slice(1);
}

/** O'rin-payt qo'shimchasi: "Samarqand" → "Samarqandda", "universiteti" → "universitetida". */
const locative = (place: string) => `${place.trim().replace(/[.,;]+$/, "")}da`;

/** Birinchi shaxsdagi gaplarni ajratish ("men", "-man", "-dim"…). */
const FIRST_PERSON = /(^|\s)(men|mening|meni|menga|mendan)(\s|[,.!?]|$)|[a-zʻʼ]+(ganman|yapman|moqdaman|aman|ayman|dim|man)(\s|[,.!?]|$)/i;

/**
 * Nomzod ma'lumotlaridan uchinchi shaxsdagi rasmiy matn (≈120–130 so'z).
 * Hech qanday {} yoki yorliq yo'q — faqat bog'langan gaplar.
 */
export function buildOfficialText(anketa: Anketa, maxWords = 130): string {
  const a = sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);
  const name = a.full_name || anketa.full_name;
  const parts = name.split(/\s+/);
  const firstName = parts[1] || parts[0];
  const s: string[] = [];

  // Tug'ilgan sana va joy
  if (a.birth_date || a.birth_place) {
    const [y, m, d] = a.birth_date.split("-");
    const date = y && m && d ? `${y}-yil ${Number(d)}-${MONTHS[Number(m) - 1] ?? ""}` : "";
    if (date && a.birth_place) s.push(`${name} ${date}da ${locative(a.birth_place)} tugʻilgan.`);
    else if (date) s.push(`${name} ${date}da tugʻilgan.`);
    else s.push(`${name} ${locative(a.birth_place)} tugʻilgan.`);
  }

  // Ta'lim
  if (a.study_place) {
    s.push(
      a.study_direction
        ? `U ${locative(a.study_place)} «${a.study_direction}» yoʻnalishi boʻyicha taʼlim olgan.`
        : `U ${locative(a.study_place)} taʼlim olgan.`,
    );
  }

  // Hozirgi faoliyat
  if (a.activity) s.push(`Hozirda ${lowerFirst(a.activity.replace(/[.]+$/, ""))} sifatida faoliyat yuritib kelmoqda.`);

  // O'zi haqidagi matndan — uchinchi shaxsdagi gaplar
  const aboutSentences = (a.about.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [])
    .map((x) => x.trim())
    .filter((x) => x.length > 15 && !FIRST_PERSON.test(x));

  // Tajriba
  const exp = a.experience.filter((x) => x.title).slice(0, 3);
  if (exp.length) {
    const list = exp.map((x) => (x.year ? `${x.title} (${x.year})` : x.title));
    s.push(`Mehnat faoliyati davomida ${list.join(", ")} kabi tajribalarga ega boʻlgan.`);
  }

  // Yutuqlar
  const ach = a.achievements.filter((x) => x.title).slice(0, 3);
  if (ach.length) {
    const list = ach.map((x) => (x.year ? `${x.title} (${x.year})` : x.title));
    s.push(
      ach.length === 1
        ? `Uning muhim yutuqlaridan biri — ${lowerFirst(list[0])}.`
        : `Erishgan yutuqlari orasida ${list.join(", ")} alohida eʼtiborga loyiq.`,
    );
  }

  // Loyihalar
  const proj = a.projects.filter((x) => x.title).slice(0, 3);
  if (proj.length) {
    s.push(
      proj.length === 1
        ? `Shuningdek, u «${proj[0].title}» loyihasi muallifi hisoblanadi.`
        : `Shuningdek, u ${proj.map((x) => `«${x.title}»`).join(", ")} loyihalarini amalga oshirgan.`,
    );
  }

  const closing = `YoshlarWiki jamoasi ${firstName}ga kelgusi faoliyatida yangi marralar va muvaffaqiyatlar tilaydi.`;

  // O'zi haqidagi gaplarni faoliyatdan keyin, so'z chegarasigacha qo'shamiz.
  const insertAt = Math.min(s.length, a.activity ? s.findIndex((x) => x.startsWith("Hozirda")) + 1 : s.length);
  const base = [...s];
  let text = [...base, closing].join(" ");
  const extra: string[] = [];
  for (const sentence of aboutSentences) {
    const candidate = [...base.slice(0, insertAt), ...extra, dot(sentence), ...base.slice(insertAt), closing].join(" ");
    if (wordCount(candidate) > maxWords) break;
    extra.push(dot(sentence));
    text = candidate;
  }

  // Juda uzun bo'lsa — oxiridagi bo'limlarni qisqartiramiz.
  const all = [...base.slice(0, insertAt), ...extra, ...base.slice(insertAt)];
  while (wordCount([...all, closing].join(" ")) > maxWords && all.length > 1) all.pop();
  text = [...all, closing].join(" ");

  return text;
}

/**
 * Post: F.I.Sh (profil havolasi) → "YoshlarWiki ensiklopediyasi a'zosi" →
 * rasmiy matn → ariza taklifi → Instagram | Telegram.
 */
export function buildCaption(
  anketa: Anketa,
  profileUrl: string,
  links: { instagram?: string | null; telegram?: string | null; apply?: string | null },
  officialText?: string | null,
): string {
  const a = sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);
  const name = a.full_name || anketa.full_name;
  const e = escapeHtml;

  const head = `<a href="${e(profileUrl)}"><b>${e(name)}</b></a>\n<i>YoshlarWiki ensiklopediyasi aʼzosi</i>`;
  const invite = links.apply
    ? `YOSHLARWIKI.UZ ensiklopediyasiga kirish uchun <a href="${e(links.apply)}">ushbu havolani bosish orqali ariza qoldiring</a>.`
    : "";
  const footer = [
    links.instagram ? `<a href="${e(links.instagram)}">Instagram</a>` : "",
    links.telegram ? `<a href="${e(links.telegram)}">Telegram</a>` : "",
  ]
    .filter(Boolean)
    .join("  |  ");

  const compose = (body: string) => [head, e(body), invite, footer].filter(Boolean).join("\n\n");

  // Telegram chegarasiga sig'guncha so'z sonini kamaytiramiz.
  for (let words = 130; words >= 40; words -= 5) {
    const body =
      officialText && wordCount(officialText) <= words ? officialText : buildOfficialText(anketa, words);
    const html = compose(body);
    if (visibleLength(html) <= VISIBLE_LIMIT) return html;
  }
  return compose(buildOfficialText(anketa, 40));
}

/**
 * Ixtiyoriy: ANTHROPIC_API_KEY bo'lsa — 2–3 gaplik rasmiy tavsif yozdiramiz.
 * Bo'lmasa yoki xato bo'lsa — nomzodning o'z tavsifi ishlatiladi.
 */
async function writeOfficialIntro(anketa: Anketa): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const a = sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 900,
        system:
          "Siz ensiklopediya muharririsiz. Berilgan maʼlumotlar asosida oʻzbek tilida (lotin, oʻ/gʻ uchun ʻ belgisi) shaxs haqida 110–125 soʻzlik chiroyli, RASMIY matn yozing: uchinchi shaxsda, bogʻlangan gaplar bilan (roʻyxat, yorliq, emoji, qavslar {} yoʻq), faqat berilgan faktlar, 850 belgidan oshmasin. Oxirida YoshlarWiki jamoasining qisqa tilagi boʻlsin. Faqat matnni qaytaring.",
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              ism: a.full_name,
              faoliyat: a.activity,
              haqida: a.about,
              tugilgan: [a.birth_date, a.birth_place].filter(Boolean).join(", "),
              talim: [a.study_place, a.study_direction].filter(Boolean).join(", "),
              tajriba: a.experience.map((x) => x.title),
              yutuqlar: a.achievements.map((x) => x.title),
              loyihalar: a.projects.map((x) => x.title),
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    return text && text.length > 40 && !/[{}]/.test(text) ? text : null;
  } catch {
    return null;
  }
}

export async function postToChannel(
  anketa: Anketa,
  profileUrl: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const settings = await getBotSettings();
  if (!settings?.bot_token || !settings.connected_at) return { ok: false, message: "Bot ulanmagan." };
  const channel = settings.channel ? normalizeChannel(settings.channel) : "";
  if (!channel) return { ok: false, message: "Telegram kanal kiritilmagan." };

  const photo = anketa.photo_white_url || anketa.photo_url;
  if (!photo) return { ok: false, message: "Rasm yoʻq." };

  const res = await tg<{ message_id: number; chat: { username?: string } }>(settings.bot_token, "sendPhoto", {
    chat_id: channel,
    photo,
    caption: buildCaption(
      anketa,
      profileUrl,
      { instagram: settings.instagram_url, telegram: settings.telegram_url, apply: settings.apply_url },
      await writeOfficialIntro(anketa),
    ),
    parse_mode: "HTML",
  });

  if (!res.ok || !res.result) {
    return { ok: false, message: `Kanalga yuborilmadi: ${res.description ?? "xato"} (bot kanalga admin qilinganmi?)` };
  }
  return { ok: true, url: postLink(channel, res.result.message_id, res.result.chat?.username) };
}
