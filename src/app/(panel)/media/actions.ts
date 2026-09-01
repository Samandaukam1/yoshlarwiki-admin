"use server";

import { revalidatePath } from "next/cache";

import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/constants";
import { BUCKETS, type Bucket, type MediaResult } from "./types";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
]);

const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadMedia(
  _previous: MediaResult,
  formData: FormData,
): Promise<MediaResult> {
  const admin = await requireAdmin();
  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda fayl yuklash uchun ruxsat yoʻq." };
  }

  const bucket = String(formData.get("bucket") ?? "") as Bucket;
  if (!BUCKETS.includes(bucket)) {
    return { status: "error", message: "Notoʻgʻri bucket." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Fayl tanlanmadi." };
  }

  if (!ALLOWED.has(file.type)) {
    return {
      status: "error",
      message: "Faqat JPEG, PNG, WebP, AVIF rasm yoki MP4 video yuklash mumkin.",
    };
  }

  if (file.size > MAX_BYTES) {
    return { status: "error", message: "Fayl hajmi 8 MB dan oshmasligi kerak." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "fayl";
  const path = `${new Date().getFullYear()}/${base}-${Date.now().toString(36)}.${extension}`;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { status: "error", message: `Yuklashda xatolik: ${error.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  revalidatePath("/media");
  return { status: "success", message: "Fayl yuklandi.", url: publicUrl };
}

export async function deleteMedia(formData: FormData) {
  const admin = await requireAdmin();
  if (!canWrite(admin)) return;

  const bucket = String(formData.get("bucket") ?? "") as Bucket;
  const path = String(formData.get("path") ?? "");
  if (!BUCKETS.includes(bucket) || !path) return;

  const supabase = await createClient();
  await supabase.storage.from(bucket).remove([path]);
  revalidatePath("/media");
}
