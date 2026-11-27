/**
 * Saytdagi profil foni.
 *  - standard: oddiy profil — saytning asl (eski) foni, rasm yo'q.
 *  - blue / gold / pink: VIP profillar — tepa qism (hero) to'liq shu rasm bilan qoplanadi.
 *
 * Rasmlar: public/profile-bg/{blue,gold,pink}.jpg (admin panel domenida).
 * Bazada candidates.theme_color va candidates.profile_bg_url saqlanadi —
 * sayt profil_bg_url bo'lsa, uni hero foniga qo'yadi.
 */

export const PROFILE_THEMES = ["standard", "blue", "gold", "pink"] as const;
export type ProfileTheme = (typeof PROFILE_THEMES)[number];

export const PROFILE_THEME_INFO: Record<
  ProfileTheme,
  { label: string; vip: boolean; image: string | null; thumb: string | null; accent: string }
> = {
  standard: { label: "Oddiy", vip: false, image: null, thumb: null, accent: "#1d4ed8" },
  blue: {
    label: "Koʻk",
    vip: true,
    image: "/profile-bg/blue.jpg",
    thumb: "/profile-bg/blue-thumb.jpg",
    accent: "#1546e0",
  },
  gold: {
    label: "Oltin",
    vip: true,
    image: "/profile-bg/gold.jpg",
    thumb: "/profile-bg/gold-thumb.jpg",
    accent: "#c98a00",
  },
  pink: {
    label: "Pushti",
    vip: true,
    image: "/profile-bg/pink.jpg",
    thumb: "/profile-bg/pink-thumb.jpg",
    accent: "#d6168f",
  },
};

export function isProfileTheme(value: unknown): value is ProfileTheme {
  return typeof value === "string" && (PROFILE_THEMES as readonly string[]).includes(value);
}

export function normalizeTheme(value: unknown): ProfileTheme {
  return isProfileTheme(value) ? value : "standard";
}
