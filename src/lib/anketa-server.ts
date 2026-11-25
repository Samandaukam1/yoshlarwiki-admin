import "server-only";

import { randomBytes } from "node:crypto";

import { emptyAnswers, sanitizeAnswers, type AnketaAnswers } from "./anketa";
import type { AnketaSeo } from "./anketa-polish";
import { USER_SITE_URL } from "./config";
import { slugify } from "./constants";
import { startOfTodayTashkent, TIME_ZONE } from "./dates";
import { createAdminClient } from "./supabase/admin";
import type { Database } from "./supabase/database.types";
import { adminBaseUrl, getBotSettings } from "./telegram";

export type Anketa = Database["public"]["Tables"]["anketalar"]["Row"];
type Db = ReturnType<typeof createAdminClient>;

export function formatTashkent(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/* ------------------------------------------------------------------ */
/* Havola yaratish                                                    */
/* ------------------------------------------------------------------ */

export async function createAnketaWithLink(input: {
  fullName: string;
  gender: "erkak" | "ayol";
  botAdminId?: string | null;
  adminId?: string | null;
}): Promise<{ anketa: Anketa; url: string; expiresAt: string; ttlHours: number } | null> {
  const db = createAdminClient();
  const settings = await getBotSettings();
  const ttlHours = settings?.link_ttl_hours ?? 24;
  const expiresAt = new Date(Date.now() + ttlHours * 3_600_000).toISOString();
  const fullName = input.fullName.replace(/\s+/g, " ").trim().slice(0, 200);

  const { data: anketa, error } = await db
    .from("anketalar")
    .insert({
      full_name: fullName,
      gender: input.gender,
      expires_at: expiresAt,
      answers: emptyAnswers(fullName),
      created_by_bot_admin: input.botAdminId ?? null,
      created_by_admin: input.adminId ?? null,
    })
    .select("*")
    .single();

  if (error || !anketa) return null;

  const token = randomBytes(18).toString("base64url");
  const { error: linkError } = await db
    .from("anketa_links")
    .insert({ token, anketa_id: anketa.id, expires_at: expiresAt });

  if (linkError) {
    await db.from("anketalar").delete().eq("id", anketa.id);
    return null;
  }

  return { anketa, url: `${await adminBaseUrl()}/anketa/${token}`, expiresAt, ttlHours };
}

/* ------------------------------------------------------------------ */
/* Havolani tekshirish (ommaviy anketa sahifasi)                      */
/* ------------------------------------------------------------------ */

/**
 * Token bo'yicha faol anketani qaytaradi. Muddati o'tgan havola darhol
 * Supabase'dan o'chiriladi va `null` qaytadi.
 */
export async function loadActiveLink(token: string): Promise<Anketa | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const db = createAdminClient();

  const { data: link } = await db
    .from("anketa_links")
    .select("token, expires_at, anketa:anketalar(*)")
    .eq("token", token)
    .maybeSingle();

  if (!link) return null;

  const anketa = link.anketa as unknown as Anketa | null;
  const expired = new Date(link.expires_at).getTime() < Date.now();

  if (!anketa || expired || anketa.status !== "toldirilmoqda") {
    await db.from("anketa_links").delete().eq("token", token);
    return null;
  }
  return anketa;
}

/* ------------------------------------------------------------------ */
/* Statistika                                                         */
/* ------------------------------------------------------------------ */

export type AnketaStats = {
  total: number;
  today: number;
  filling: number;
  submitted: number;
  approved: number;
  published: number;
  candidatesTotal: number;
};

export async function getAnketaStats(db: Db = createAdminClient()): Promise<AnketaStats> {
  const base = () => db.from("anketalar").select("id", { count: "exact", head: true });
  const n = async (query: PromiseLike<{ count: number | null }>) => (await query).count ?? 0;

  const [total, today, filling, submitted, approved, published, candidatesTotal] =
    await Promise.all([
      n(base()),
      n(base().gte("created_at", startOfTodayTashkent())),
      n(base().eq("status", "toldirilmoqda")),
      n(base().eq("status", "yuborildi")),
      n(base().eq("status", "tasdiqlandi")),
      n(base().eq("status", "nashr_etildi")),
      n(db.from("candidates").select("id", { count: "exact", head: true })),
    ]);

  return { total, today, filling, submitted, approved, published, candidatesTotal };
}

/** Saytdagi profil havolasi (slug F.I.Sh dan hosil bo'ladi). */
export function profileUrlFor(slug: string): string {
  return `${USER_SITE_URL}/yoshlar/${slug}`;
}

/* ------------------------------------------------------------------ */
/* Nomzod profili (qoralama → chop etish)                             */
/* ------------------------------------------------------------------ */

