import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";

import { BulkPostTable, type BulkRow } from "./bulk-table";

import { CandidateFilters } from "./filters";
import {
  ButtonLink,
  EmptyState,
  formatDateTime,
  PageHeader,
} from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_TONES,
  type CandidateStatus,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { USER_SITE_URL } from "@/lib/config";

export const metadata: Metadata = { title: "Nomzodlar" };
export const dynamic = "force-dynamic";

export default async function CandidatesPage(props: PageProps<"/nomzodlar">) {
  const admin = await requireAdmin();
  const writable = canWrite(admin);
  const searchParams = await props.searchParams;

  const str = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" && value ? value : undefined;
  };

  const status = str("status");
  const term = str("q");
  const supabase = await createClient();

  let query = supabase
    .from("candidates")
    .select("*, category:categories!candidates_primary_category_id_fkey(name)", {
      count: "exact",
    })
    .order("updated_at", { ascending: false })
    .limit(60);

  if (status) query = query.eq("status", status as CandidateStatus);
  if (term) {
    const safe = term.replace(/[%,()]/g, " ").trim();
    if (safe) query = query.or(`full_name.ilike.%${safe}%,title.ilike.%${safe}%`);
  }

  const { data: rows, count } = await query;
  const siteUrl = USER_SITE_URL;

  return (
    <>
      <PageHeader
        title="Nomzodlar"
        description={`${count ?? 0} ta profil`}
      >
        <ButtonLink href="/nomzodlar/yangi">
          <Plus className="size-4" strokeWidth={2.2} />
          Yangi nomzod
        </ButtonLink>
      </PageHeader>

      <div className="mt-6">
        <CandidateFilters />
      </div>

      {!rows || rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="Nomzod topilmadi"
            description="Yangi nomzod qoʻshing yoki filtrlarni oʻzgartiring."
            action={
              <ButtonLink href="/nomzodlar/yangi" size="sm">
                <Plus className="size-4" strokeWidth={2.2} />
                Yangi nomzod
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <BulkPostTable
          siteUrl={siteUrl}
          writable={writable}
          rows={rows.map((item) => {
            const candidateStatus = item.status as CandidateStatus;
            return {
              id: item.id,
              full_name: item.full_name,
              slug: item.slug,
              portrait_url: item.portrait_url,
              status: item.status,
              status_label: CANDIDATE_STATUS_LABELS[candidateStatus] ?? candidateStatus,
              status_tone: CANDIDATE_STATUS_TONES[candidateStatus] ?? "neutral",
              category: (item.category as { name: string } | null)?.name ?? null,
              view_count: item.view_count,
              updated_label: formatDateTime(item.updated_at),
              post_url: item.post_url,
              theme_color: item.theme_color,
            } satisfies BulkRow;
          })}
        />
      )}
    </>
  );
}
