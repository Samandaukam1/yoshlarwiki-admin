import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Phone,
  Send,
  Ticket,
  User,
  Users,
} from "lucide-react";

import { ConvertButton, NoteForm, StatusSwitcher } from "./detail-actions";
import {
  Badge,
  Card,
  CardTitle,
  formatDateTime,
  PageHeader,
} from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import {
  AGE_RANGE_LABELS,
  GENDER_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  type ApplicationStatus,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ariza" };
export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage(
  props: PageProps<"/arizalar/[id]">,
) {
  const admin = await requireAdmin();
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!application) notFound();

  const [{ data: notes }, { data: history }] = await Promise.all([
    supabase
      .from("application_notes")
      .select("*, author:admin_users(full_name, email)")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("application_status_history")
      .select("*, changed_by_user:admin_users(full_name, email)")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const writable = canWrite(admin);
  const status = application.status as ApplicationStatus;

  const telegramHref = application.telegram.startsWith("@")
    ? `https://t.me/${application.telegram.slice(1)}`
    : `tel:${application.telegram}`;

  const facts = [
    { icon: Phone, label: "Telefon", value: application.phone, href: `tel:${application.phone}` },
    { icon: Send, label: "Telegram", value: application.telegram, href: telegramHref },
    {
      icon: Users,
      label: "Jins",
      value: GENDER_LABELS[application.gender] ?? application.gender,
    },
    {
      icon: CalendarDays,
      label: "Yosh oraligʻi",
      value: AGE_RANGE_LABELS[application.age_range] ?? application.age_range,
    },
    {
      icon: Ticket,
      label: "Promokod",
      value: application.promo_code ?? "—",
    },
  ];

  return (
    <>
      <Link
        href="/arizalar"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-2 hover:text-accent-text"
      >
        <ArrowLeft className="size-4" />
        Arizalar roʻyxati
      </Link>

      <div className="mt-4">
        <PageHeader
          title={application.full_name}
          description={`Qabul qilindi: ${formatDateTime(application.created_at)}`}
        >
          <Badge tone={STATUS_TONES[status] ?? "neutral"}>
            {STATUS_LABELS[status] ?? status}
          </Badge>
        </PageHeader>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card>
            <CardTitle>Ariza maʼlumotlari</CardTitle>
            <dl className="grid gap-4 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start gap-3">
                  <fact.icon
                    className="mt-0.5 size-[18px] shrink-0 text-accent-text"
                    strokeWidth={1.8}
                  />
                  <div className="min-w-0">
                    <dt className="text-[12px] text-ink-3">{fact.label}</dt>
                    <dd className="mt-0.5 break-words text-[14px] font-semibold text-ink">
                      {fact.href && fact.value !== "—" ? (
                        <a
                          href={fact.href}
                          target={fact.href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="hover:text-accent-text hover:underline"
                        >
                          {fact.value}
                        </a>
                      ) : (
                        fact.value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <User className="mt-0.5 size-[18px] shrink-0 text-accent-text" strokeWidth={1.8} />
                <div className="min-w-0">
                  <dt className="text-[12px] text-ink-3">Manba</dt>
                  <dd className="mt-0.5 text-[14px] font-semibold text-ink">
                    {application.source}
                  </dd>
                </div>
              </div>
            </dl>
          </Card>

          <Card>
            <CardTitle>Statusni oʻzgartirish</CardTitle>
            <StatusSwitcher id={application.id} current={status} disabled={!writable} />
          </Card>

          <Card>
            <CardTitle>Ichki izohlar</CardTitle>
            <NoteForm id={application.id} disabled={!writable} />

            {notes && notes.length > 0 ? (
              <ul className="mt-5 space-y-3 border-t border-line pt-5">
                {notes.map((note) => {
                  const author = note.author as { full_name: string | null; email: string } | null;
                  return (
                    <li key={note.id} className="rounded-[10px] bg-surface-2 px-4 py-3">
                      <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink">
                        {note.body}
                      </p>
                      <p className="mt-2 text-[12px] text-ink-3">
                        {author?.full_name || author?.email || "Admin"} ·{" "}
                        {formatDateTime(note.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-5 border-t border-line pt-5 text-[13px] text-ink-3">
                Hali izoh qoldirilmagan.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle>Nomzodga aylantirish</CardTitle>
            <ConvertButton
              id={application.id}
              disabled={!writable}
              convertedId={application.converted_candidate_id}
            />
          </Card>

          <Card>
            <CardTitle>Status tarixi</CardTitle>
            {history && history.length > 0 ? (
              <ol className="space-y-4">
                {history.map((entry, index) => {
                  const by = entry.changed_by_user as
                    | { full_name: string | null; email: string }
                    | null;
                  return (
                    <li key={entry.id} className="flex gap-3">
                      <span className="relative flex w-3 shrink-0 justify-center">
                        <span className="z-10 mt-1.5 size-[9px] rounded-full bg-accent-text" />
                        {index < history.length - 1 ? (
                          <span
                            aria-hidden
                            className="absolute left-1/2 top-2 h-full w-px -translate-x-1/2 bg-line-strong"
                          />
                        ) : null}
                      </span>
                      <div className="min-w-0 pb-1">
                        <p className="text-[13px] font-semibold text-ink">
                          {entry.from_status
                            ? `${STATUS_LABELS[entry.from_status as ApplicationStatus]} → ${STATUS_LABELS[entry.to_status as ApplicationStatus]}`
                            : STATUS_LABELS[entry.to_status as ApplicationStatus]}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-3">
                          <Clock className="size-3" strokeWidth={2} />
                          {formatDateTime(entry.created_at)}
                          {by ? ` · ${by.full_name || by.email}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-[13px] text-ink-3">Tarix boʻsh.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
