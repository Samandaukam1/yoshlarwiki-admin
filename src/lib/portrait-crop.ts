import "server-only";

import { deflateSync, inflateSync } from "node:zlib";

import { cleanEdges } from "./edge-clean";

/**
 * Post rasmi uchun nomzodning fonsiz rasmini tayyorlash:
 *  1) PNG (shaffof) o'qiladi;
 *  2) odam beligacha kesiladi — belidan pasti ko'rinmaydi;
 *  3) chetlar tozalanadi (eski rasmlarda qolgan oq chiziq/soya);
 *  4) qayta PNG qilib beriladi.
 * O'qib bo'lmasa (JPEG, interlaced PNG…) — null, rasm o'zgarishsiz ishlatiladi.
 */

type Rgba = { width: number; height: number; data: Uint8Array };

/* ------------------------------------------------------------------ */
/* PNG                                                                */
/* ------------------------------------------------------------------ */

function decodePng(buf: Buffer): Rgba | null {
  if (buf.length < 33 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  let pos = 8;
  let width = 0, height = 0, depth = 0, colorType = 0, interlace = 0;
  const idat: Buffer[] = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      colorType = body[9];
      interlace = body[12];
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const channels = ({ 0: 1, 2: 3, 4: 2, 6: 4 } as Record<number, number>)[colorType];
  if (!width || !height || depth !== 8 || interlace !== 0 || !channels) return null;
  if (width * height > 4096 * 4096) return null;

  const stride = width * channels;
  const expectedLength = height * (stride + 1);
  const raw = inflateSync(Buffer.concat(idat), { maxOutputLength: expectedLength });
  if (raw.length !== expectedLength) return null;
  const out = new Uint8Array(height * stride);
  const bpp = channels;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    const prev = dst - stride;
    for (let x = 0; x < stride; x += 1) {
      const v = raw[src + x];
      const left = x >= bpp ? out[dst + x - bpp] : 0;
      const up = y > 0 ? out[prev + x] : 0;
      const upLeft = y > 0 && x >= bpp ? out[prev + x - bpp] : 0;
      let pred = 0;
      if (filter === 1) pred = left;
      else if (filter === 2) pred = up;
      else if (filter === 3) pred = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
        pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      out[dst + x] = (v + pred) & 0xff;
    }
  }

  if (channels === 4) return { width, height, data: out };
  const data = new Uint8Array(width * height * 4);
  for (let p = 0; p < width * height; p += 1) {
    const s = p * channels;
    const d = p * 4;
    if (channels === 3) {
      data[d] = out[s];
      data[d + 1] = out[s + 1];
      data[d + 2] = out[s + 2];
      data[d + 3] = 255;
    } else {
      const g = out[s];
      data[d] = data[d + 1] = data[d + 2] = g;
      data[d + 3] = channels === 2 ? out[s + 1] : 255;
    }
  }
  return { width, height, data };
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, body: Buffer) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

function encodePng(img: Rgba): Buffer {
  const stride = img.width * 4;
  const raw = Buffer.alloc(img.height * (stride + 1));
  for (let y = 0; y < img.height; y += 1) {
    raw[y * (stride + 1)] = 0;
    raw.set(img.data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.width, 0);
  ihdr.writeUInt32BE(img.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* Bel chizig'ini topish                                              */
/* ------------------------------------------------------------------ */

/**
 * Har qatordagi odam kengligi bo'yicha: bosh tepasi → yelka chizig'i.
 * Odam tanasi proporsiyasi: yelka ≈ 1.4 bosh, bel ≈ 2.9 bosh (tepadan).
 * Shuning uchun bel ≈ tepa + 2.1 × (yelka − tepa).
 */
function findBox(img: Rgba): { top: number; bottom: number; waist: number } | null {
  const { width: w, height: h, data } = img;
  const step = Math.max(1, Math.floor(w / 320));
  const widths = new Float32Array(h);
  for (let y = 0; y < h; y += 1) {
    let left = -1, right = -1;
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 128) {
        if (left < 0) left = x;
        right = x;
      }
    }
    widths[y] = left < 0 ? 0 : right - left + step;
  }

  // Silliqlash
  const r = Math.max(1, Math.round(h / 150));
  const sm = new Float32Array(h);
  for (let y = 0; y < h; y += 1) {
    let s = 0, n = 0;
    for (let d = -r; d <= r; d += 1) {
      const yy = y + d;
      if (yy >= 0 && yy < h) {
        s += widths[yy];
        n += 1;
      }
    }
    sm[y] = s / n;
  }

  let maxW = 0;
  for (let y = 0; y < h; y += 1) maxW = Math.max(maxW, sm[y]);
  if (maxW < w * 0.05) return null;

  let top = 0;
  while (top < h && sm[top] < maxW * 0.05) top += 1;
  let bottom = h - 1;
  while (bottom > top && widths[bottom] === 0) bottom -= 1;
  const contentH = bottom - top;
  if (contentH < h * 0.2) return null;

  // Bosh kengligi — tepadan 3–10% oraliqdagi eng katta kenglik.
  let headW = 0;
  for (let y = top + Math.round(contentH * 0.03); y <= top + Math.round(contentH * 0.1); y += 1) {
    headW = Math.max(headW, sm[y]);
  }
  if (headW <= 0) return { top, bottom, waist: bottom };

  // Yelka — kenglik boshdan 1.55 marta katta bo'lgan birinchi qator.
  let shoulder = -1;
  for (let y = top + Math.round(contentH * 0.08); y <= top + Math.round(contentH * 0.6); y += 1) {
    if (sm[y] >= headW * 1.55) {
      shoulder = y;
      break;
    }
  }
  if (shoulder < 0) return { top, bottom, waist: bottom };

  const waist = Math.round(top + 2.1 * (shoulder - top));
  // Rasm allaqachon beldan yuqorida tugasa — kesilmaydi.
  if (waist >= bottom - contentH * 0.04) return { top, bottom, waist: bottom };
  return { top, bottom, waist: Math.max(waist, top + Math.round(contentH * 0.35)) };
}

/* ------------------------------------------------------------------ */
/* Asosiy funksiya                                                    */
/* ------------------------------------------------------------------ */

export type PreparedPortrait = { png: Buffer; width: number; height: number };

export function preparePortrait(buf: Buffer): PreparedPortrait | null {
  let img: Rgba | null;
  try {
    img = decodePng(buf);
  } catch {
    return null;
  }
  if (!img) return null;

  const box = findBox(img);
  if (!box) return null;
  const cutBottom = box.waist; // shu qatordan pasti ko'rinmaydi

  // Kesilgan qism ichidagi gorizontal chegaralar (oyoqlar/qo'llar hisobga olinmaydi).
  const { width: w, data } = img;
  let left = w, right = -1;
  for (let y = box.top; y <= cutBottom; y += 2) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (x < left) left = x;
        break;
      }
    }
    for (let x = w - 1; x >= 0; x -= 1) {
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (x > right) right = x;
        break;
      }
    }
  }
  if (right < left) return null;

  const pad = Math.round((right - left) * 0.02);
  left = Math.max(0, left - pad);
  right = Math.min(w - 1, right + pad);
  const top = Math.max(0, box.top - Math.round((cutBottom - box.top) * 0.02));
  const cw = right - left + 1;
  const ch = cutBottom - top + 1;

  const out = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y += 1) {
    const s = ((top + y) * w + left) * 4;
    out.set(data.subarray(s, s + cw * 4), y * cw * 4);
  }

  cleanEdges(out, cw, ch, { backgroundKnown: false });
  return { png: encodePng({ width: cw, height: ch, data: out }), width: cw, height: ch };
}
