import type { Tone } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Arizalar CRM                                                       */
/* ------------------------------------------------------------------ */

export const APPLICATION_STATUSES = [
  "yangi",
  "boglanildi",
  "jarayonda",
  "tasdiqlandi",
  "rad_etildi",
  "nomzodga_aylantirildi",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  yangi: "Yangi",
  boglanildi: "Bogʻlanildi",
  jarayonda: "Jarayonda",
  tasdiqlandi: "Tasdiqlandi",
  rad_etildi: "Rad etildi",
  nomzodga_aylantirildi: "Nomzodga aylantirildi",
};

export const STATUS_TONES: Record<ApplicationStatus, Tone> = {
  yangi: "info",
  boglanildi: "neutral",
  jarayonda: "warning",
  tasdiqlandi: "success",
  rad_etildi: "danger",
  nomzodga_aylantirildi: "success",
};

/* ------------------------------------------------------------------ */
/* Umumiy lug'atlar                                                   */
/* ------------------------------------------------------------------ */

export const GENDERS = [
  { value: "ayol", label: "Ayol" },
  { value: "erkak", label: "Erkak" },
] as const;

export const GENDER_LABELS: Record<string, string> = {
  ayol: "Ayol",
  erkak: "Erkak",
};

export const AGE_RANGES = [
  { value: "14_18", label: "14–18" },
  { value: "19_24", label: "19–24" },
  { value: "25_29", label: "25–29" },
  { value: "35_plus", label: "35+" },
] as const;

export const AGE_RANGE_LABELS: Record<string, string> = {
  "14_18": "14–18",
  "19_24": "19–24",
  "25_29": "25–29",
  "35_plus": "35+",
};

/* ------------------------------------------------------------------ */
/* Nomzodlar CMS                                                      */
/* ------------------------------------------------------------------ */

export const CANDIDATE_STATUSES = ["draft", "published", "archived"] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  draft: "Qoralama",
  published: "Nashr etilgan",
  archived: "Arxivlangan",
};

export const CANDIDATE_STATUS_TONES: Record<CandidateStatus, Tone> = {
  draft: "warning",
  published: "success",
  archived: "neutral",
};

export const EDUCATION_LEVELS = [
  { value: "orta", label: "Oʻrta" },
  { value: "orta_maxsus", label: "Oʻrta maxsus" },
  { value: "bakalavr", label: "Bakalavr" },
  { value: "magistr", label: "Magistr" },
  { value: "doktorantura", label: "Doktorantura" },
  { value: "kurs", label: "Kurs" },
  { value: "boshqa", label: "Boshqa" },
] as const;

export const SOCIAL_PLATFORMS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "telegram", label: "Telegram" },
  { value: "github", label: "GitHub" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
] as const;

export const CATEGORY_ICONS = [
  "briefcase",
  "heart-pulse",
  "shield",
  "graduation-cap",
  "palette",
  "chef-hat",
  "book-open",
  "cpu",
  "trophy",
  "mic",
  "sprout",
  "hard-hat",
  "scale",
  "leaf",
  "plane",
  "landmark",
  "hand-heart",
  "truck",
] as const;

/** Uzbek lotin matnidan URL uchun slug hosil qiladi (SQL slugify bilan bir xil). */
export function slugify(value: string): string {
  const from = "āáàâäãåēéèêëīíìîïōóòôöõūúùûüñçşğıžščć";
  const to = "aaaaaaaeeeeeiiiiiooooooouuuuuncsgizscc";
  const stripped = "ʻʼ‘’`´'\"";

  let result = value.toLowerCase();
  result = [...result]
    .map((char) => {
      const index = from.indexOf(char);
      if (index >= 0) return to[index];
      if (stripped.includes(char)) return "";
      return char;
    })
    .join("");

  return result
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}
