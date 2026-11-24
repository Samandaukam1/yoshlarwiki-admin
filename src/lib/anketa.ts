import type { Tone } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* AI portret prompti — anketada rasm yuklash ostida beriladi.        */
/* Qisqartirilgan, lekin asl promptdagi barcha talablar saqlangan.    */
/* O'ZGARMAYDI: admin paneldan tahrirlanmaydi.                        */
/* ------------------------------------------------------------------ */

export const PORTRAIT_PROMPT = `Use the uploaded photo as the ONLY identity reference. Create an ultra-photorealistic professional studio portrait of the SAME person.

IDENTITY (critical): keep exactly unchanged — face, facial structure and proportions, head shape and size, eyes, eyebrows, nose, lips, jawline, ears, skin tone and natural skin characteristics, hairstyle, hairline, hair color, texture and volume, body type, shoulder width, body proportions, apparent age, gender presentation. Do NOT beautify, idealize, age, de-age, masculinize, feminize, slim, broaden, add muscle or replace the face. It must clearly be the same person, not a similar-looking AI person.

POSE: confident three-quarter standing portrait. Rotate the whole torso and hips 25–35° toward IMAGE-LEFT; chest visibly angled away from camera; clear diagonal shoulder line (image-left shoulder farther, image-right shoulder closer). Head turned gently back toward the camera, upright, chin very slightly raised, neck naturally elongated; eyes looking directly into the lens. Torso and face must NOT point in the same direction. Both arms crossed naturally across the chest, one forearm over the other, hands partly visible near the opposite upper arms, following the torso's diagonal, not symmetrical, not stiff, anatomically correct hands. Straight but relaxed posture, chest naturally open, shoulders relaxed.

EXPRESSION: calm, serious, self-confident, relaxed; lips closed, no smile, not aggressive.

CAMERA & FRAMING: full-frame, 70–85mm lens, natural portrait compression; camera at upper-chest/shoulder height, 2.5–3.5 m away, physically in front of the subject (the three-quarter view comes from rotating the subject, not the camera). Vertical frame from lower waist/upper hips upward; entire head, shoulders and both crossed arms visible, elbows not cropped, small space above the hair. Subject fills ~75–82% of frame height. Premium editorial corporate portrait, not an ID photo; no forced centered symmetry. No wide-angle, close-up distortion, oversized head, exaggerated shoulders or Dutch angle.

LIGHTING: large soft key light 35–45° from camera-left, slightly above eye level; soft fill from camera-right. Natural dimensional modeling on face, jaw, neck, shoulders and clothing; the far side of the face may be slightly darker; soft natural shadows only. No flat passport light, harsh shadows, dramatic darkness, colored/neon light or strong rim light. Neutral daylight white balance, natural skin color.

PHOTOREALISM: commercial studio quality — natural skin texture with visible pores, real individual hair strands, accurate eye reflections, realistic lashes, brows, lips, hands, fabric texture and folds; high dynamic range, professional sharpness. No over-retouching, plastic skin, CGI, illustration or "AI face" look.

BACKGROUND: TRUE transparent background with a real alpha channel; subject completely isolated. No white, gray, black, colored or gradient background, wall, floor, props, text, logo or shadow behind the subject. Clean natural edges around hair strands, ears, neck, shoulders, arms, hands and clothing — no halo, glow or outline. Output: high-resolution PNG with true alpha transparency.

PRIORITY: 1) exact identity 2) exact natural body proportions 3) torso turned 25–35° to image-left 4) head back to camera, eyes into the lens 5) diagonal shoulder line 6) natural crossed arms 7) 70–85mm, medium distance 8) soft dimensional studio light 9) ultra-photorealism 10) true transparent background.
BODY IS TURNED. EYES LOOK INTO CAMERA. Never turn the whole person directly toward the camera.`;

/* ------------------------------------------------------------------ */
/* Javoblar tuzilmasi                                                 */
/* ------------------------------------------------------------------ */

export type ExperienceItem = { year: string; title: string; description: string };
export type AchievementItem = { title: string; year: string };
export type ProjectItem = { title: string; url: string; description: string };
export type SocialItem = { platform: string; url: string };

