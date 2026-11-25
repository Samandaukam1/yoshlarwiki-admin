/**
 * Telegram post rasmi (shablon) uchun matnlar: F.I.Sh, taʼlim, yutuq.
 *
 * AI ishlatilmaydi — hammasi qoidalar asosida:
 *  - taʼlim: oʻqish joyi + yoʻnalish, ortiqcha soʻzlar olib tashlanadi,
 *    mashhur oliygohlar qisqartiriladi (TATU, OʻzMU…);
 *  - yutuq: eng kattasi tanlanadi (xalqaro → respublika → viloyat → tuman,
 *    gʻolib → sovrindor → sertifikat);
 *  - qutiga sigʻdirish: 2 qator, keyin shrift kichrayadi, oxirida soʻz
 *    chegarasida «…».
 *
 * Bu fayl toza TypeScript (server/brauzerga bogʻliq emas).
 */

import type { AnketaAnswers } from "./anketa";
import { GLYPH_WIDTHS } from "./post-metrics";

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                       */
/* ------------------------------------------------------------------ */

const APOSTROPHES = /[ʻʼ‘’`´']/g;

/** Taqqoslash uchun: kichik harf, barcha apostroflar → ', bo'shliqlar bitta. */
function norm(value: string): string {
  return value.toLowerCase().replace(APOSTROPHES, "'").replace(/\s+/g, " ").trim();
}

const tidy = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/^[\s,.;:–—-]+|[\s,.;:–—-]+$/g, "")
    .trim();

/* ------------------------------------------------------------------ */
/* Ta'lim                                                             */
/* ------------------------------------------------------------------ */

/** Mashhur oliygohlar → qisqartma. Kalitlar `norm()` ko'rinishida. */
const UNIVERSITIES: [RegExp, string][] = [
  [/toshkent axborot texnologiyalari universiteti/, "TATU"],
  [/o'zbekiston milliy universiteti|^milliy universitet(i)?$/, "OʻzMU"],
  [/toshkent davlat iqtisodiyot universiteti/, "TDIU"],
  [/toshkent davlat yuridik universiteti/, "TDYU"],
  [/toshkent davlat texnika universiteti/, "TDTU"],
  [/toshkent davlat sharqshunoslik universiteti/, "TDShU"],
  [/toshkent davlat pedagogika universiteti/, "TDPU"],
  [/toshkent davlat agrar universiteti/, "TDAU"],
  [/toshkent davlat transport universiteti/, "TDTrU"],
  [/toshkent tibbiyot akademiyasi/, "TTA"],
  [/toshkent pediatriya tibbiyot instituti/, "TashPMI"],
  [/toshkent kimyo[- ]texnologiya instituti/, "TKTI"],
  [/toshkent arxitektura[- ]qurilish (universiteti|instituti)/, "TAQU"],
  [/toshkent moliya instituti/, "TMI"],
  [/toshkent irrigatsiya va qishloq xo'jaligini mexanizatsiyalash muhandislari instituti/, "TIQXMMI"],
  [/(o'zbekiston )?davlat jahon tillari universiteti/, "OʻzDJTU"],
  [/jahon iqtisodiyoti va diplomatiya universiteti/, "JIDU"],
  [/(o'zbekiston )?davlat san'at va madaniyat instituti/, "OʻzDSMI"],
  [/(o'zbekiston )?davlat jismoniy tarbiya va sport universiteti/, "OʻzDJTSU"],
  [/samarqand davlat universiteti/, "SamDU"],
  [/samarqand davlat tibbiyot universiteti/, "SamDTU"],
  [/buxoro davlat universiteti/, "BuxDU"],
  [/andijon davlat universiteti/, "ADU"],
  [/andijon davlat tibbiyot instituti/, "ADTI"],
  [/farg'ona davlat universiteti/, "FarDU"],
  [/namangan davlat universiteti/, "NamDU"],
  [/qarshi davlat universiteti/, "QarDU"],
  [/urganch davlat universiteti/, "UrDU"],
  [/termiz davlat universiteti/, "TerDU"],
  [/jizzax davlat pedagogika (universiteti|instituti)/, "JDPU"],
  [/guliston davlat universiteti/, "GulDU"],
  [/navoiy davlat (pedagogika instituti|universiteti)/, "NavDU"],
  [/qoraqalpoq davlat universiteti/, "QDU"],
  [/westminster (international )?university/, "WIUT"],
  [/inha university/, "IUT"],
  [/turin polytechnic|turin politexnika/, "TTPU"],
  [/amity university/, "Amity"],
  [/webster university/, "Webster"],
];

/** "Muhammad al-Xorazmiy nomidagi …" — "nomidagi"gacha bo'lgan qism olib tashlanadi. */
function dropNamedAfter(value: string): string {
  const i = norm(value).indexOf(" nomidagi ");
  if (i < 0) return value;
  // norm() uzunlikni deyarli saqlaydi (faqat bo'shliqlar) — ehtiyot uchun so'z bo'yicha kesamiz.
  const words = value.trim().split(/\s+/);
  const idx = words.findIndex((w) => norm(w) === "nomidagi");
  return idx >= 0 ? words.slice(idx + 1).join(" ") : value;
}

function shortInstitution(place: string): string {
  const cleaned = tidy(dropNamedAfter(place));
  const n = norm(cleaned);
  for (const [re, short] of UNIVERSITIES) {
    if (re.test(n)) return short;
  }
  return cleaned;
}

/** Yo'nalishdagi ortiqcha so'zlar. */
const DIRECTION_NOISE = [
  /\b\d+\s*-?\s*kurs\b/gi,
  /\btalabasi\b/gi,
  /\bbitiruvchisi\b/gi,
  /\bmagistranti\b/gi,
  /\bmagistratura\b/gi,
  /\bbakalavriat\b/gi,
  /\byo[ʻʼ‘’`']?nalishi(\s+bo[ʻʼ‘’`']?yicha)?\b/gi,
  /\bmutaxassisligi\b/gi,
  /\bfakulteti\b/gi,
];

