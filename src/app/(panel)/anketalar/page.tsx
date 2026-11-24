import Link from "next/link";
import type { Metadata } from "next";
import { Bot, PencilLine } from "lucide-react";

import { AnketaTable } from "./table";
import { LiveRefresh } from "./live-refresh";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { ANKETA_STATUS_LABELS, type AnketaStatus } from "@/lib/anketa";
import { startOfTodayTashkent } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Anketalar" };
export const dynamic = "force-dynamic";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Toʻldirilganlar" },
  { value: "yuborildi", label: "Tekshiruv kutilmoqda" },
  { value: "tasdiqlandi", label: "Tasdiqlangan" },
  { value: "nashr_etildi", label: "Saytda" },
  { value: "rad_etildi", label: "Rad etilgan" },
  { value: "toldirilmoqda", label: "Toʻldirilmoqda" },
  { value: "hammasi", label: "Barchasi" },
];

export default async function AnketalarPage(props: PageProps<"/anketalar">) {
  await requireAdmin();
  const params = await props.searchParams;
  const holat = typeof params.holat === "string" ? params.holat : "";
  const today = params.davr === "bugun";

  const supabase = await createClient();
  let query = supabase.from("anketalar").select("*").order("created_at", { ascending: false }).limit(200);
  if (holat && holat in ANKETA_STATUS_LABELS) query = query.eq("status", holat as AnketaStatus);
  else if (holat !== "hammasi") query = query.neq("status", "toldirilmoqda");
  if (today) query = query.gte("created_at", startOfTodayTashkent());
  const { data: rows } = await query;

  return (
    <>
      <LiveRefresh seconds={5} />
      <PageHeader title="Anketalar" description="Nomzodlar toʻldirgan anketalar: tekshirish, tasdiqlash, toʻlov va saytga chiqarish.">
        <ButtonLink href="/bot" variant="secondary">
          <Bot className="size-4" /> Telegram bot
        </ButtonLink>
      </PageHeader>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.value === holat && !today;
          return (
            <Link
              key={f.value}
              href={f.value ? `/anketalar?holat=${f.value}` : "/anketalar"}
              className={`inline-flex h-9 items-center rounded-[10px] border px-3.5 text-[13px] font-medium transition-colors ${
                active
                  ? "border-accent bg-accent-soft text-accent-soft-fg"
                  : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
        <Link
          href="/anketalar?davr=bugun"
          className={`inline-flex h-9 items-center rounded-[10px] border px-3.5 text-[13px] font-medium ${
            today ? "border-accent bg-accent-soft text-accent-soft-fg" : "border-line bg-surface text-ink-2 hover:text-ink"
          }`}
        >
          Bugun
        </Link>
      </div>

      <div className="mt-6">
        {rows?.length ? (
          <AnketaTable rows={rows} now={new Date().getTime()} />
        ) : (
          <EmptyState icon={PencilLine} title="Anketa topilmadi" description="Nomzod anketani yuborgach shu yerda paydo boʻladi. Havola botdagi «Anketa yaratish» orqali beriladi." />
        )}
      </div>
    </>
  );
}
