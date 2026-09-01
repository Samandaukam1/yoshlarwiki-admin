import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Eye, Trash2 } from "lucide-react";

import { CandidateEditForm, type CandidateFormValues } from "./edit-form";
import {
  AchievementsSection,
  CategoryPicker,
  EducationSection,
  ExperienceSection,
  ProjectsSection,
  SocialSection,
  StatusControls,
} from "./sections";
import { deleteCandidate } from "../actions";
import { Badge, btn, Card, CardTitle, PageHeader } from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_TONES,
  type CandidateStatus,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nomzodni tahrirlash" };
export const dynamic = "force-dynamic";

export default async function EditCandidatePage(
  props: PageProps<"/nomzodlar/[id]">,
) {
  const admin = await requireAdmin();
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!candidate) notFound();

  const [
    { data: regions },
    { data: categories },
    { data: linkedCategories },
    { data: education },
    { data: experience },
    { data: achievements },
    { data: projects },
    { data: socials },
  ] = await Promise.all([
    supabase.from("regions").select("id, name").order("sort_order"),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("candidate_categories").select("category_id").eq("candidate_id", id),
    supabase.from("candidate_education").select("*").eq("candidate_id", id).order("sort_order"),
    supabase.from("candidate_experience").select("*").eq("candidate_id", id).order("sort_order"),
    supabase.from("candidate_achievements").select("*").eq("candidate_id", id).order("sort_order"),
    supabase.from("candidate_projects").select("*").eq("candidate_id", id).order("sort_order"),
    supabase.from("candidate_social_links").select("*").eq("candidate_id", id).order("sort_order"),
  ]);

  const writable = canWrite(admin);
  const status = candidate.status as CandidateStatus;
  const siteUrl = process.env.NEXT_PUBLIC_USER_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      <Link
        href="/nomzodlar"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-2 hover:text-accent-text"
      >
        <ArrowLeft className="size-4" />
        Nomzodlar
      </Link>

      <div className="mt-4">
        <PageHeader
          title={candidate.full_name}
          description={candidate.title ?? "Kasb koʻrsatilmagan"}
        >
          <Badge tone={CANDIDATE_STATUS_TONES[status] ?? "neutral"}>
            {CANDIDATE_STATUS_LABELS[status] ?? status}
          </Badge>
          <a
            href={`${siteUrl}/yoshlar/${candidate.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={btn("secondary", "sm")}
          >
            {status === "published" ? (
              <ExternalLink className="size-4" strokeWidth={1.9} />
            ) : (
              <Eye className="size-4" strokeWidth={1.9} />
            )}
            {status === "published" ? "Saytda koʻrish" : "Havolani ochish"}
          </a>
        </PageHeader>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <CandidateEditForm
            candidate={candidate as unknown as CandidateFormValues}
            regions={regions ?? []}
            categories={categories ?? []}
            disabled={!writable}
          />

          <EducationSection
            candidateId={id}
            items={education ?? []}
            disabled={!writable}
          />
          <ExperienceSection
            candidateId={id}
            items={experience ?? []}
            disabled={!writable}
          />
          <AchievementsSection
            candidateId={id}
            items={achievements ?? []}
            disabled={!writable}
          />
          <ProjectsSection
            candidateId={id}
            items={projects ?? []}
            disabled={!writable}
          />
          <SocialSection
            candidateId={id}
            items={socials ?? []}
            disabled={!writable}
          />
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle>Nashr holati</CardTitle>
            <StatusControls
              candidateId={id}
              current={status}
              disabled={!writable}
            />
            <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
              Faqat <strong>Nashr etilgan</strong> profillar saytda koʻrinadi.
              Qoralama va arxiv profillar ommaga yopiq.
            </p>
          </Card>

          <CategoryPicker
            candidateId={id}
            categories={categories ?? []}
            selected={(linkedCategories ?? []).map((row) => row.category_id)}
            disabled={!writable}
          />

          {writable ? (
            <Card>
              <CardTitle>Xavfli hudud</CardTitle>
              <form action={deleteCandidate}>
                <input type="hidden" name="id" value={id} />
                <p className="text-[12.5px] leading-relaxed text-ink-2">
                  Nomzod va unga bogʻliq barcha maʼlumotlar butunlay
                  oʻchiriladi. Buni ortga qaytarib boʻlmaydi.
                </p>
                <button type="submit" className={btn("danger", "sm", "mt-3")}>
                  <Trash2 className="size-4" strokeWidth={1.9} />
                  Nomzodni oʻchirish
                </button>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
