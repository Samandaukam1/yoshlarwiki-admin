import type { Tone } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* AI portret prompti — anketada rasm yuklash ostida beriladi.        */
/* Qisqartirilgan, lekin asl promptdagi barcha talablar saqlangan.    */
/* O'ZGARMAYDI: admin paneldan tahrirlanmaydi.                        */
/* ------------------------------------------------------------------ */

export const PORTRAIT_PROMPT = `Use the uploaded photo as the ONLY identity reference. Create an ultra-photorealistic studio portrait of the SAME PERSON.

IDENTITY (do not change)

Exact face, facial proportions, head shape, eyes, eyebrows, nose, lips, jawline, ears, skin tone and natural skin texture, hairstyle, hairline, hair color, body build, shoulder width, apparent age. Do not beautify, retouch heavily, slim, broaden or reinterpret. It must clearly be the same person, not a lookalike.

POSE (fixed, must be identical every time)

Perfectly frontal, straight-on view. The person faces the camera head-on, like a passport-style front view but relaxed and confident.

- Nose, chin, sternum and belt line are on one vertical center line, pointing straight at the lens.

- Both shoulders at the same height and the same distance from the camera. No body turn, no three-quarter angle, no diagonal shoulder line.

- Neutral head position: head upright and level, no tilt, no turn, chin neither raised nor lowered. Eyes look straight into the lens.

- Arms crossed over the chest: right forearm over left forearm (the person's own right over left), hands tucked lightly near the opposite upper arms, elbows relaxed and slightly out.

- Completely neutral face and expression: relaxed face muscles, lips gently closed and relaxed, no smile, no smirk, no frown, eyebrows relaxed and level, eyes calm and open naturally, no squinting, no raised cheeks. Emotionless, like a neutral reference photo.

- Weight evenly on both legs, standing straight. Posture tall, chest open.

FRAMING (fixed)

Vertical 2:3 portrait. Camera straight in front at upper-chest height, 85mm lens look, no wide-angle distortion. Frame from upper hips up. Whole head, shoulders and both arms visible. Small space above the hair. Subject fills about 80% of the frame height, centered.

LIGHTING (fixed)

Large soft key light from camera-left, slightly above eye level, soft fill from camera-right. Natural soft shadows, neutral daylight white balance, natural skin color. No colored light, no harsh shadows, no rim light.

REALISM

Natural skin pores, individual hair strands, realistic hands and fabric folds. No plastic skin, no CGI or illustration look.

BACKGROUND

TRUE TRANSPARENT BACKGROUND with a real alpha channel. Completely isolate the person; all background pixels must have zero opacity. Output only a high-resolution PNG with actual alpha transparency. Do NOT use a white, gray, black, colored or gradient background. Do NOT draw a checkerboard pattern to imitate transparency. No floor, no shadow behind the subject, no props, no text. Preserve clean natural edges around hair and clothing, without halos or outlines.`;

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
  { key: "photo", title: "Sifatli profilingiz rasmi", hint: "Faqat pastdagi prompt orqali yasalgan shaffof fonli PNG rasm qabul qilinadi." },
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
  yuborildi: "Toʻlov kutilmoqda",
  tasdiqlandi: "Chop etilmoqda",
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