export type AnketaAnswers = {
  full_name: string;
  birth_date: string; // YYYY-MM-DD
  birth_place: string;
  activity: string;
  about: string;
  study_place: string;
  study_direction: string;
  experience: ExperienceItem[];
  achievements: AchievementItem[];
  projects: ProjectItem[];
  socials: SocialItem[];
  extra: string;
  phone: string;
  instagram: string;
  telegram: string;
  /** "Maʼlumot yoʻq" bosilgan savollar kalitlari. */
  skipped: string[];
};

export function emptyAnswers(fullName = ""): AnketaAnswers {
  return {
    full_name: fullName,
    birth_date: "",
    birth_place: "",
    activity: "",
    about: "",
    study_place: "",
    study_direction: "",
    experience: [],
    achievements: [],
    projects: [],
    socials: [],
    extra: "",
    phone: "",
    instagram: "",
    telegram: "",
    skipped: [],
  };
}

/* ------------------------------------------------------------------ */
/* Qadamlar — 11 ta (rasm + 9 savol + yakuniy)                        */
/* ------------------------------------------------------------------ */

export type StepKey =
  | "photo"
  | "birth"
  | "activity"
  | "about"
  | "study"
  | "experience"
  | "achievements"
  | "projects"
  | "extra"
  | "final";

export const STEPS: { key: StepKey; title: string; hint: string; optional?: boolean }[] = [
  { key: "photo", title: "Sifatli profilingiz rasmi", hint: "PNG yoki JPG. Rasm foni avtomatik olib tashlanadi." },
  { key: "birth", title: "Tugʻilgan sana va joy", hint: "Sana va tugʻilgan shahar yoki tumaningiz." },
  { key: "activity", title: "Hozirgi faoliyatingiz", hint: "Masalan: «Dasturchi, IT Park rezidenti» yoki «Talaba, faol volontyor»." },
  { key: "about", title: "Oʻzingiz haqingizda qisqacha", hint: "3–6 gap: kimsiz, nima bilan shugʻullanasiz, maqsadingiz." },
  { key: "study", title: "Oʻqish joyingiz va yoʻnalishingiz", hint: "Oliygoh, kollej yoki maktab hamda mutaxassislik." },
  { key: "experience", title: "Ish va faoliyat tajribangiz", hint: "Har bir tajribani alohida qoʻshing." },
  { key: "achievements", title: "Eng muhim yutuqlaringiz", hint: "Gʻoliblik, sertifikat, mukofot, grant va h.k." },
  { key: "projects", title: "Loyihalaringiz", hint: "Nomi, qisqa tavsifi va havolasi (boʻlsa)." },
  { key: "extra", title: "Qoʻshimcha maʼlumotlar", hint: "Ixtiyoriy — yuqorida aytilmagan muhim narsalar.", optional: true },
  { key: "final", title: "Aloqa maʼlumotlari", hint: "F.I.Sh va telefon raqam majburiy. Ijtimoiy tarmoqlar — ixtiyoriy." },
];

export const SOCIAL_OPTIONS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "telegram", label: "Telegram" },
  { value: "github", label: "GitHub" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X (Twitter)" },
  { value: "website", label: "Shaxsiy sayt" },
] as const;

/* ------------------------------------------------------------------ */
/* Kiruvchi JSON'ni xavfsiz tozalash                                  */
/* ------------------------------------------------------------------ */

const LIMITS = { short: 200, medium: 600, long: 4000, items: 15 };

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function list<T>(value: unknown, map: (row: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, LIMITS.items)
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map(map);
}

