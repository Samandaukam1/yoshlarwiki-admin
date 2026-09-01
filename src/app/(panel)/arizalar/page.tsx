import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

import { ApplicationFilters } from "./filters";
import {
  Badge,
  EmptyState,
  formatDateTime,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import {
  AGE_RANGE_LABELS,
  GENDER_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  type ApplicationStatus,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Arizalar" };
export const dynamic = "force-dynamic";

const PER_PAGE = 25;

/** Filtr davri uchun boshlangʻich sanani qaytaradi. */
function periodStart(period: string | undefined): string | null {
  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  if (period === "7" || period === "30") {
    return new Date(Date.now() - Number(period) * 86_400_000).toISOString();
  }
  return null;
}

export default async function ApplicationsPage(
  props: PageProps<"/arizalar">,
) {
  await requireAdmin();
  const searchParams = await props.searchParams;

  const str = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" && value ? value : undefined;
  };

  const page = Math.max(1, Number.parseInt(str("sahifa") ?? "1", 10) || 1);
  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

  const status = str("status");
  const gender = str("jins");
  const age = str("yosh");
  const promo = str("promo");
  const period = str("sana");
  const term = str("q");

  if (status) query = query.eq("status", status as ApplicationStatus);
  if (gender) query = query.eq("gender", gender as "ayol" | "erkak");
  if (age) query = query.eq("age_range", age as never);
  if (promo === "__yes__") query = query.not("promo_code", "is", null);
  else if (promo) query = query.eq("promo_code", promo);

  const since = periodStart(period);
  if (since) query = query.gte("created_at", since);

  if (term) {
    const safe = term.replace(/[%,()]/g, " ").trim();
    if (safe) {
      query = query.or(
        `full_name.ilike.%${safe}%,phone.ilike.%${safe}%,telegram.ilike.%${safe}%`,
      );
    }
  }

  const [{ data: rows, count }, { data: promoRows }] = await Promise.all([
    query,
    supabase
      .from("applications")
      .select("promo_code")
      .not("promo_code", "is", null)
      .limit(500),
  ]);

  const promoCodes = [
    ...new Set((promoRows ?? []).map((r) => r.promo_code).filter(Boolean)),
  ].sort() as string[];

  const total = count ?? 0;
  const pages = Math.ceil(total / PER_PAGE);

  const pageHref = (target: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string" && value && key !== "sahifa") {
        next.set(key, value);
      }
    }
    if (target > 1) next.set("sahifa", String(target));
    const qs = next.toString();
    return `/arizalar${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Arizalar"
        description={`${total} ta ariza${status ? ` — ${STATUS_LABELS[status as ApplicationStatus]}` : ""}`}
      />

      <div className="mt-6">
        <ApplicationFilters promoCodes={promoCodes} />
      </div>

      {!rows || rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Inbox}
            title="Ariza topilmadi"
            description="Tanlangan filtrlarga mos ariza yoʻq. Filtrlarni oʻzgartirib koʻring."
          />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Ism familiya</Th>
                  <Th>Telefon</Th>
                  <Th>Telegram</Th>
                  <Th>Yosh / Jins</Th>
                  <Th>Promokod</Th>
                  <Th>Status</Th>
                  <Th>Sana</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-surface-hover">
                    <Td>
                      <Link
                        href={`/arizalar/${item.id}`}
                        className="font-semibold text-ink hover:text-accent-text"
                      >
                        {item.full_name}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap tabular-nums">{item.phone}</Td>
                    <Td className="max-w-[180px] truncate">{item.telegram}</Td>
                    <Td className="whitespace-nowrap">
                      {AGE_RANGE_LABELS[item.age_range] ?? item.age_range} ·{" "}
                      {GENDER_LABELS[item.gender] ?? item.gender}
                    </Td>
                    <Td>
                      {item.promo_code ? (
                        <span className="font-mono text-[12px] tracking-wide">
                          {item.promo_code}
                        </span>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={STATUS_TONES[item.status] ?? "neutral"}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {formatDateTime(item.created_at)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </div>

          {pages > 1 ? (
            <nav
              aria-label="Sahifalar"
              className="mt-6 flex items-center justify-center gap-1.5"
            >
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  aria-label="Oldingi sahifa"
                  className="grid size-10 place-items-center rounded-[10px] border border-line bg-surface hover:bg-surface-hover"
                >
                  <ChevronLeft className="size-4" />
                </Link>
              ) : null}
              <span className="px-3 text-[13px] text-ink-2">
                {page} / {pages}
              </span>
              {page < pages ? (
                <Link
                  href={pageHref(page + 1)}
                  aria-label="Keyingi sahifa"
                  className="grid size-10 place-items-center rounded-[10px] border border-line bg-surface hover:bg-surface-hover"
                >
                  <ChevronRight className="size-4" />
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </>
  );
}
