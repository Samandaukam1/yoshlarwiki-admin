import Image from "next/image";

type Variant = "horizontal" | "mark" | "short";

const BASE = "/assets/brand";
const BRAND_ALT = "YoshlarWiki.uz";

/**
 * Har bir variant uchun asl (intrinsic) o'lcham — aspect ratio shundan
 * hisoblanadi. Ko'rinadigan o'lcham faqat `className` (masalan "h-9 w-auto")
 * orqali beriladi, shuning uchun logotip hech qachon cho'zilib/siqilib
 * qolmaydi.
 */
const VARIANTS: Record<
  Variant,
  { light: string; dark: string; width: number; height: number; sizes?: string }
> = {
  horizontal: {
    light: `${BASE}/png/logo-horizontal-light.png`,
    dark: `${BASE}/png/logo-horizontal-dark.png`,
    width: 1080,
    height: 300,
  },
  short: {
    light: `${BASE}/png/short-logo-light.png`,
    dark: `${BASE}/png/short-logo-dark.png`,
    width: 1080,
    height: 1080,
  },
  mark: {
    light: `${BASE}/png/logo-mark-light.png`,
    dark: `${BASE}/png/logo-mark-dark.png`,
    width: 897,
    height: 659,
    // Mark har doim juda kichik ko'rsatiladi (ikonka o'rnida) — optimallashtiruvchi
    // 897px kenglikdagi asl PNGni emas, shu taxminiy ko'rinish o'lchamini so'rasin.
    sizes: "64px",
  },
};

/**
 * YoshlarWiki brend logotipi — yagona manba (source of truth).
 *
 * Theme almashtirilganda mos SVG/PNG avtomatik ko'rinadi: ikkalasi ham
 * render bo'ladi, faqat biri `dark:` variant bilan CSS orqali yashiriladi —
 * shuning uchun hydration nomuvofiqligi va "flash" bo'lmaydi.
 *
 * `className` faqat balandlik/kenglik va joylashuvni belgilaydi
 * (masalan "h-9 w-auto"); logotipning o'zi hech qachon deformatsiya
 * bo'lmasligi uchun asl aspect ratio saqlanadi.
 */
export function YoshlarWikiLogo({
  variant = "horizontal",
  className = "",
  alt,
  priority = false,
}: {
  variant?: Variant;
  className?: string;
  /** Standart holatda "YoshlarWiki.uz". Logotip allaqachon nomlangan
   *  <Link aria-label="..."> ichida bo'lsa, takrorlanmasligi uchun `alt=""` ber. */
  alt?: string;
  priority?: boolean;
}) {
  const v = VARIANTS[variant];
  const label = alt ?? BRAND_ALT;

  return (
    <>
      <Image
        src={v.light}
        alt={label}
        width={v.width}
        height={v.height}
        sizes={v.sizes}
        priority={priority}
        className={`dark:hidden ${className}`}
      />
      <Image
        src={v.dark}
        alt={label}
        width={v.width}
        height={v.height}
        sizes={v.sizes}
        priority={priority}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}
