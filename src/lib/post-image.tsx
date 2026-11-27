import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { sanitizeAnswers, type AnketaAnswers } from "./anketa";
import type { Anketa } from "./anketa-server";
import { SUPABASE_URL } from "./config";
import { preparePortrait } from "./portrait-crop";
import { fitText, postSentences, wrapText, type FittedText } from "./post-text";

/* ------------------------------------------------------------------ */
/* Shablon o'lchamlari (src/assets/post/template.jpg — 1254×1254)     */
/*  - chap tepada logo, chap pastda shahar manzarasi (≈ y 830 dan)    */
/*  - o'ng tomon bo'sh — nomzod rasmi                                 */
/* ------------------------------------------------------------------ */

const SIZE = 1254;

/** Chap ustun: F.I.Sh + qisqa matn. Pastki cheti shahar rasmining biroz tepasida. */
const TEXT = { left: 74, width: 470, bottom: 800, top: 190 };

/** Nomzod rasmi: o'ng tomonda, pastga tekislangan (bel — rasm pastki chetida). */
const PORTRAIT = { centerX: 905, maxWidth: 700, maxHeight: 1090, minLeft: 548 };

/* ------------------------------------------------------------------ */
/* Fayllar (bir marta o'qiladi)                                       */
/* ------------------------------------------------------------------ */

const ASSETS = join(process.cwd(), "src/assets/post");

let assets: Promise<{ template: string; bold: ArrayBuffer; semibold: ArrayBuffer }> | null = null;

const toArrayBuffer = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

function loadAssets() {
  if (!assets) {
    assets = (async () => {
      const [template, bold, semibold] = await Promise.all([
        readFile(join(ASSETS, "template.jpg")),
        readFile(join(ASSETS, "Inter-Bold.otf")),
        readFile(join(ASSETS, "Inter-SemiBold.otf")),
      ]);
      return {
        template: `data:image/jpeg;base64,${template.toString("base64")}`,
        bold: toArrayBuffer(bold),
        semibold: toArrayBuffer(semibold),
      };
    })();
    assets.catch(() => {
      assets = null;
    });
  }
  return assets;
}

/* ------------------------------------------------------------------ */
/* Rasm o'lchamini aniqlash (PNG / JPEG / WebP)                       */
/* ------------------------------------------------------------------ */

