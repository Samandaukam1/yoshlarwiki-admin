/**
 * Brauzerda rasm fonini olib tashlash (MODNet — portretlar uchun maxsus model).
 *
 * transformers.js CDN'dan dinamik yuklanadi — paketga qo'shilmaydi va Vercel
 * build'iga ta'sir qilmaydi. Model (~25 MB) birinchi marta yuklanadi, keyin
 * brauzer keshida qoladi.
 *
 * Natija:
 *  - cutout: shaffof fonli PNG (profil uchun), atrofi tekis kesilgan
 *  - white:  1080×1350 oq fonli JPG (Telegram post uchun)
 */

const TRANSFORMERS_CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3";
const MODEL_ID = "Xenova/modnet";
const MAX_SIDE = 2048;

/* eslint-disable @typescript-eslint/no-explicit-any */
type Loaded = { model: any; processor: any; RawImage: any };

// Bundler (Turbopack/Webpack) bu importni ushlamasligi uchun.
const importFromUrl = new Function("url", "return import(url)") as (url: string) => Promise<any>;

let loading: Promise<Loaded> | null = null;

function loadModel(): Promise<Loaded> {
  if (!loading) {
    loading = (async () => {
      const t = await importFromUrl(TRANSFORMERS_CDN);
      t.env.allowLocalModels = false;
      const [model, processor] = await Promise.all([
        t.AutoModel.from_pretrained(MODEL_ID, { dtype: "fp32" }),
        t.AutoProcessor.from_pretrained(MODEL_ID),
      ]);
      return { model, processor, RawImage: t.RawImage };
    })();
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}

/** Modelni oldindan yuklab qo'yish (sahifa ochilganda). */
export function preloadBackgroundModel() {
  void loadModel().catch(() => undefined);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Rasmni oʻqib boʻlmadi."));
    img.src = src;
  });
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas qoʻllab-quvvatlanmaydi.");
  return { c, ctx };
}

function toBlob(c: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("Rasm saqlanmadi."))), type, quality),
  );
}

/** Rasmda allaqachon shaffof fon bormi (burchaklar shaffof). */
function hasTransparentBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pts = [
    [1, 1],
    [w - 2, 1],
    [1, h - 2],
    [w - 2, h - 2],
  ];
  let clear = 0;
  for (const [x, y] of pts) if (ctx.getImageData(x, y, 1, 1).data[3] < 16) clear += 1;
  return clear >= 3;
}

/** Shaffof bo'lmagan piksellar chegarasi bo'yicha kesish (+ kichik chegara). */
function cropToContent(src: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = src.getContext("2d")!;
  const { width: w, height: h } = src;
  const data = ctx.getImageData(0, 0, w, h).data;
  let top = h, left = w, right = -1, bottom = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (right < 0) return src;
  const pad = Math.round(Math.max(right - left, bottom - top) * 0.03);
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  right = Math.min(w - 1, right + pad);
  bottom = Math.min(h - 1, bottom); // pastki qism (yelka/qo'llar) kesilgan bo'lishi tabiiy
  const out = canvas(right - left + 1, bottom - top + 1);
  out.ctx.drawImage(src, left, top, out.c.width, out.c.height, 0, 0, out.c.width, out.c.height);
  return out.c;
}

/** Oq fonli 4:5 post rasmi — odam markazda, pastga tekislangan. */
async function whitePoster(cutout: HTMLCanvasElement): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const scale = Math.min((W * 0.9) / cutout.width, (H * 0.92) / cutout.height);
  const dw = Math.round(cutout.width * scale);
  const dh = Math.round(cutout.height * scale);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(cutout, Math.round((W - dw) / 2), H - dh, dw, dh);
  return toBlob(c, "image/jpeg", 0.92);
}

export type ProcessedPhoto = {
  cutout: Blob; // PNG (shaffof) yoki xato bo'lsa — asl rasm
  white: Blob; // JPG oq fon
  removed: boolean; // fon haqiqatan olib tashlandimi
};

export async function processPortrait(
  file: File,
  options: { removeBackground: boolean; onStatus?: (text: string) => void },
): Promise<ProcessedPhoto> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const base = canvas(w, h);
    base.ctx.drawImage(img, 0, 0, w, h);

    let result = base.c;
    let removed = false;

    if (hasTransparentBackground(base.ctx, w, h)) {
      removed = true; // AI allaqachon shaffof PNG bergan
    } else if (options.removeBackground) {
      try {
        options.onStatus?.("AI model yuklanmoqda…");
        const { model, processor, RawImage } = await loadModel();
        options.onStatus?.("Fon olib tashlanmoqda…");

        const input = await RawImage.fromURL(URL.createObjectURL(await toBlob(base.c, "image/png")));
        const { pixel_values } = await processor(input);
        const { output } = await model({ input: pixel_values });
        const mask = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(w, h);
        const alpha: Uint8Array = mask.data;

        const pixels = base.ctx.getImageData(0, 0, w, h);
        for (let i = 0; i < w * h; i += 1) {
          // Chekkalarni tekislash: past qiymatlar — to'liq shaffof, yuqorilari — to'liq ko'rinadi.
          const a = alpha[i] / 255;
          const v = a < 0.1 ? 0 : a > 0.9 ? 1 : (a - 0.1) / 0.8;
          pixels.data[i * 4 + 3] = Math.round(v * 255);
        }
        base.ctx.putImageData(pixels, 0, 0);
        result = cropToContent(base.c);
        removed = true;
      } catch (error) {
        console.warn("[fon] olib tashlanmadi, asl rasm ishlatiladi", error);
      }
    }

    if (removed && result === base.c) result = cropToContent(base.c);

    options.onStatus?.("Tayyorlanmoqda…");
    const cutout = removed ? await toBlob(result, "image/png") : file;
    const white = await whitePoster(result);
    return { cutout, white, removed };
  } finally {
    URL.revokeObjectURL(url);
  }
}
