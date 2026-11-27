import "server-only";

import { emptyAnswers, type AnketaAnswers } from "./anketa";
import { profileUrlFor, type Anketa } from "./anketa-server";
import { postToChannel } from "./channel-post";
import { createAdminClient } from "./supabase/admin";

/**
 * Nomzodlar ro'yxatidan kanalga post (ESKI shablon — src/assets/post/template.jpg).
 *
 * Nomzod anketa orqali kelgan bo'lsa — o'sha anketa ishlatiladi (post xuddi
 * anketadan chiqqandek bo'ladi). Qo'lda qo'shilgan nomzod uchun profil
 * maʼlumotlaridan anketa ko'rinishidagi obyekt yasaladi — rasm va matn bir xil
 * qoidalar bilan chiqadi.
 */

type Db = ReturnType<typeof createAdminClient>;

async function anketaForCandidate(db: Db, id: string) {
  const { data: candidate } = await db.from("candidates").select("*").eq("id", id).maybeSingle();
  if (!candidate) return { error: "Nomzod topilmadi." } as const;
  if (candidate.status !== "published") return { error: "Profil saytda nashr etilmagan." } as const;
  if (!candidate.portrait_url) return { error: "Profil rasmi yoʻq." } as const;

  const { data: linked } = await db
    .from("anketalar")
    .select("*")
    .eq("candidate_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linked?.photo_url) return { candidate, anketa: linked, real: true } as const;

  const [{ data: education }, { data: experience }, { data: achievements }, { data: projects }, region] =
    await Promise.all([
      db.from("candidate_education").select("*").eq("candidate_id", id).order("sort_order"),
      db.from("candidate_experience").select("*").eq("candidate_id", id).order("sort_order"),
      db.from("candidate_achievements").select("*").eq("candidate_id", id).order("sort_order"),
      db.from("candidate_projects").select("*").eq("candidate_id", id).order("sort_order"),
      candidate.region_id
        ? db.from("regions").select("name").eq("id", candidate.region_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const a: AnketaAnswers = {
    ...emptyAnswers(candidate.full_name),
    birth_date: candidate.birth_date ?? "",
    birth_place: candidate.birth_place || region.data?.name || "",
    activity: candidate.title || candidate.activity_field || "",
    about: candidate.about || candidate.intro || "",
    study_place: education?.[0]?.institution ?? "",
    study_direction: education?.[0]?.degree || candidate.direction || candidate.specialization || "",
    experience: (experience ?? []).map((x) => ({
      year: x.year_label === "—" ? "" : x.year_label,
      title: x.title,
      description: x.description ?? "",
    })),
    achievements: (achievements ?? []).map((x) => ({ title: x.title, year: x.year ? String(x.year) : "" })),
    projects: (projects ?? []).map((x) => ({ title: x.title, url: x.url ?? "", description: x.description ?? "" })),
  };

  const now = new Date().toISOString();
  const synthetic = {
    id: candidate.id, // Storage yo'li: anketa/<nomzod id>/post-….png
    full_name: candidate.full_name,
    gender: candidate.gender ?? "erkak",
    status: "nashr_etildi",
    answers: a,
    answers_fixed: null,
    seo: null,
    photo_url: candidate.portrait_url,
    photo_path: null,
    photo_white_url: null,
    post_url: candidate.post_url,
    post_image_url: candidate.post_image_url,
    profile_url: profileUrlFor(candidate.slug),
    candidate_id: candidate.id,
    current_step: 0,
    expires_at: now,
    created_at: candidate.created_at,
    updated_at: now,
  } as unknown as Anketa;

  return { candidate, anketa: synthetic, real: false } as const;
}

export async function sendCandidatePost(
  id: string,
  onlyNotPosted = false,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const db = createAdminClient();
  const found = await anketaForCandidate(db, id);
  if ("error" in found) return { ok: false, message: found.error ?? "Xato." };

  const { candidate, anketa, real } = found;
  const existingUrl = candidate.post_url ?? anketa.post_url;
  if (onlyNotPosted && existingUrl) return { ok: true, url: existingUrl };

  const profileUrl = profileUrlFor(candidate.slug);
  const post = await postToChannel(anketa, profileUrl);
  if (!post.ok) return { ok: false, message: post.message };

  const now = new Date().toISOString();
  const { error: candidateError } = await db
    .from("candidates")
    .update({ post_url: post.url, post_image_url: post.imageUrl, posted_at: now })
    .eq("id", candidate.id)
    .select("id")
    .single();

  if (candidateError) {
    return { ok: false, message: `Post yuborildi, lekin profilga havola yozilmadi: ${post.url}` };
  }

  // Anketadagi post havolasi ham yangisiga — keyingi tahrirlar shu postni yangilaydi.
  if (real) {
    const { error: anketaError } = await db
      .from("anketalar")
      .update({ post_url: post.url, post_image_url: post.imageUrl ?? anketa.post_image_url })
      .eq("id", anketa.id);
    if (anketaError) {
      return { ok: false, message: `Post yuborildi, lekin anketaga havola yozilmadi: ${post.url}` };
    }
  }

  return { ok: true, url: post.url };
}