export function sanitizeAnswers(raw: unknown): AnketaAnswers {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const date = str(r.birth_date, 10);
  return {
    full_name: str(r.full_name, LIMITS.short),
    birth_date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    birth_place: str(r.birth_place, LIMITS.short),
    activity: str(r.activity, LIMITS.medium),
    about: str(r.about, LIMITS.long),
    study_place: str(r.study_place, LIMITS.short),
    study_direction: str(r.study_direction, LIMITS.short),
    experience: list(r.experience, (row) => ({
      year: str(row.year, 40),
      title: str(row.title, LIMITS.short),
      description: str(row.description, LIMITS.medium),
    })),
    achievements: list(r.achievements, (row) => ({
      title: str(row.title, LIMITS.medium),
      year: str(row.year, 4),
    })),
    projects: list(r.projects, (row) => ({
      title: str(row.title, LIMITS.short),
      url: str(row.url, 300),
      description: str(row.description, LIMITS.medium),
    })),
    socials: list(r.socials, (row) => ({
      platform: str(row.platform, 30),
      url: str(row.url, 300),
    })),
    extra: str(r.extra, LIMITS.long),
    phone: str(r.phone, 30),
    instagram: str(r.instagram, 60),
    telegram: str(r.telegram, 60),
    skipped: Array.isArray(r.skipped)
      ? r.skipped.filter((k): k is string => typeof k === "string").slice(0, 20)
      : [],
  };
}

/** @username ko'rinishiga keltiradi (havola yoki @ siz yozilgan bo'lsa ham). */
export function normalizeUsername(value: string): string {
  const cleaned = value
    .trim()
    .replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me|instagram\.com)\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "");
  return cleaned ? `@${cleaned}` : "";
}

/** Telefon raqamni +998 XX XXX XX XX ko'rinishiga keltiradi; noto'g'ri bo'lsa "". */
export function normalizePhone(value: string): string {
  let d = value.replace(/\D/g, "");
  if (d.length === 9) d = `998${d}`;
  if (d.length !== 12 || !d.startsWith("998")) return "";
  return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
}

/** Savolga javob berilganmi (yoki "yo'q" bosilganmi). */
export function stepFilled(key: StepKey, a: AnketaAnswers): boolean {
  if (a.skipped.includes(key)) return true;
  switch (key) {
    case "birth":
      return !!a.birth_date || !!a.birth_place.trim();
    case "activity":
      return !!a.activity.trim();
    case "about":
      return a.about.trim().length >= 20;
    case "study":
      return !!a.study_place.trim();
    case "experience":
      return a.experience.some((x) => x.title.trim());
    case "achievements":
      return a.achievements.some((x) => x.title.trim());
    case "projects":
      return a.projects.some((x) => x.title.trim());
    case "extra":
      return true;
    default:
      return true;
  }
}

/* ------------------------------------------------------------------ */
/* Holat yorliqlari                                                   */
/* ------------------------------------------------------------------ */

export type AnketaStatus = "toldirilmoqda" | "yuborildi" | "tasdiqlandi" | "nashr_etildi" | "rad_etildi";
export type PaymentStatus = "yoq" | "kutilmoqda" | "tolandi" | "tolanmadi";

export const ANKETA_STATUS_LABELS: Record<AnketaStatus, string> = {
  toldirilmoqda: "Toʻldirilmoqda",
  yuborildi: "Tekshiruv kutilmoqda",
  tasdiqlandi: "Tasdiqlangan",
  nashr_etildi: "Saytda",
  rad_etildi: "Rad etilgan",
};

export const ANKETA_STATUS_TONES: Record<AnketaStatus, Tone> = {
  toldirilmoqda: "neutral",
  yuborildi: "info",
  tasdiqlandi: "warning",
  nashr_etildi: "success",
  rad_etildi: "danger",
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  yoq: "Soʻralmagan",
  kutilmoqda: "Tekshirilmoqda",
  tolandi: "Toʻlov qilingan",
  tolanmadi: "Toʻlanmagan",
};

export const PAYMENT_TONES: Record<PaymentStatus, Tone> = {
  yoq: "neutral",
  kutilmoqda: "warning",
  tolandi: "success",
  tolanmadi: "danger",
};

/** Jinsga qarab anketa rangi: qizlarga pushti, o'g'il bolalarga ko'k (globals.css). */
export const GENDER_CLASS: Record<"ayol" | "erkak", string> = {
  erkak: "yw-boy",
  ayol: "yw-girl",
};
