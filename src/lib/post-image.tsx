import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { sanitizeAnswers } from "./anketa";
import type { Anketa } from "./anketa-server";
import { achievementLine, educationLine, fitText, type FittedText } from "./post-text";

/* ------------------------------------------------------------------ */
/* Shablon o'lchamlari (src/assets/post/template.jpg — 1254×1254)     */
/* ------------------------------------------------------------------ */

const SIZE = 1254;

/** Qutilar ichidagi matn joyi: ajratuvchi chiziqdan o'ngda. */
const TEXT_LEFT = 228;
const TEXT_WIDTH = 400;
const BOXES = {
  name: { top: 407, height: 160 },
  study: { top: 609, height: 166 },
  achievement: { top: 813, height: 166 },
};

/** Nomzod rasmi: o'ng tomondagi bo'sh joy, pastga tekislangan. */
const PORTRAIT = { centerX: 955, maxWidth: 600, maxHeight: 940, bottom: SIZE };

/* ------------------------------------------------------------------ */
/* Fayllar (bir marta o'qiladi)                                       */
/* ------------------------------------------------------------------ */

const ASSETS = join(process.cwd(), "src/assets/post");

let assets: Promise<{
  full: string;
  noAchievement: string;
  bold: ArrayBuffer;
  semibold: ArrayBuffer;
}> | null = null;

const toArrayBuffer = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

function loadAssets() {
  if (!assets) {
    assets = (async () => {
      const [full, noAchievement, bold, semibold] = await Promise.all([
        readFile(join(ASSETS, "template.jpg")),
        readFile(join(ASSETS, "template-2.jpg")),
        readFile(join(ASSETS, "Inter-Bold.otf")),
        readFile(join(ASSETS, "Inter-SemiBold.otf")),
      ]);
      return {
        full: `data:image/jpeg;base64,${full.toString("base64")}`,
        noAchievement: `data:image/jpeg;base64,${noAchievement.toString("base64")}`,
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

async function loadPortrait(url: string) {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Rasm yuklanmadi (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const info = imageInfo(buf);
  if (!info || !info.width || !info.height) throw new Error("Rasm formati notanish.");
  return { src: `data:${info.mime};base64,${buf.toString("base64")}`, ...info };
}

/* ------------------------------------------------------------------ */
/* Matnlar                                                            */
/* ------------------------------------------------------------------ */

export type PostTexts = { name: FittedText; study: FittedText; achievement: FittedText | null };

export function postTexts(anketa: Anketa): PostTexts {
  const a = sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);
  const name = (a.full_name || anketa.full_name).replace(/\s+/g, " ").trim();
  // Ta'lim bo'lmasa — hozirgi faoliyat yoziladi (quti bo'sh qolmasin).
  const study = educationLine(a) || a.activity.trim();
  const achievement = achievementLine(a);

  return {
    name: fitText(name, { maxWidth: TEXT_WIDTH, maxSize: 44, minSize: 26, weight: "bold", threeLinesBelow: 30 }),
    study: fitText(study, { maxWidth: TEXT_WIDTH, maxSize: 38, minSize: 24, weight: "semibold", threeLinesBelow: 30 }),
    achievement: achievement
      ? fitText(achievement, { maxWidth: TEXT_WIDTH, maxSize: 38, minSize: 24, weight: "semibold", threeLinesBelow: 30 })
      : null,
  };
}

function TextBox({ box, text, weight }: { box: { top: number; height: number }; text: FittedText; weight: 600 | 700 }) {
  return (
    <div
      style={{
        position: "absolute",
        left: TEXT_LEFT,
        top: box.top,
        width: TEXT_WIDTH,
        height: box.height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {text.lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            color: "#ffffff",
            fontFamily: "Inter",
            fontWeight: weight,
            fontSize: text.size,
            lineHeight: 1.18,
            letterSpacing: weight === 700 ? -0.3 : 0,
            textShadow: "0 2px 10px rgba(0, 20, 80, 0.55)",
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
 * Shablon + nomzodning fonsiz rasmi + F.I.Sh / ta'lim / yutuq → PNG.
 * Yutuq bo'lmasa — 3-qutisiz shablon ishlatiladi.
 */
export async function renderPostImage(anketa: Anketa): Promise<Buffer> {
  if (!anketa.photo_url) throw new Error("Nomzod rasmi yoʻq.");
  const [files, portrait] = await Promise.all([loadAssets(), loadPortrait(anketa.photo_url)]);
  const texts = postTexts(anketa);

  const scale = Math.min(PORTRAIT.maxWidth / portrait.width, PORTRAIT.maxHeight / portrait.height);
  const pw = Math.round(portrait.width * scale);
  const ph = Math.round(portrait.height * scale);

  const response = new ImageResponse(
    (
      <div style={{ width: SIZE, height: SIZE, display: "flex", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img
          src={texts.achievement ? files.full : files.noAchievement}
          width={SIZE}
          height={SIZE}
          style={{ position: "absolute", left: 0, top: 0 }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img
          src={portrait.src}
          width={pw}
          height={ph}
          style={{ position: "absolute", left: Math.round(PORTRAIT.centerX - pw / 2), top: PORTRAIT.bottom - ph }}
        />
        <TextBox box={BOXES.name} text={texts.name} weight={700} />
        <TextBox box={BOXES.study} text={texts.study} weight={600} />
        {texts.achievement ? <TextBox box={BOXES.achievement} text={texts.achievement} weight={600} /> : null}
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
