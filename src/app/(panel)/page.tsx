import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, FileText, FolderTree, Inbox, Users } from "lucide-react";

import {
  Badge,
  ButtonLink,
  Card,
  CardTitle,
  EmptyState,
  formatDateTime,
  PageHeader,
  StatCard,
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

export const metadata: Metadata = { title: "Boshqaruv paneli" };

type AdminStats = {
  candidates_total: number;
  candidates_published: number;
  candidates_draft: number;
  candidates_archived: number;
  applications_total: number;
  applications_new: number;
  applications_today: number;
  applications_week: number;
  categories_total: number;
  by_status: Record<string, number>;
  recent_applications: {
    id: string;
    full_name: string;
    phone: string;
    telegram: string;
    gender: string;
    age_range: string;
    promo_code: string | null;
    status: ApplicationStatus;
    created_at: string;
  }[];
};

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_admin_stats");
  const stats = (data as unknown as AdminStats) ?? null;

  if (error || !stats) {
    return (
      <>
        <PageHeader title="Boshqaruv paneli" />
        <div className="mt-8">
          <EmptyState
            icon={Inbox}
            title="Statistikani yuklab boʻlmadi"
            description="Maʼlumotlar bazasi bilan bogʻlanishda muammo yuz berdi. Sahifani yangilab koʻring."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Salom, ${(admin.full_name || admin.email).split(" ")[0]}`}
        description="YoshlarWiki platformasining joriy holati."
      >
        <ButtonLink href="/nomzodlar">
          Nomzodlar
          <ArrowRight className="size-4" />
        </ButtonLink>
      </PageHeader>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Inbox}
          label="Yangi arizalar"
          value={stats.applications_new}
          hint={`Jami: ${stats.applications_total}`}
          href="/arizalar?status=yangi"
        />
        <StatCard
          icon={FileText}
          label="Bugungi arizalar"
          value={stats.applications_today}
          hint={`Hafta ichida: ${stats.applications_week}`}
          href="/arizalar"
        />
        <StatCard
          icon={Users}
          label="Nashr etilgan nomzodlar"
          value={stats.candidates_published}
          hint={`Qoralama: ${stats.candidates_draft}`}
          href="/nomzodlar?status=published"
        />
        <StatCard
          icon={FolderTree}
          label="Kategoriyalar"
          value={stats.categories_total}
          href="/kategoriyalar"
        />
      </div>

      {/* Statuslar bo'yicha taqsimot */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card padded={false}>
          <div className="p-5">
            <CardTitle
              action={
                <Link
                  href="/arizalar"
                  className="text-[13px] font-medium text-accent-text hover:underline"
                >
                  Barchasi
                </Link>
              }
            >
              Soʻnggi arizalar
            </CardTitle>
          </div>

          {stats.recent_applications.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                icon={Inbox}
                title="Hali ariza yoʻq"
                description="Saytdan yuborilgan arizalar shu yerda paydo boʻladi."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr>
                    <Th className="border-t">Ism familiya</Th>
                    <Th className="border-t">Telefon</Th>
                    <Th className="border-t">Yosh / Jins</Th>
                    <Th className="border-t">Status</Th>
                    <Th className="border-t">Sana</Th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_applications.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-hover">
                      <Td className="font-semibold text-ink">
                        {item.full_name}
                      </Td>
                      <Td className="tabular-nums">{item.phone}</Td>
                      <Td>
                        {AGE_RANGE_LABELS[item.age_range] ?? item.age_range} ·{" "}
                        {GENDER_LABELS[item.gender] ?? item.gender}
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
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Arizalar holati</CardTitle>
          <ul className="space-y-2.5">
            {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((status) => {
              const count = stats.by_status?.[status] ?? 0;
              const total = stats.applications_total || 1;
              const percent = Math.round((count / total) * 100);
              return (
                <li key={status}>
                  <Link
                    href={`/arizalar?status=${status}`}
                    className="block rounded-[10px] px-1 py-1 hover:bg-surface-hover"
                  >
                    <span className="flex items-center justify-between text-[13px]">
                      <span className="text-ink-2">{STATUS_LABELS[status]}</span>
                      <span className="font-semibold tabular-nums text-ink">
                        {count}
                      </span>
                    </span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Nomzodlar holati */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-[13px] text-ink-2">Nashr etilgan</p>
          <p className="mt-1 text-[24px] font-bold tabular-nums text-ink">
            {stats.candidates_published}
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-ink-2">Qoralama</p>
          <p className="mt-1 text-[24px] font-bold tabular-nums text-ink">
            {stats.candidates_draft}
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-ink-2">Arxivlangan</p>
          <p className="mt-1 text-[24px] font-bold tabular-nums text-ink">
            {stats.candidates_archived}
          </p>
        </Card>
      </div>
    </>
  );
}
