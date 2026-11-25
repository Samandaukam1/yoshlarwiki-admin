/**
 * Fonsiz rasm chetlarini tozalash: soch, quloq va yelka atrofida qolgan
 * oq chiziq / kulrang soya (eski fon rangi) olib tashlanadi, chet piksellar
 * odamning o'z rangiga moslashtiriladi — rasm har qanday fonga tabiiy tushadi.
 *
 * Toza TypeScript: brauzerda (fon olib tashlanganda) ham, serverda (post
 * rasmi yasalganda, eski rasmlar uchun) ham ishlaydi.
 *
 * `backgroundKnown: true` — shaffof piksellarda asl fon rangi saqlangan
 * (brauzerda, kesishdan oldin). Shunda fon rangi chet piksellardan
 * matematik ravishda "ayirib" tashlanadi: F = (C − (1 − a)·B) / a.
 */

type Pixels = Uint8Array | Uint8ClampedArray;

type Grid = { r: Float32Array; g: Float32Array; b: Float32Array; ok: boolean; gw: number; f: number };

/** Kichik setkada mahalliy o'rtacha rang (tanlangan piksellar bo'yicha). */
function localAverage(px: Pixels, w: number, h: number, pick: (a: number) => boolean): Grid {
  const f = Math.max(2, Math.ceil(Math.max(w, h) / 256));
  const gw = Math.ceil(w / f);
  const gh = Math.ceil(h / f);
  const n = gw * gh;
  const r = new Float32Array(n);
  const g = new Float32Array(n);
  const b = new Float32Array(n);
  const c = new Float32Array(n);
  let tr = 0, tg = 0, tb = 0, tc = 0;

  for (let y = 0; y < h; y += 1) {
    const row = ((y / f) | 0) * gw;
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (!pick(px[i + 3])) continue;
      const k = row + ((x / f) | 0);
      r[k] += px[i];
      g[k] += px[i + 1];
      b[k] += px[i + 2];
      c[k] += 1;
    }
  }
  for (let k = 0; k < n; k += 1) {
    tr += r[k];
    tg += g[k];
    tb += b[k];
    tc += c[k];
  }
  if (tc === 0) return { r, g, b, ok: false, gw, f };

  // Separable box blur (radius 2, ikki marta) — yig'indilar va sonlar.
  const tmp = new Float32Array(n);
  const blur = (arr: Float32Array) => {
    for (let pass = 0; pass < 2; pass += 1) {
      for (let y = 0; y < gh; y += 1) {
        for (let x = 0; x < gw; x += 1) {
          let s = 0;
          for (let d = -2; d <= 2; d += 1) {
            const xx = x + d;
            if (xx >= 0 && xx < gw) s += arr[y * gw + xx];
          }
          tmp[y * gw + x] = s;
        }
      }
      for (let y = 0; y < gh; y += 1) {
        for (let x = 0; x < gw; x += 1) {
          let s = 0;
          for (let d = -2; d <= 2; d += 1) {
            const yy = y + d;
            if (yy >= 0 && yy < gh) s += tmp[yy * gw + x];
          }
          arr[y * gw + x] = s;
        }
      }
    }
  };
  blur(r);
  blur(g);
  blur(b);
  blur(c);

  const gr = tr / tc, gg = tg / tc, gb = tb / tc;
  for (let k = 0; k < n; k += 1) {
    if (c[k] > 0.5) {
      r[k] /= c[k];
      g[k] /= c[k];
      b[k] /= c[k];
    } else {
      r[k] = gr;
      g[k] = gg;
      b[k] = gb;
    }
  }
  return { r, g, b, ok: true, gw, f };
}

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

export function cleanEdges(px: Pixels, w: number, h: number, opts: { backgroundKnown: boolean }) {
  const fg = localAverage(px, w, h, (a) => a >= 242);
  if (!fg.ok) return;
  const bg = opts.backgroundKnown ? localAverage(px, w, h, (a) => a <= 12) : null;
  const useBg = Boolean(bg?.ok);

  // Asl alfa (qo'shni tekshiruvi uchun) — o'zgartirishdan oldin.
  const alpha = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p += 1) alpha[p] = px[p * 4 + 3];

  // Shaffof joyga yaqin (R piksel ichidagi) piksellar — "halo" zonasi.
  const R = Math.max(2, Math.round(Math.max(w, h) / 300));
  const near = new Uint8Array(w * h);
  const tmp = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p += 1) near[p] = alpha[p] < 128 ? 1 : 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let v = 0;
      for (let d = -R; d <= R && !v; d += 1) {
        const xx = x + d;
        if (xx >= 0 && xx < w && near[y * w + xx]) v = 1;
      }
      tmp[y * w + x] = v;
    }
  }
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let v = 0;
      for (let d = -R; d <= R && !v; d += 1) {
        const yy = y + d;
        if (yy >= 0 && yy < h && tmp[yy * w + x]) v = 1;
      }
      near[y * w + x] = v;
    }
  }

  const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

  for (let y = 0; y < h; y += 1) {
    const row = ((y / fg.f) | 0) * fg.gw;
    for (let x = 0; x < w; x += 1) {
      const p = y * w + x;
      const i = p * 4;
      const a = alpha[p];
      if (a === 0) continue;

      const k = row + ((x / fg.f) | 0);
      let t = a / 255;
      if (a >= 250) {
        // To'liq ko'rinadigan, lekin chetga yaqin piksel: atrofidagidan ancha och bo'lsa — bu oq "halo".
        if (!near[p]) continue;
        const diff = lum(px[i], px[i + 1], px[i + 2]) - lum(fg.r[k], fg.g[k], fg.b[k]);
        if (diff < 18) continue;
        t = Math.max(0.3, 1 - diff / 160);
      }

      let r = px[i], g = px[i + 1], b = px[i + 2];

      if (useBg && bg && t >= 0.15) {
        // Fon rangini ayirish.
        const u = 1 - t;
        r = clamp((r - u * bg.r[k]) / t);
        g = clamp((g - u * bg.g[k]) / t);
        b = clamp((b - u * bg.b[k]) / t);
      }

      // Juda shaffof piksellar — odamning yaqin atrofdagi rangiga yaqinlashadi.
      const keep = useBg ? t : t * t;
      px[i] = Math.round(fg.r[k] + (r - fg.r[k]) * keep);
      px[i + 1] = Math.round(fg.g[k] + (g - fg.g[k]) * keep);
      px[i + 2] = Math.round(fg.b[k] + (b - fg.b[k]) * keep);
    }
  }

  // Xira "tuman" (deyarli shaffof qatlam) — butunlay olib tashlanadi, chet biroz aniqlashadi.
  const LOW = 22;
  for (let p = 0; p < w * h; p += 1) {
    const a = alpha[p];
    if (a === 0 || a === 255) continue;
    px[p * 4 + 3] = a <= LOW ? 0 : Math.round(((a - LOW) * 255) / (255 - LOW));
  }
}
