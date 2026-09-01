import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, Plus, Users } from "lucide-react";

import { CandidateFilters } from "./filters";
import {
  Badge,
  ButtonLink,
  EmptyState,
  formatDateTime,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_TONES,
  type CandidateStatus,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nomzodlar" };
export const dynamic = "force-dynamic";

export default async function CandidatesPage(props: PageProps<"/nomzodlar">) {
  await requireAdmin();
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
  const siteUrl = process.env.NEXT_PUBLIC_USER_SITE_URL ?? "http://localhost:3000";

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
        <div className="mt-6">
          <TableWrap>
            <thead>
              <tr>
                <Th>Nomzod</Th>
                <Th>Kategoriya</Th>
                <Th>Holat</Th>
                <Th>Koʻrishlar</Th>
                <Th>Yangilangan</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const category = item.category as { name: string } | null;
                const candidateStatus = item.status as CandidateStatus;
                return (
                  <tr key={item.id} className="transition-colors hover:bg-surface-hover">
                    <Td>
                      <Link
                        href={`/nomzodlar/${item.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                          {item.portrait_url ? (
                            <Image
                              src={item.portrait_url}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover object-top"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">
                            {item.full_name}
                          </span>
                          <span className="block truncate text-[12px] text-ink-3">
                            /{item.slug}
                          </span>
                        </span>
                      </Link>
                    </Td>
                    <Td>{category?.name ?? <span className="text-ink-3">—</span>}</Td>
                    <Td>
                      <Badge tone={CANDIDATE_STATUS_TONES[candidateStatus] ?? "neutral"}>
                        {CANDIDATE_STATUS_LABELS[candidateStatus] ?? candidateStatus}
                      </Badge>
                    </Td>
                    <Td className="tabular-nums">{item.view_count}</Td>
                    <Td className="whitespace-nowrap">{formatDateTime(item.updated_at)}</Td>
                    <Td>
                      {item.status === "published" ? (
                        <a
                          href={`${siteUrl}/yoshlar/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${item.full_name} profilini saytda koʻrish`}
                          className="inline-grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-hover hover:text-accent-text"
                        >
                          <ExternalLink className="size-4" strokeWidth={1.9} />
                        </a>
                      ) : null}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </div>
      )}
    </>
  );
}
