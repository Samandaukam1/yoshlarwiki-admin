"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CANDIDATE_STATUSES, slugify, type CandidateStatus } from "@/lib/constants";
import type { CmsResult } from "./types";

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                       */
/* ------------------------------------------------------------------ */

async function guard() {
  const admin = await requireAdmin();
  if (!canWrite(admin)) throw new Error("forbidden");
  return admin;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullable(formData: FormData, key: string): string | null {
  return text(formData, key) || null;
}

function number(formData: FormData, key: string): number | null {
  const raw = text(formData, key);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Slug bandligini tekshirib, bo'sh variantini qaytaradi. */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  ignoreId?: string,
): Promise<string> {
  const root = slugify(base) || "nomzod";
  let candidate = root;
  let n = 1;

  for (;;) {
    let query = supabase.from("candidates").select("id").eq("slug", candidate);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

/* ------------------------------------------------------------------ */
/* Nomzod yaratish                                                    */
/* ------------------------------------------------------------------ */

export async function createCandidate(
  _previous: CmsResult,
  formData: FormData,
): Promise<CmsResult> {
  const admin = await guard();
  const fullName = text(formData, "full_name");

  if (fullName.length < 2) {
    return { status: "error", field: "full_name", message: "Ism familiyani kiriting." };
  }

  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, text(formData, "slug") || fullName);

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      full_name: fullName,
      slug,
      title: nullable(formData, "title"),
      status: "draft",
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "Nomzod yaratilmadi. Qayta urinib koʻring." };
  }

  revalidatePath("/nomzodlar");
  redirect(`/nomzodlar/${data.id}`);
}

/* ------------------------------------------------------------------ */
/* Asosiy maydonlar                                                   */
/* ------------------------------------------------------------------ */

