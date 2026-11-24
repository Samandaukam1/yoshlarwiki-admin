import "server-only";

import type { AnketaAnswers } from "./anketa";
import { fixTypos } from "./uz-typos";

/* ================================================================== */
/* 1. Qoidaga asoslangan imlo tuzatish (har doim ishlaydi)            */
/* ================================================================== */

const OKINA = "ʻ"; // oʻ, gʻ
const TUTUQ = "ʼ"; // aʼlo, maʼlumot

/** Tez-tez noto'g'ri yoziladigan so'zlar (kichik harfda). */
const DICTIONARY: Record<string, string> = {
  ozbekiston: "Oʻzbekiston",
  uzbekiston: "Oʻzbekiston",
  "o'zbekiston": "Oʻzbekiston",
  toshkent: "Toshkent",
  tashkent: "Toshkent",
  samarqand: "Samarqand",
  samarkand: "Samarqand",
  buxoro: "Buxoro",
  bukhara: "Buxoro",
  andijon: "Andijon",
  fargona: "Fargʻona",
  "farg'ona": "Fargʻona",
  namangan: "Namangan",
  qarshi: "Qarshi",
  navoiy: "Navoiy",
  jizzax: "Jizzax",
  guliston: "Guliston",
  termiz: "Termiz",
  urganch: "Urganch",
  xorazm: "Xorazm",
  nukus: "Nukus",
  "qoraqalpogiston": "Qoraqalpogʻiston",
  "qoraqalpog'iston": "Qoraqalpogʻiston",
  qashqadaryo: "Qashqadaryo",
  surxondaryo: "Surxondaryo",
  sirdaryo: "Sirdaryo",
  malumot: "maʼlumot",
  malumotlar: "maʼlumotlar",
  "ma'lumot": "maʼlumot",
  alo: "aʼlo",
  talim: "taʼlim",
  "ta'lim": "taʼlim",
  mutaxasis: "mutaxassis",
  mutaxasislik: "mutaxassislik",
  universitet: "universitet",
  univeritet: "universitet",
  unversitet: "universitet",
  institud: "institut",
  prizident: "prezident",
  prezedent: "prezident",
  volontyor: "volontyor",
  volonter: "volontyor",
  sertifkat: "sertifikat",
  sertefikat: "sertifikat",
  grand: "grant",
  dasturchi: "dasturchi",
  yutuq: "yutuq",
  yutiq: "yutuq",
  loyixa: "loyiha",
  loyixalar: "loyihalar",
  loyixam: "loyiham",
  tajriba: "tajriba",
  tajriyba: "tajriba",
  hozirda: "hozirda",
  soxa: "soha",
  soxasi: "sohasi",
  soxasida: "sohasida",
  soxada: "sohada",
  maktabni: "maktabni",
  xozirda: "hozirda",
  xozir: "hozir",
  xam: "ham",
  xamda: "hamda",
  xar: "har",
  bilan: "bilan",
  bilam: "bilan",
  rahmat: "rahmat",
  raxmat: "rahmat",
  instagram: "Instagram",
  telegram: "Telegram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  github: "GitHub",
  it: "IT",
  ai: "AI",
};