function shortDirection(direction: string): string {
  let d = direction;
  for (const re of DIRECTION_NOISE) d = d.replace(re, " ");
  return tidy(d.replace(/[«»"]/g, ""));
}

/** 2-quti: o'qish joyi (qisqartma bilan) + yo'nalish. */
export function educationLine(a: AnketaAnswers): string {
  const place = a.study_place.trim() ? shortInstitution(a.study_place) : "";
  const direction = a.study_direction.trim() ? shortDirection(a.study_direction) : "";
  if (place && direction && norm(place) !== norm(direction)) return `${place}, ${direction}`;
  return place || direction;
}

/* ------------------------------------------------------------------ */
/* Yutuq                                                              */
/* ------------------------------------------------------------------ */

const LEVEL_SCORES: [RegExp, number][] = [
  [/xalqaro|international|jahon|world|osiyo|asia|yevropa|europe|olimpiada o'yinlari/, 50],
  [/respublika|milliy|o'zbekiston|national|prezident/, 35],
  [/viloyat|shahar|regional/, 20],
  [/tuman|maktab|universitet ichida/, 8],
];

const RANK_SCORES: [RegExp, number][] = [
  [/g'olib|1[- ]?o'rin|birinchi o'rin|oltin|chempion|winner|gold|1st/, 25],
  [/2[- ]?o'rin|ikkinchi o'rin|kumush|silver|2nd/, 18],
  [/3[- ]?o'rin|uchinchi o'rin|bronza|bronze|3rd|sovrindor|medal/, 14],
  [/grant|stipendiya|mukofot|nishon|orden|diplom|laureat|award|scholarship/, 16],
  [/sertifikat|certificate|ishtirokchi|participant/, 3],
];

function achievementScore(title: string): number {
  const t = norm(title);
  let score = 0;
  for (const [re, s] of LEVEL_SCORES) {
    if (re.test(t)) {
      score += s;
      break;
    }
  }
  for (const [re, s] of RANK_SCORES) {
    if (re.test(t)) {
      score += s;
      break;
    }
  }
  return score;
}

/** 3-quti: eng katta yutuq. Yutuq bo'lmasa — "" (quti chiqmaydi). */
export function achievementLine(a: AnketaAnswers): string {
  if (a.skipped.includes("achievements")) return "";
  const items = a.achievements.map((x) => tidy(x.title)).filter((x) => x.length > 1);
  if (!items.length) return "";
  let best = items[0];
  let bestScore = achievementScore(best);
  for (const item of items.slice(1)) {
    const s = achievementScore(item);
    if (s > bestScore) {
      best = item;
      bestScore = s;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Qutiga sig'dirish                                                  */
/* ------------------------------------------------------------------ */

export type FontWeightKey = "bold" | "semibold";

const FALLBACK_WIDTH = 0.6;

export function textWidth(text: string, size: number, weight: FontWeightKey): number {
  const table = GLYPH_WIDTHS[weight];
  let w = 0;
  for (const ch of text) w += table[ch] ?? FALLBACK_WIDTH;
  return w * size;
}

/** So'z bo'yicha qatorlarga bo'lish. Juda uzun so'z harf bo'yicha bo'linadi. */
export function wrapText(text: string, size: number, maxWidth: number, weight: FontWeightKey): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  const pushLongWord = (word: string) => {
    let chunk = "";
    for (const ch of word) {
      if (textWidth(chunk + ch, size, weight) > maxWidth && chunk) {
        lines.push(chunk);
        chunk = ch;
      } else chunk += ch;
    }
    return chunk;
  };

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, size, weight) <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = textWidth(word, size, weight) > maxWidth ? pushLongWord(word) : word;
  }
  if (line) lines.push(line);
  return lines;
}

export type FittedText = { lines: string[]; size: number };

/**
 * Matnni qutiga joylaydi: avval katta shriftda 2 qator; sig'masa shrift
 * kichrayadi (kichik shriftda 3 qatorgacha); baribir sig'masa — oxirgi
 * qator so'z chegarasida «…» bilan kesiladi.
 */
export function fitText(
  text: string,
  opts: {
    maxWidth: number;
    maxSize: number;
    minSize: number;
    weight: FontWeightKey;
    /** Shu o'lchamdan kichik shriftda 3 qatorga ruxsat. */
    threeLinesBelow?: number;
  },
): FittedText {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return { lines: [], size: opts.maxSize };

  for (let size = opts.maxSize; size >= opts.minSize; size -= 2) {
    const lines = wrapText(clean, size, opts.maxWidth, opts.weight);
    const allowed = opts.threeLinesBelow && size <= opts.threeLinesBelow ? 3 : 2;
    if (lines.length <= allowed) return { lines, size };
  }

  const size = opts.minSize;
  const maxLines = opts.threeLinesBelow && size <= opts.threeLinesBelow ? 3 : 2;
  const lines = wrapText(clean, size, opts.maxWidth, opts.weight).slice(0, maxLines);
  // Oxirgi qatorga «…» sig'guncha so'zlarni olib tashlaymiz.
  let last = lines[maxLines - 1] ?? "";
  while (last && textWidth(`${last}…`, size, opts.weight) > opts.maxWidth) {
    const cut = last.lastIndexOf(" ");
    last = cut > 0 ? last.slice(0, cut) : last.slice(0, -1);
  }
  lines[maxLines - 1] = `${last.replace(/[\s,.;:–—-]+$/, "")}…`;
  return { lines, size };
}
