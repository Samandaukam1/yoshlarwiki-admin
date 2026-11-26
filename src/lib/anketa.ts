import type { Tone } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* AI portret prompti — anketada rasm yuklash ostida beriladi.        */
/* Qisqartirilgan, lekin asl promptdagi barcha talablar saqlangan.    */
/* O'ZGARMAYDI: admin paneldan tahrirlanmaydi.                        */
/* ------------------------------------------------------------------ */

export const PORTRAIT_PROMPT = `Use the uploaded PERSON IMAGE as the ONLY identity reference.
Create a new ultra-photorealistic professional studio portrait of the SAME PERSON from the uploaded image.
CRITICAL IDENTITY PRESERVATION:
Preserve the person exactly and naturally.
Do NOT redesign, beautify, idealize, replace, age, de-age, masculinize, feminize, or reinterpret the person.
Keep unchanged:
exact facial identity
facial structure and proportions
head shape and head size
eyes
eyebrows
nose
lips
jawline
ears
skin tone
natural skin characteristics
hairstyle
hairline
hair texture
hair color
hair volume
natural body type
shoulder width
body proportions
apparent age
gender presentation
The final image must clearly look like the SAME PERSON from the uploaded image.
Do NOT create a similar-looking AI person.
Do NOT replace the face.
Do NOT modify facial proportions.
========================================
EXACT BODY POSE
Create a confident professional three-quarter standing portrait.
IMPORTANT:
The subject must NOT stand directly facing the camera.
Judge left and right from the viewer’s perspective in the finished image.
Turn the chest and hips 25–35 degrees toward the viewer’s right.
The shoulder on the viewer’s left is closer to the camera.
The shoulder on the viewer’s right is farther from the camera.
Keep the arms naturally crossed. Turn the face back toward the camera and look directly into the lens.
The chest must be visibly angled away from the camera.
The shoulders must NOT be parallel to the image plane.
The body must clearly have depth and three-dimensional orientation.
Do NOT create a flat frontal pose.
BODY DIRECTION:
torso and hips turned slightly toward image-right.
HEAD DIRECTION:
turn the head gently back toward the camera.
EYE DIRECTION:
eyes looking directly into the camera lens.
IMPORTANT BODY–HEAD RELATIONSHIP:
The torso and the face must NOT point in exactly the same direction.
The torso remains angled toward image-right,
while the face turns back toward the camera.
This body/head separation is essential.
========================================
HEAD AND EXPRESSION
Head held naturally upright.
Chin raised very slightly.
Neck elongated naturally.
Face mostly toward camera but with a subtle three-quarter orientation.
Do NOT create a perfectly symmetrical passport-photo face angle.
Expression:
calm
serious
self-confident
relaxed
premium professional presence
lips naturally closed
no smile
no exaggerated emotion
Do NOT make the expression aggressive.
========================================
ARMS
Both arms crossed naturally across the chest.
One forearm rests naturally over the other.
Hands partially visible near the opposite upper arms.
Elbows positioned naturally.
The crossed arms must follow the diagonal orientation of the torso.
Do NOT make the arms perfectly symmetrical.
Do NOT create a stiff or unnatural crossed-arm pose.
Hands and fingers must be anatomically correct.
========================================
POSTURE
Straight but relaxed posture.
Chest naturally open.
Shoulders relaxed.
Upper body confident and elegant.
Do NOT enlarge the chest.
Do NOT make the person more muscular.
Do NOT make the person thinner or broader.
Preserve the person's original natural body build exactly.
========================================
CAMERA
Professional full-frame portrait photography.
Camera position:
approximately at upper-chest to shoulder height.
Lens:
approximately 70–85mm full-frame equivalent.
Use natural portrait compression.
Camera must remain physically in front of the subject.
IMPORTANT:
Create the three-quarter perspective by rotating the SUBJECT,
not by moving the camera excessively to the side.
No wide-angle lens.
No close-up distortion.
No oversized head.
No exaggerated shoulders.
No perspective distortion.
No Dutch angle.
========================================
CAMERA DISTANCE AND FRAMING
Vertical portrait composition.
Camera distance approximately 2.5–3.5 meters from the subject.
Frame from approximately lower waist / upper hip level upward.
Entire head visible.
Entire shoulders visible.
Both crossed arms fully visible.
Do not crop the elbows unnaturally.
Leave a small clean amount of space above the hair.
Subject occupies approximately 75–82% of the frame height.
The composition must feel like a premium editorial corporate portrait,
not an ID photo.
Do NOT force perfectly centered symmetry.
The diagonal three-quarter body orientation must remain visually obvious.
========================================
LIGHTING
Professional high-end studio lighting.
Main key light:
large soft diffused light approximately 35–45 degrees from camera-left,
slightly above eye level.
Soft fill light from camera-right.
Natural dimensional modeling on the face.
The side of the face farther from the key light may be slightly darker.
Create subtle depth across:
face
jaw
neck
shoulders
jacket or clothing
Soft natural shadows only.
No harsh shadows.
No flat passport lighting.
No dramatic cinematic darkness.
No colored lighting.
No neon.
No strong rim light.
Neutral daylight-balanced white balance.
Natural realistic skin color.
========================================
PHOTOREALISM
Ultra-photorealistic commercial studio photography.
Extremely realistic facial detail.
Natural skin texture.
Visible natural skin pores.
Realistic individual hair strands.
Accurate eye reflections.
Realistic eyelashes and eyebrows.
Natural lips.
Realistic hands and fingers.
Physically realistic clothing folds.
Realistic fabric texture.
Natural photographic depth.
High dynamic range.
Professional camera sharpness.
Do NOT over-retouch.
Do NOT smooth the skin excessively.
Do NOT create plastic skin.
Do NOT create CGI appearance.
Do NOT create illustration appearance.
Do NOT create an AI-generated face aesthetic.
========================================
BACKGROUND
TRUE TRANSPARENT BACKGROUND.
The final subject must be completely isolated.
Use a real alpha channel.
NO:
white background
gray background
black background
colored background
studio wall
gradient
floor
environment
furniture
props
text
logo
decorative elements
artificial shadow behind subject
The background must contain ZERO visible pixels behind the subject.
Preserve extremely clean natural edges around:
hair
individual hair strands
ears
neck
shoulders
arms
hands
clothing
No white halo.
No dark halo.
No glow.
No outline.
No background contamination.
Output as high-resolution PNG with true alpha transparency.
========================================
STRICT NEGATIVE INSTRUCTIONS
ABSOLUTELY DO NOT:
make the person face straight forward with the whole body
create a passport-photo pose
create a symmetrical frontal torso
align both shoulders horizontally toward the camera
make both shoulders equally distant from camera
flatten the torso
point head and torso in exactly the same direction
change the person's face
change the person's hairstyle
change the person's body type
beautify the person
change apparent age
exaggerate muscles
alter shoulder width
distort hands
crop the head
use wide-angle perspective
create artificial background
========================================
FINAL PRIORITY ORDER
Preserve exact identity.
Preserve exact natural body proportions.
Torso rotated 25–35 degrees toward image-right.
Head turned back toward camera.
Eyes directly into camera.
Clear diagonal shoulder line.
Natural crossed-arm pose.
70–85mm portrait-camera perspective.
Medium portrait camera distance.
Soft dimensional studio lighting.
Ultra-photorealistic result.
True transparent background.
The final result must feel confident, elegant, premium and editorial.
Most importantly:
BODY IS TURNED.
FACE RETURNS TOWARD CAMERA.
EYES LOOK INTO CAMERA.
Never turn the entire person directly toward the camera.

`;

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
