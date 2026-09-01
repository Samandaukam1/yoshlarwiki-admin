/** Media yuklash natijasi. */
export type MediaResult = {
  status: "idle" | "success" | "error";
  message: string;
  url?: string;
};

export const idleMedia: MediaResult = { status: "idle", message: "" };

/**
 * Storage bucketlari. "use server" fayli faqat async funksiya eksport
 * qila olgani uchun bu ro'yxat shu yerda turadi.
 */
export const BUCKETS = ["portraits", "projects", "media", "og"] as const;
export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_LABELS: Record<string, string> = {
  portraits: "Portretlar",
  projects: "Loyiha rasmlari",
  media: "Galereya / video",
  og: "Open Graph rasmlari",
};