async function uniqueSlug(db: Db, base: string): Promise<string> {
  const root = slugify(base) || "nomzod";
  let slug = root;
  for (let n = 2; n < 200; n += 1) {
    const { data } = await db.from("candidates").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${root}-${n}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

const SOCIAL_BASE: Record<string, string> = {
  instagram: "https://instagram.com/",
  telegram: "https://t.me/",
};

/** Anketadan nomzod profilining asosiy maydonlari (slug/status/created_by'siz). */
function candidateFields(anketa: Anketa) {
  const a: AnketaAnswers = sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);
  const seo = (anketa.seo ?? {}) as Partial<AnketaSeo>;
  const fullName = a.full_name || anketa.full_name;
  const about = [a.about, a.extra ? `Qoʻshimcha: ${a.extra}` : ""].filter(Boolean).join("\n\n");

  return {
    a,
    fullName,
    fields: {
      full_name: fullName,
      gender: anketa.gender,
      title: seo.title || a.activity || null,
      intro: seo.intro || null,
      about: about || null,
      portrait_url: anketa.photo_url,
      portrait_alt: `${fullName} portreti`,
      birth_date: a.birth_date || null,
      birth_place: a.birth_place || null,
      activity_field: a.activity || null,
      direction: a.study_direction || null,
      specialization: a.study_direction || null,
      projects_count: a.projects.length || null,
      seo_title: seo.seo_title || null,
      seo_description: seo.seo_description || null,
      og_title: seo.og_title || null,
      og_description: seo.og_description || null,
      og_image_url: anketa.photo_url,
      keywords: seo.keywords ?? [],
    },
  };
}

/** Ta'lim, tajriba, yutuq, loyiha va ijtimoiy tarmoqlar — profilga yoziladi. */
async function insertCandidateDetails(db: Db, id: string, a: AnketaAnswers) {
  const jobs: PromiseLike<unknown>[] = [];

  if (a.study_place) {
    jobs.push(
      db.from("candidate_education").insert({
        candidate_id: id,
        institution: a.study_place,
        degree: a.study_direction || null,
        sort_order: 0,
      }),
    );
  }

  if (a.experience.length) {
    jobs.push(
      db.from("candidate_experience").insert(
        a.experience.map((x, i) => ({
          candidate_id: id,
          year_label: x.year || "—",
          title: x.title,
          description: x.description || null,
          sort_order: i,
        })),
      ),
    );
  }

  if (a.achievements.length) {
    jobs.push(
      db.from("candidate_achievements").insert(
        a.achievements.map((x, i) => {
          const year = Number.parseInt(x.year, 10);
          return {
            candidate_id: id,
            title: x.title,
            year: Number.isFinite(year) ? year : null,
            sort_order: i,
          };
        }),
      ),
    );
  }

  if (a.projects.length) {
    jobs.push(
      db.from("candidate_projects").insert(
        a.projects.map((x, i) => ({
          candidate_id: id,
          title: x.title,
          url: x.url || null,
          description: x.description || null,
          is_active: true,
          sort_order: i,
        })),
      ),
    );
  }

  const socials = [...a.socials];
  for (const platform of ["instagram", "telegram"] as const) {
    const handle = a[platform].replace(/^@/, "").trim();
    if (handle) socials.push({ platform, url: `${SOCIAL_BASE[platform]}${handle}` });
  }
  // Bir xil havola ikki marta yozilmasin
  const seen = new Set<string>();
  const uniqueSocials = socials.filter((x) => {
    if (!x.url) return false;
    const key = x.url.toLowerCase().replace(/\/+$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (uniqueSocials.length) {
    jobs.push(
      db.from("candidate_social_links").insert(
        uniqueSocials.map((x, i) => ({ candidate_id: id, platform: x.platform, url: x.url, sort_order: i })),
      ),
    );
  }

  await Promise.all(jobs);
}

export async function createCandidateFromAnketa(
  anketa: Anketa,
  adminId: string | null,
): Promise<{ ok: true; candidateId: string } | { ok: false; message: string }> {
  const db = createAdminClient();
  const { a, fullName, fields } = candidateFields(anketa);
  const slug = await uniqueSlug(db, fullName);

  const { data: candidate, error } = await db
    .from("candidates")
    .insert({ ...fields, slug, status: "draft", theme_color: "standard", created_by: adminId })
    .select("id")
    .single();

  if (error || !candidate) {
    return { ok: false, message: `Profil yaratilmadi: ${error?.message ?? "nomaʼlum xato"}` };
  }

  await insertCandidateDetails(db, candidate.id, a);

  await db
    .from("anketalar")
    .update({
      status: "tasdiqlandi",
      candidate_id: candidate.id,
      approved_at: new Date().toISOString(),
      profile_url: profileUrlFor(slug),
    })
    .eq("id", anketa.id);

  return { ok: true, candidateId: candidate.id };
}

/**
 * Anketa tahrirlangandan keyin profilni yangilash: asosiy maydonlar va
 * ta'lim / tajriba / yutuq / loyiha / ijtimoiy tarmoqlar anketadan qayta yoziladi.
 * Slug (profil havolasi) va holat o'zgarmaydi.
 */
export async function updateCandidateFromAnketa(anketa: Anketa): Promise<{ ok: boolean; message?: string }> {
  if (!anketa.candidate_id) return { ok: false, message: "Profil hali yaratilmagan." };
  const db = createAdminClient();
  const id = anketa.candidate_id;
  const { a, fields } = candidateFields(anketa);

  const { error } = await db.from("candidates").update(fields).eq("id", id);
  if (error) return { ok: false, message: `Profil yangilanmadi: ${error.message}` };

  await Promise.all([
    db.from("candidate_education").delete().eq("candidate_id", id),
    db.from("candidate_experience").delete().eq("candidate_id", id),
    db.from("candidate_achievements").delete().eq("candidate_id", id),
    db.from("candidate_projects").delete().eq("candidate_id", id),
    db.from("candidate_social_links").delete().eq("candidate_id", id),
  ]);
  await insertCandidateDetails(db, id, a);
  return { ok: true };
}