export async function saveCandidate(
  _previous: CmsResult,
  formData: FormData,
): Promise<CmsResult> {
  await guard();
  const id = text(formData, "id");
  const fullName = text(formData, "full_name");

  if (fullName.length < 2) {
    return { status: "error", field: "full_name", message: "Ism familiyani kiriting." };
  }

  const supabase = await createClient();
  const requestedSlug = text(formData, "slug") || fullName;
  const slug = await uniqueSlug(supabase, requestedSlug, id);

  const keywords = text(formData, "keywords")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("candidates")
    .update({
      full_name: fullName,
      slug,
      title: nullable(formData, "title"),
      intro: nullable(formData, "intro"),
      about: nullable(formData, "about"),
      portrait_url: nullable(formData, "portrait_url"),
      portrait_alt: nullable(formData, "portrait_alt"),
      video_url: nullable(formData, "video_url"),
      birth_date: nullable(formData, "birth_date"),
      birth_place: nullable(formData, "birth_place"),
      specialization: nullable(formData, "specialization"),
      direction: nullable(formData, "direction"),
      activity_field: nullable(formData, "activity_field"),
      region_id: nullable(formData, "region_id"),
      primary_category_id: nullable(formData, "primary_category_id"),
      years_experience: number(formData, "years_experience"),
      projects_count: number(formData, "projects_count"),
      is_featured: formData.get("is_featured") === "on",
      sort_order: number(formData, "sort_order") ?? 0,
      seo_title: nullable(formData, "seo_title"),
      seo_description: nullable(formData, "seo_description"),
      og_title: nullable(formData, "og_title"),
      og_description: nullable(formData, "og_description"),
      og_image_url: nullable(formData, "og_image_url"),
      canonical_url: nullable(formData, "canonical_url"),
      keywords,
      no_index: formData.get("no_index") === "on",
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Saqlashda xatolik yuz berdi." };
  }

  revalidatePath(`/nomzodlar/${id}`);
  revalidatePath("/nomzodlar");
  return { status: "success", message: `Saqlandi. Havola: /yoshlar/${slug}` };
}

/* ------------------------------------------------------------------ */
/* Holatni o'zgartirish                                               */
/* ------------------------------------------------------------------ */

export async function setCandidateStatus(
  _previous: CmsResult,
  formData: FormData,
): Promise<CmsResult> {
  await guard();
  const id = text(formData, "id");
  const next = text(formData, "status");

  if (!CANDIDATE_STATUSES.includes(next as CandidateStatus)) {
    return { status: "error", message: "Notoʻgʻri holat." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidates")
    .update({ status: next as CandidateStatus })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Holatni oʻzgartirib boʻlmadi." };
  }

  revalidatePath(`/nomzodlar/${id}`);
  revalidatePath("/nomzodlar");
  return { status: "success", message: "Holat yangilandi." };
}

export async function deleteCandidate(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("candidates").delete().eq("id", id);
  revalidatePath("/nomzodlar");
  redirect("/nomzodlar");
}

/* ------------------------------------------------------------------ */
/* Bog'liq bo'limlar                                                  */
/* ------------------------------------------------------------------ */

type SectionTable =
  | "candidate_education"
  | "candidate_experience"
  | "candidate_achievements"
  | "candidate_projects"
  | "candidate_social_links";

const SECTION_TABLES: SectionTable[] = [
  "candidate_education",
  "candidate_experience",
  "candidate_achievements",
  "candidate_projects",
  "candidate_social_links",
];

/** Bo'lim uchun yangi yozuv qo'shadi. */
export async function addSectionItem(
  _previous: CmsResult,
  formData: FormData,
): Promise<CmsResult> {
  await guard();

  const table = text(formData, "table") as SectionTable;
  const candidateId = text(formData, "candidate_id");

  if (!SECTION_TABLES.includes(table)) {
    return { status: "error", message: "Notoʻgʻri boʻlim." };
  }

  const supabase = await createClient();
  const sortOrder = number(formData, "sort_order") ?? 0;
  let payload: Record<string, unknown> = {
    candidate_id: candidateId,
    sort_order: sortOrder,
  };

  if (table === "candidate_education") {
    const institution = text(formData, "institution");
    if (!institution) {
      return { status: "error", message: "Oʻquv muassasasi nomini kiriting." };
    }
    payload = {
      ...payload,
      institution,
      degree: nullable(formData, "degree"),
      level: nullable(formData, "level"),
      start_year: number(formData, "start_year"),
      end_year: number(formData, "end_year"),
      is_current: formData.get("is_current") === "on",
    };
  } else if (table === "candidate_experience") {
    const title = text(formData, "title");
    const yearLabel = text(formData, "year_label");
    if (!title || !yearLabel) {
      return { status: "error", message: "Yil va nomni kiriting." };
    }
    payload = {
      ...payload,
      year_label: yearLabel,
      title,
      subtitle: nullable(formData, "subtitle"),
      description: nullable(formData, "description"),
    };
  } else if (table === "candidate_achievements") {
    const title = text(formData, "title");
    if (!title) return { status: "error", message: "Yutuq nomini kiriting." };
    payload = { ...payload, title, year: number(formData, "year") };
  } else if (table === "candidate_projects") {
    const title = text(formData, "title");
    if (!title) return { status: "error", message: "Loyiha nomini kiriting." };
    payload = {
      ...payload,
      title,
      description: nullable(formData, "description"),
      image_url: nullable(formData, "image_url"),
      url: nullable(formData, "url"),
      is_active: true,
    };
  } else {
    const platform = text(formData, "platform");
    const url = text(formData, "url");
    if (!platform || !/^https?:\/\//i.test(url)) {
      return {
        status: "error",
        message: "Platformani tanlang va toʻliq havola (https://) kiriting.",
      };
    }
    payload = { ...payload, platform, url };
  }

  // @ts-expect-error — jadval nomi ish vaqtida tanlanadi, yuqorida tekshirilgan.
  const { error } = await supabase.from(table).insert(payload);

  if (error) {
    return { status: "error", message: "Qoʻshib boʻlmadi. Maydonlarni tekshiring." };
  }

  revalidatePath(`/nomzodlar/${candidateId}`);
  return { status: "success", message: "Qoʻshildi." };
}

/** Bo'limdagi yozuvni o'chiradi. */
export async function deleteSectionItem(formData: FormData) {
  await guard();
  const table = String(formData.get("table") ?? "") as SectionTable;
  const id = String(formData.get("id") ?? "");
  const candidateId = String(formData.get("candidate_id") ?? "");

  if (!SECTION_TABLES.includes(table)) return;

  const supabase = await createClient();
  await supabase.from(table).delete().eq("id", id);

  revalidatePath(`/nomzodlar/${candidateId}`);
}

/* ------------------------------------------------------------------ */
/* Kategoriyalar biriktirish                                          */
/* ------------------------------------------------------------------ */

export async function setCandidateCategories(
  _previous: CmsResult,
  formData: FormData,
): Promise<CmsResult> {
  await guard();
  const candidateId = text(formData, "candidate_id");
  const selected = formData.getAll("category_ids").map(String).filter(Boolean);

  const supabase = await createClient();
  await supabase.from("candidate_categories").delete().eq("candidate_id", candidateId);

  if (selected.length > 0) {
    const { error } = await supabase.from("candidate_categories").insert(
      selected.map((categoryId) => ({
        candidate_id: candidateId,
        category_id: categoryId,
      })),
    );
    if (error) {
      return { status: "error", message: "Kategoriyalarni saqlab boʻlmadi." };
    }
  }

  revalidatePath(`/nomzodlar/${candidateId}`);
  return { status: "success", message: "Kategoriyalar yangilandi." };
}
