/**
 * Anketadagi rasm promptga (PORTRAIT_PROMPT) mos yasalganini tekshirish — brauzerda.
 *
 * Prompt natijasi: VERTIKAL, yuqori sifatli PNG, HAQIQIY shaffof fon (alpha),
 * odam belidan yuqorisi kadrni ~75–82% egallaydi. Oddiy telefon rasmi,
 * skrinshot yoki fonli rasm bu talablarga javob bermaydi — qabul qilinmaydi.
 *
 * Tekshiruvlar:
 *  1. Format: PNG yoki WebP (JPG'da shaffoflik bo'lmaydi).
 *  2. Kamerada olingan rasm belgisi (EXIF Make/Model) bo'lmasligi.
 *  3. O'lcham: qisqa tomoni ≥ 600 px, vertikal (balandlik ≥ kenglik).
 *  4. Fon haqiqatan shaffof: tepa, chap va o'ng chetlarning ko'p qismi shaffof.
 *     Soxta «shaxmat» fon (Gemini va b. chizib beradi) alohida aniqlanadi.
 *  5. Odam kadrda: shaffof bo'lmagan qism balandlikning ≥ 55% ini egallaydi
 *     va pastki chetga tegadi (beldan kesilgan).
 */

export type PortraitCheck = { ok: true } | { ok: false; message: string };

const NOT_PROMPT =
  "Bu rasm promptimiz orqali yasalmagan. Quyidagi promptni nusxalab, oʻz rasmingiz bilan ChatGPT’ga yuboring va tayyor PNG rasmni yuklang.";

/** JPEG/PNG/WebP ichida kamera belgilari (EXIF Make/Model yoki mashhur brendlar). */
function looksLikeCameraPhoto(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, Math.min(bytes.length, 64 * 1024));
  let text = "";
  for (let i = 0; i < head.length; i += 1) {
    const c = head[i];
    text += c >= 32 && c < 127 ? String.fromCharCode(c) : " ";
  }
  if (!/Exif/.test(text)) return false;
  return /(Apple|iPhone|SAMSUNG|Samsung|Xiaomi|Redmi|HUAWEI|Huawei|OPPO|vivo|realme|Google Pixel|OnePlus|Canon|NIKON|SONY|FUJIFILM|HONOR|Tecno|Infinix)/.test(
    text,
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Rasmni oʻqib boʻlmadi."));
    img.src = url;
  });
}

/** Chetdagi piksellar soxta shaxmat (oq/kulrang kataklar) fonini hosil qiladimi. */
function looksLikeFakeChecker(data: Uint8ClampedArray, w: number, h: number): boolean {
  // Tepa chetdan bir qator: oq va och-kulrang navbatma-navbat almashadi.
  let light = 0;
  let grey = 0;
  let switches = 0;
  let prev = -1;
  const y = Math.min(h - 1, Math.round(h * 0.02));
  for (let x = 0; x < w; x += 1) {
    const i = (y * w + x) * 4;
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 250) return false;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (sat > 14) continue;
    const v = (r + g + b) / 3;
    const cls = v > 235 ? 1 : v > 170 && v <= 225 ? 0 : -1;
    if (cls === 1) light += 1;
    else if (cls === 0) grey += 1;
    if (cls >= 0 && prev >= 0 && cls !== prev) switches += 1;
    if (cls >= 0) prev = cls;
  }
  return light > w * 0.25 && grey > w * 0.2 && switches >= 6;
}

export async function checkPromptPortrait(file: File): Promise<PortraitCheck> {
  if (file.type === "image/jpeg") {
    return {
      ok: false,
      message: `JPG rasm qabul qilinmaydi — promptdagi rasm shaffof fonli PNG boʻladi. ${NOT_PROMPT}`,
    };
  }
  if (file.type !== "image/png" && file.type !== "image/webp") {
    return { ok: false, message: "Faqat promptdan chiqqan PNG rasmni yuklang." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (looksLikeCameraPhoto(bytes)) {
    return { ok: false, message: `Bu telefon/kamerada olingan rasm. ${NOT_PROMPT}` };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const W = img.naturalWidth;
    const H = img.naturalHeight;

    if (Math.min(W, H) < 600) {
      return { ok: false, message: `Rasm sifati past (${W}×${H}). Promptdagi yuqori sifatli PNG kerak.` };
    }
    if (H < W) {
      return { ok: false, message: `Rasm vertikal boʻlishi kerak (beldan yuqori portret). ${NOT_PROMPT}` };
    }

    // Tahlil uchun kichraytiramiz (tez ishlashi uchun).
    const scale = Math.min(1, 400 / Math.max(W, H));
    const w = Math.max(1, Math.round(W * scale));
    const h = Math.max(1, Math.round(H * scale));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { ok: true }; // tekshirib bo'lmaydi — o'tkazamiz
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const alphaAt = (x: number, y: number) => data[(y * w + x) * 4 + 3];

    // 4. Chetlar: tepa, chap, o'ng (pastki chet — bel, u yerda odam bo'ladi).
    let edge = 0;
    let clear = 0;
    for (let x = 0; x < w; x += 1) {
      edge += 1;
      if (alphaAt(x, 0) < 20) clear += 1;
    }
    for (let y = 0; y < Math.round(h * 0.85); y += 1) {
      edge += 2;
      if (alphaAt(0, y) < 20) clear += 1;
      if (alphaAt(w - 1, y) < 20) clear += 1;
    }
    if (clear / edge < 0.7) {
      if (looksLikeFakeChecker(data, w, h)) {
        return {
          ok: false,
          message:
            "Rasmdagi «shaxmat» fon soxta — u chizilgan, haqiqiy shaffof emas. ChatGPT’dan promptdagidek HAQIQIY shaffof fonli PNG yasatib, shuni yuklang.",
        };
      }
      return { ok: false, message: `Rasm foni shaffof emas. ${NOT_PROMPT}` };
    }

    // 5. Odam: shaffof bo'lmagan qismning chegaralari.
    let top = h;
    let bottom = -1;
    let solid = 0;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (alphaAt(x, y) > 200) {
          solid += 1;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }
    const area = solid / (w * h);
    const tall = bottom >= 0 ? (bottom - top + 1) / h : 0;
    if (area < 0.12 || tall < 0.55) {
      return {
        ok: false,
        message: `Rasmda odam juda kichik yoki toʻliq chiqmagan. Promptdagidek beldan yuqori portret boʻlsin.`,
      };
    }
    if (bottom < h * 0.9) {
      return {
        ok: false,
        message: "Odam kadrning pastki chetigacha (bel qismi) boʻlishi kerak — promptdagi kompozitsiya.",
      };
    }

    return { ok: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}