function keepCase(original: string, replacement: string) {
  if (original[0] && original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/** Bitta matnni tozalaydi: apostroflar, bo'shliqlar, tinish belgilari, bosh harflar. */
export function fixUzbekText(input: string, options: { typos?: boolean } = {}): string {
  if (!input) return "";
  let s = input.replace(/\r\n?/g, "\n");

  // Havolalar va @username'larni himoya qilamiz.
  const vault: string[] = [];
  s = s.replace(/(https?:\/\/\S+|www\.\S+|\S+@\S+\.\w+|@\w[\w.]*|\b[\w-]+\.(?:uz|com|org|net|io|ru|me|dev|ai|app)\b\S*)/gi, (m) => {
    vault.push(m);
    return `\u0000${vault.length - 1}\u0000`;
  });

  // oʻ / gʻ — har xil apostroflarni bir xil belgiga keltirish
  s = s.replace(/([oOgG])['`´‘’ʼʹ′]/g, `$1${OKINA}`);
  // qolgan harf + apostrof → tutuq belgisi (maʼlumot, taʼlim)
  s = s.replace(/([a-zA-Z])['`´‘’ʹ′](?=[a-zA-Z])/g, `$1${TUTUQ}`);

  // Lug'at bo'yicha so'zlar
  s = s.replace(/[A-Za-zʻʼ']+/g, (word) => {
    const key = word.toLowerCase().replace(/[ʻʼ]/g, "'");
    const plain = key.replace(/'/g, "");
    const hit = DICTIONARY[key] ?? DICTIONARY[plain];
    if (!hit) return word;
    // Atoqli otlar va brendlar har doim katta harf bilan
    if (hit[0] === hit[0].toUpperCase()) return hit;
    return keepCase(word, hit);
  });

  // Harflari almashgan / xato yozilgan so'zlar (lug'at asosida)
  if (options.typos !== false) s = fixTypos(s);

  // Bo'shliq va tinish belgilari
  s = s
    .replace(/[ \t]+/g, " ")
    .replace(/ +([,.;:!?)])/g, "$1")
    .replace(/([(]) +/g, "$1")
    .replace(/([,;:])(?=[^\s\d\u0000])/g, "$1 ")
    .replace(/([.!?])(?=[A-Za-zА-Яа-яʻ])/g, "$1 ")
    .replace(/,{2,}/g, ",")
    .replace(/\.{4,}/g, "...")
    .replace(/!{2,}/g, "!")
    .replace(/\?{2,}/g, "?")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();

  // Gap boshini katta harf bilan
  s = s.replace(/(^|[.!?]\s+|\n)([a-zа-яё])/g, (_, p, c: string) => p + c.toUpperCase());

  // Himoyalangan qismlarni qaytarish
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => vault[Number(i)]);
  return s;
}

/** Ism-sharif: har bir so'z katta harf bilan, apostroflar to'g'ri. */
export function fixName(input: string): string {
  return fixUzbekText(input, { typos: false })
    .replace(/[.!?]+$/, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      // Otasining ismi qo'shimchalari kichik harf bilan: "Akmal oʻgʻli", "Akmal qizi"
      if (["oʻgʻli", "qizi", "ugli", "o'g'li"].includes(lower)) return lower === "ugli" ? "oʻgʻli" : lower;
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function fixUrl(url: string): string {
  const u = url.trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, "")}`;
}

/** Barcha javoblarni qoidalar asosida tuzatadi. */
export function polishRuleBased(a: AnketaAnswers): AnketaAnswers {
  const line = (s: string) => fixUzbekText(s).replace(/\n+/g, " ");
  return {
    ...a,
    full_name: fixName(a.full_name),
    birth_place: line(a.birth_place),
    activity: line(a.activity).replace(/\.$/, ""),
    about: fixUzbekText(a.about),
    study_place: line(a.study_place),
    study_direction: line(a.study_direction),
    experience: a.experience
      .filter((x) => x.title.trim())
      .map((x) => ({
        year: x.year.trim(),
        title: line(x.title),
        description: fixUzbekText(x.description),
      })),
    achievements: a.achievements
      .filter((x) => x.title.trim())
      .map((x) => ({ title: line(x.title), year: x.year.trim() })),
    projects: a.projects
      .filter((x) => x.title.trim())
      .map((x) => ({
        title: line(x.title),
        url: fixUrl(x.url),
        description: fixUzbekText(x.description),
      })),
    socials: a.socials
      .filter((x) => x.url.trim())
      .map((x) => ({ platform: x.platform, url: fixUrl(x.url) })),
    extra: fixUzbekText(a.extra),
  };
}

/* ================================================================== */
/* 2. Avto SEO / Open Graph                                           */
/* ================================================================== */

export type AnketaSeo = {
  title: string; // profil sarlavhasi (lavozim)
  intro: string;
  seo_title: string;
  seo_description: string;
  og_title: string;
  og_description: string;
  keywords: string[];
};

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,.;:\s]+$/, "")}…`;
}

function firstSentences(text: string, max: number): string {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]?/g) ?? [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > max) break;
    out += s;
  }
  return (out || clip(text, max)).trim();
}

export function buildSeo(a: AnketaAnswers): AnketaSeo {
  const name = a.full_name;
  const role = clip(a.activity || a.study_direction || "Yosh iqtidor", 70);
  const intro = firstSentences(a.about || role, 220);

  const descParts = [
    a.about ? firstSentences(a.about, 120) : `${name} — ${role}.`,
    a.study_place ? `Taʼlim: ${a.study_place}.` : "",
    a.achievements[0]?.title ? `Yutuq: ${a.achievements[0].title}.` : "",
  ].filter(Boolean);

  const keywords = Array.from(
    new Set(
      [
        name,
        ...name.split(" "),
        a.activity,
        a.study_place,
        a.study_direction,
        a.birth_place,
        ...a.projects.map((p) => p.title),
        "YoshlarWiki",
        "yosh iqtidorlar",
        "Oʻzbekiston yoshlari",
      ]
        .map((k) => clip(k ?? "", 50))
        .filter((k) => k.length > 2),
    ),
  ).slice(0, 14);

  return {
    title: role,
    intro,
    seo_title: clip(`${name} — ${role}`, 60),
    seo_description: clip(descParts.join(" "), 158),
    og_title: clip(`${name} | YoshlarWiki`, 70),
    og_description: clip(a.about || `${name} — ${role}. YoshlarWiki’dagi profil.`, 200),
    keywords,
  };
}

/* ================================================================== */
/* 3. Ixtiyoriy: AI bilan chuqur tuzatish (ANTHROPIC_API_KEY bo'lsa)   */
/* ================================================================== */

type AiResult = { answers?: Partial<AnketaAnswers>; seo?: Partial<AnketaSeo> };

async function polishWithAi(a: AnketaAnswers): Promise<AiResult | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const payload = {
    full_name: a.full_name,
    birth_place: a.birth_place,
    activity: a.activity,
    about: a.about,
    study_place: a.study_place,
    study_direction: a.study_direction,
    experience: a.experience,
    achievements: a.achievements,
    projects: a.projects.map((p) => ({ title: p.title, description: p.description })),
    extra: a.extra,
  };

  const system = `Siz oʻzbek tili (lotin yozuvi) muharririsiz. Vazifa: matndagi imlo, tinish belgisi va bosh harf xatolarini tuzatish.
Qoidalar: maʼno, faktlar, raqamlar, nomlar va uslubni O'ZGARTIRMANG, yangi maʼlumot qoʻshmang, qisqartirmang. "oʻ" va "gʻ" uchun ʻ (U+02BB), tutuq belgisi uchun ʼ (U+02BC) ishlating.
Shuningdek SEO uchun: seo_title (≤60 belgi), seo_description (≤158), og_title (≤70), og_description (≤200), title (lavozim, ≤70), intro (1–2 gap), keywords (8–14 ta) yozing — faqat berilgan maʼlumotdan.
Javobni FAQAT JSON koʻrinishida bering: {"answers": {...xuddi shu kalitlar...}, "seo": {...}}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 4000,
        system,
        messages: [{ role: "user", content: JSON.stringify(payload) }],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return JSON.parse(json) as AiResult;
  } catch {
    return null;
  }
}

function pickString(value: unknown, fallback: string, max = 4000) {
  return typeof value === "string" && value.trim() ? value.slice(0, max) : fallback;
}

/**
 * Yuborilgan anketani tuzatadi va SEO yozadi.
 * Avval qoidalar, keyin (kalit bo'lsa) AI. AI xato qilsa — qoidalar natijasi qoladi.
 */
export async function polishAnketa(
  original: AnketaAnswers,
): Promise<{ answers: AnketaAnswers; seo: AnketaSeo; engine: "ai" | "rules" }> {
  const fixed = polishRuleBased(original);
  const seo = buildSeo(fixed);

  const ai = await polishWithAi(fixed);
  if (!ai?.answers) return { answers: fixed, seo, engine: "rules" };

  const x = ai.answers;
  const merged: AnketaAnswers = {
    ...fixed,
    full_name: fixName(pickString(x.full_name, fixed.full_name, 200)),
    birth_place: pickString(x.birth_place, fixed.birth_place, 200),
    activity: pickString(x.activity, fixed.activity, 600),
    about: pickString(x.about, fixed.about),
    study_place: pickString(x.study_place, fixed.study_place, 200),
    study_direction: pickString(x.study_direction, fixed.study_direction, 200),
    extra: pickString(x.extra, fixed.extra),
    experience: fixed.experience.map((item, i) => ({
      ...item,
      title: pickString(x.experience?.[i]?.title, item.title, 200),
      description: pickString(x.experience?.[i]?.description, item.description, 600),
    })),
    achievements: fixed.achievements.map((item, i) => ({
      ...item,
      title: pickString(x.achievements?.[i]?.title, item.title, 600),
    })),
    projects: fixed.projects.map((item, i) => ({
      ...item,
      title: pickString(x.projects?.[i]?.title, item.title, 200),
      description: pickString(x.projects?.[i]?.description, item.description, 600),
    })),
  };

  const s = ai.seo ?? {};
  const fresh = buildSeo(merged);
  return {
    answers: merged,
    engine: "ai",
    seo: {
      title: pickString(s.title, fresh.title, 70),
      intro: pickString(s.intro, fresh.intro, 300),
      seo_title: pickString(s.seo_title, fresh.seo_title, 70),
      seo_description: pickString(s.seo_description, fresh.seo_description, 170),
      og_title: pickString(s.og_title, fresh.og_title, 80),
      og_description: pickString(s.og_description, fresh.og_description, 220),
      keywords:
        Array.isArray(s.keywords) && s.keywords.length
          ? s.keywords.filter((k): k is string => typeof k === "string").slice(0, 14)
          : fresh.keywords,
    },
  };
}