function imageInfo(buf: Buffer): { mime: string; width: number; height: number } | null {
  // PNG
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { mime: "image/png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG — SOF markerini qidiramiz
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { mime: "image/jpeg", height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return null;
  }
  // WebP
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return { mime: "image/webp", width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    }
    if (chunk === "VP8 ") {
      return { mime: "image/webp", width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { mime: "image/webp", width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

/**
 * Nomzod rasmi: fonsiz PNG bo'lsa — beligacha kesiladi va chetlari tozalanadi.
 * Eski profillar ham shu yerdan o'tadi — qayta yuklash shart emas.
 */
async function loadPortrait(url: string) {
  const portraitUrl = new URL(url);
  if (portraitUrl.origin !== new URL(SUPABASE_URL).origin ||
      !portraitUrl.pathname.startsWith("/storage/v1/object/public/")) {
    throw new Error("Portret Supabase Storage’dan yuklanishi kerak.");
  }
  const res = await fetch(portraitUrl, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Rasm yuklanmadi (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());

  const prepared = preparePortrait(buf);
  if (prepared) {
    return { src: `data:image/png;base64,${prepared.png.toString("base64")}`, width: prepared.width, height: prepared.height };
  }

  const info = imageInfo(buf);
  if (!info || !info.width || !info.height) throw new Error("Rasm formati notanish.");
  return { src: `data:${info.mime};base64,${buf.toString("base64")}`, ...info };
}

/* ------------------------------------------------------------------ */
/* Matnlar                                                            */
/* ------------------------------------------------------------------ */

/**
 * Ixtiyoriy: ANTHROPIC_API_KEY bo'lsa — 3–4 qisqa gapni AI yozadi.
 * Bo'lmasa yoki natija mos kelmasa — qoidalar asosidagi gaplar.
 */
async function writeSentences(a: AnketaAnswers): Promise<string[]> {
  const fallback = postSentences(a);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallback;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 400,
        system:
          "Siz ensiklopediya muharririsiz. Berilgan maʼlumotlar asosida oʻzbek tilida (lotin, oʻ/gʻ uchun ʻ belgisi) shaxs haqida 3 yoki 4 ta QISQA gap yozing: har biri 5–12 soʻz, uchinchi shaxsda, rasmiy uslubda, faqat berilgan faktlar. Shaxs ismini yozmang (u alohida yoziladi). Roʻyxat belgisi, emoji, qavs yoʻq. Jami 300 belgidan oshmasin. Har bir gap alohida qatorda. Faqat gaplarni qaytaring.",
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              faoliyat: a.activity,
              haqida: a.about,
              tugilgan_joy: a.birth_place,
              talim: [a.study_place, a.study_direction].filter(Boolean).join(", "),
              tajriba: a.experience.map((x) => x.title),
              yutuqlar: a.skipped.includes("achievements") ? [] : a.achievements.map((x) => x.title),
              loyihalar: a.projects.map((x) => x.title),
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
    const lines = text
      .split(/\n+/)
      .map((l) => l.replace(/^[\s\-–—•*\d.)]+/, "").trim())
      .filter(Boolean);
    const total = lines.join(" ").length;
    if (lines.length < 2 || lines.length > 4 || total > 340 || /[{}<>]/.test(text)) return fallback;
    return lines;
  } catch {
    return fallback;
  }
}

export type PostTexts = { name: FittedText; body: FittedText };

const BODY = { maxSize: 30, minSize: 23, lineHeight: 1.42, maxLines: 10 };
const NAME_GAP = 26; // F.I.Sh va matn orasidagi joy (chiziq bilan)

/** F.I.Sh (qalin) + qisqa matn — chap ustunga sig'adigan qilib. */
function layoutTexts(name: string, sentences: string[]): PostTexts {
  const nameFit = fitText(name, { maxWidth: TEXT.width, maxSize: 54, minSize: 36, weight: "bold" });
  const nameHeight = nameFit.lines.length * nameFit.size * 1.12;
  const room = TEXT.bottom - TEXT.top - nameHeight - NAME_GAP;

  let list = sentences.slice();
  while (list.length) {
    const body = list.join(" ");
    for (let size = BODY.maxSize; size >= BODY.minSize; size -= 1) {
      const lines = wrapText(body, size, TEXT.width, "semibold");
      if (lines.length <= BODY.maxLines && lines.length * size * BODY.lineHeight <= room) {
        return { name: nameFit, body: { lines, size } };
      }
    }
    list = list.slice(0, -1); // sig'masa — oxirgi gap tushib qoladi
  }
  return { name: nameFit, body: { lines: [], size: BODY.maxSize } };
}

export async function postTexts(anketa: Anketa): Promise<PostTexts> {
  const a = sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);
  const name = (a.full_name || anketa.full_name).replace(/\s+/g, " ").trim();
  return layoutTexts(name, await writeSentences(a));
}

const TEXT_SHADOW = "0 2px 12px rgba(0, 20, 90, 0.45)";

function TextColumn({ texts }: { texts: PostTexts }) {
  return (
    <div
      style={{
        position: "absolute",
        left: TEXT.left,
        top: TEXT.top,
        width: TEXT.width,
        height: TEXT.bottom - TEXT.top,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {texts.name.lines.map((line, i) => (
        <div
          key={`n${i}`}
          style={{
            display: "flex",
            color: "#ffffff",
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: texts.name.size,
            lineHeight: 1.12,
            letterSpacing: -0.5,
            textShadow: TEXT_SHADOW,
            whiteSpace: "nowrap",
          }}
        >
          {line}
        </div>
      ))}
      {texts.body.lines.length ? (
        <div
          style={{
            display: "flex",
            width: 72,
            height: 4,
            borderRadius: 2,
            marginTop: 11,
            marginBottom: NAME_GAP - 15,
            background: "rgba(255, 255, 255, 0.75)",
          }}
        />
      ) : null}
      {texts.body.lines.map((line, i) => (
        <div
          key={`b${i}`}
          style={{
            display: "flex",
            color: "rgba(255, 255, 255, 0.95)",
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: texts.body.size,
            lineHeight: BODY.lineHeight,
            textShadow: TEXT_SHADOW,
            whiteSpace: "nowrap",
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Post rasmi                                                         */
/* ------------------------------------------------------------------ */

/**
 * Shablon + nomzodning fonsiz rasmi (beligacha, o'ngda) +
 * chapda F.I.Sh va 3–4 qisqa gap → PNG.
 */
export async function renderPostImage(anketa: Anketa): Promise<Buffer> {
  if (!anketa.photo_url) throw new Error("Nomzod rasmi yoʻq.");
  const [files, portrait, texts] = await Promise.all([loadAssets(), loadPortrait(anketa.photo_url), postTexts(anketa)]);

  const scale = Math.min(PORTRAIT.maxWidth / portrait.width, PORTRAIT.maxHeight / portrait.height);
  const pw = Math.round(portrait.width * scale);
  const ph = Math.round(portrait.height * scale);
  const left = Math.min(SIZE - pw, Math.max(PORTRAIT.minLeft, Math.round(PORTRAIT.centerX - pw / 2)));

  const response = new ImageResponse(
    (
      <div style={{ width: SIZE, height: SIZE, display: "flex", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={files.template} width={SIZE} height={SIZE} style={{ position: "absolute", left: 0, top: 0 }} />
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={portrait.src} width={pw} height={ph} style={{ position: "absolute", left, top: SIZE - ph }} />
        <TextColumn texts={texts} />
      </div>
    ),
    {
      width: SIZE,
      height: SIZE,
      fonts: [
        { name: "Inter", data: files.bold, weight: 700, style: "normal" },
        { name: "Inter", data: files.semibold, weight: 600, style: "normal" },
      ],
    },
  );

  if (!response.ok) throw new Error("Post rasmi yaratilmadi.");
  return Buffer.from(await response.arrayBuffer());
}
