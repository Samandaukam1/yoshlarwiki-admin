# Asosiy sayt (yoshlarwiki.uz) uchun — VIP profil foni va ko'rishlar soni

Bu zip'da faqat **admin panel** bor. Quyidagi ikki o'zgarish **asosiy sayt** kodiga
qo'shilishi kerak (bazadagi tayyorgarlik admin panel tomonidan qilingan).

Bazaga 2.1 uchun `supabase/migrations/20261127232200_yoshlarwiki_2_1.sql` migratsiyasi kerak.

---

## 1. Profil foni: Oddiy yoki VIP (Ko'k / Oltin / Pushti)

Admin panel → **Nomzodlar → profil → «Profil foni»** da tanlanadi. Bazada:

| ustun | qiymat |
|---|---|
| `candidates.theme_color` | `standard` (oddiy, asl fon) · `blue` · `gold` · `pink` |
| `candidates.profile_bg_url` | VIP bo'lsa — rasmning to'liq manzili (masalan `https://yoshlarwiki-admin.vercel.app/profile-bg/gold.jpg`), oddiy bo'lsa `null` |

Rasmlar admin panelning `public/profile-bg/` papkasida (1672×941, yuqori sifat).
Xohlasangiz ularni saytning o'z `public/` papkasiga ham ko'chirib olishingiz mumkin.

### Profil sahifasida

Profilni o'qiyotgan so'rovga `theme_color, profile_bg_url` ni qo'shing, keyin hero bo'limiga:

```tsx
const vip = candidate.theme_color !== "standard" && !!candidate.profile_bg_url;
const accent = { blue: "#1546e0", gold: "#c98a00", pink: "#d6168f" }[candidate.theme_color] ?? "#1546e0";

<section
  className={vip ? "yw-hero yw-hero--vip" : "yw-hero"}
  style={vip ? ({ "--yw-hero-bg": `url(${candidate.profile_bg_url})`, "--yw-vip": accent } as React.CSSProperties) : undefined}
>
  {/* sarlavha, ism, «Batafsil», portret — hozirgidek */}
</section>
{/* 5 ta maʼlumot kartochkasi (Tugʻilgan sana …) — hero ichida eng pastda qolsin */}
```

```css
/* VIP hero: tepa qism to'liq rasm bilan qoplanadi, pastga qarab sahifa foniga silliq o'tadi */
.yw-hero--vip { position: relative; overflow: hidden; color: #fff; padding-bottom: 150px; }
.yw-hero--vip::before {            /* rasm — shahar manzarasi o'ngda, portret ortida qoladi */
  content: ""; position: absolute; inset: 0;
  background: var(--yw-hero-bg) center bottom / cover no-repeat;
  transform: scaleX(-1);
}
.yw-hero--vip::after {              /* matn o'qilishi uchun yengil soya + pastda sahifa foniga o'tish */
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background:
    linear-gradient(90deg, rgba(0,0,0,.22) 0%, rgba(0,0,0,.05) 45%, transparent 70%),
    linear-gradient(180deg, transparent 82%, var(--page-bg, #f4f0ea) 100%);
}
.yw-hero--vip > * { position: relative; z-index: 1; }
.yw-hero--vip h1, .yw-hero--vip .eyebrow, .yw-hero--vip .title, .yw-hero--vip .intro { color: #fff; }
.yw-hero--vip .btn-primary { background: #fff; color: var(--yw-vip); }
/* 5 ta kartochka hero rasmining pastki qismini yopib turadi */
.yw-hero--vip + .yw-info-cards { margin-top: -150px; position: relative; z-index: 2;
  box-shadow: 0 20px 50px rgba(0,0,0,.18); }
```

VIP profilda logo uchun oq matnli varianti (`logo-horizontal-dark.png`) ishlatiladi.
Oddiy profil (`standard`) — hech narsa o'zgarmaydi.

---

## 2. Ko'rishlar soni: har ochilish / yangilash (F5) = +1

Bazadagi `increment_candidate_view(p_slug)` endi **yangi sonni qaytaradi** va har chaqiruvda +1 qiladi
(ko'rish soni oshganda admin paneldagi «Yangilangan» vaqti o'zgarmaydi).

Hozir son yangilaganda oshmasligining sababi — sahifa keshlanadi (ISR / static) yoki
brauzerda «bir marta sanash» (cookie/localStorage) tekshiruvi bor. Shuni olib tashlab,
sanashni **brauzerda, har yuklanishda** qiling:

```tsx
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ViewCounter({ slug, initial }: { slug: string; initial: number }) {
  const [views, setViews] = useState(initial);
  useEffect(() => {
    createClient()
      .rpc("increment_candidate_view", { p_slug: slug })
      .then(({ data }) => { if (typeof data === "number") setViews(data); });
  }, [slug]);
  return <span>{views}</span>;
}
```

Profil sahifasida `👁 {candidate.view_count}` o'rniga `<ViewCounter slug={candidate.slug} initial={candidate.view_count} />`
qo'ying va server tomondagi eski `increment_candidate_view` chaqiruvi hamda cookie/localStorage tekshiruvini o'chiring
(aks holda bitta ochilish 2 ta sanaladi).
