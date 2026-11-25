import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Download, ExternalLink, ImageOff, Trash2 } from "lucide-react";

import { CopyButton } from "./copy-button";
import { AnketaAction } from "./detail-actions";
import { AnketaEditForm } from "./edit-form";
import { PhotoReplace } from "./photo-replace";
import { deleteAnketa } from "../actions";
import { LiveRefresh } from "../live-refresh";
import { StatusBadge } from "../table";
import { GenderBadge } from "@/components/gender-icon";
import { Badge, btn, ButtonLink, Card, CardTitle, formatDateTime, PageHeader } from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import {
  PAYMENT_LABELS,
  PAYMENT_TONES,
  SOCIAL_OPTIONS,
  STEPS,
  sanitizeAnswers,
  type AnketaAnswers,
  type StepKey,
} from "@/lib/anketa";
import { candidateMessagePlain, candidateMessageRich } from "@/lib/candidate-message";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Anketa" };
export const dynamic = "force-dynamic";

export default async function AnketaDetailPage(props: PageProps<"/anketalar/[id]">) {
  const admin = await requireAdmin();
  const writable = canWrite(admin);
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: anketa } = await supabase.from("anketalar").select("*").eq("id", id).maybeSingle();
  if (!anketa) notFound();

  const { data: botAdmin } = anketa.created_by_bot_admin
    ? await supabase
        .from("bot_admins")
        .select("full_name, telegram_username")
        .eq("id", anketa.created_by_bot_admin)
        .maybeSingle()
    : { data: null };

  const a = sanitizeAnswers(anketa.answers_fixed ?? anketa.answers);
  const filling = anketa.status === "toldirilmoqda";
  const currentKey = filling ? STEPS[anketa.current_step]?.key : undefined;
  const published = anketa.status === "nashr_etildi";
  const editable = writable && ["yuborildi", "tasdiqlandi", "nashr_etildi"].includes(anketa.status);
  const awaitingPayment =
    (anketa.status === "yuborildi" || anketa.status === "tasdiqlandi") && anketa.payment_status !== "tolandi";
  const fullName = a.full_name || anketa.full_name;

  return (
    <>
      <LiveRefresh seconds={filling ? 4 : 8} />

      <Link href="/anketalar" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> Anketalar
      </Link>

      <div className="mt-3">
        <PageHeader title={fullName}>
          <GenderBadge gender={anketa.gender} />
          <StatusBadge row={anketa} now={new Date().getTime()} />
          {anketa.payment_status !== "yoq" ? (
            <Badge tone={PAYMENT_TONES[anketa.payment_status]}>{PAYMENT_LABELS[anketa.payment_status]}</Badge>
          ) : null}
        </PageHeader>
      </div>

      {filling ? (
        <p className="mt-5 flex items-center gap-2.5 rounded-[10px] bg-accent-soft px-4 py-3 text-[13px] text-accent-soft-fg">
          <span className="size-2 animate-pulse rounded-full bg-accent" />
          {anketa.opened_at
            ? `Nomzod hozir «${STEPS[anketa.current_step]?.title}» qadamida.`
            : "Nomzod hali havolani ochmagan."}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ---------------- Javoblar ---------------- */}
        <div className="grid min-w-0 content-start gap-4">
          {editable ? <AnketaEditForm id={id} initial={a} published={published} /> : null}

          <section className={`rounded-card border bg-surface p-5 ${currentKey === "final" ? "border-accent shadow-yw" : "border-line"}`}>
            <h2 className="text-[14px] font-bold text-ink">Aloqa</h2>
            <ul className="mt-3 grid gap-2 text-[13.5px] text-ink-2">
              <Contact label="F.I.Sh">
                <span className="font-semibold text-ink">{fullName}</span>
              </Contact>
              <Contact label="Telefon">
                {a.phone ? (
                  <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="font-semibold text-ink">
                    {a.phone}
                  </a>
                ) : null}
              </Contact>
              <Contact label="Telegram">
                {a.telegram ? <ExtLink href={`https://t.me/${a.telegram.replace(/^@/, "")}`} label={a.telegram} /> : null}
              </Contact>
              <Contact label="Instagram">
                {a.instagram ? (
                  <ExtLink href={`https://instagram.com/${a.instagram.replace(/^@/, "")}`} label={a.instagram} />
                ) : null}
              </Contact>
              {a.socials
                .filter((x) => x.url)
                .map((x, i) => (
                  <Contact key={i} label={SOCIAL_OPTIONS.find((o) => o.value === x.platform)?.label ?? x.platform}>
                    <ExtLink href={x.url} />
                  </Contact>
                ))}
            </ul>
          </section>

          <Answer k="birth" current={currentKey} a={a}>
            {a.birth_date || a.birth_place ? (
              <p>
                {a.birth_date ? a.birth_date.split("-").reverse().join(".") : ""}
                {a.birth_date && a.birth_place ? ", " : ""}
                {a.birth_place}
              </p>
            ) : null}
          </Answer>
          <Answer k="activity" current={currentKey} a={a}>
            {a.activity ? <p>{a.activity}</p> : null}
          </Answer>
          <Answer k="about" current={currentKey} a={a}>
            {a.about ? <p className="whitespace-pre-line">{a.about}</p> : null}
          </Answer>
          <Answer k="study" current={currentKey} a={a}>
            {a.study_place || a.study_direction ? (
              <p>
                <b className="text-ink">{a.study_place || "—"}</b>
                {a.study_direction ? ` — ${a.study_direction}` : ""}
              </p>
            ) : null}
          </Answer>
          <Answer k="experience" current={currentKey} a={a}>
            {a.experience.some((x) => x.title) ? (
              <ul className="grid gap-2.5">
                {a.experience
                  .filter((x) => x.title)
                  .map((x, i) => (
                    <li key={i}>
                      {x.year ? <span className="text-[12px] font-semibold text-accent-text">{x.year}</span> : null}
                      <p className="font-semibold text-ink">{x.title}</p>
                      {x.description ? <p className="whitespace-pre-line">{x.description}</p> : null}
                    </li>
                  ))}
              </ul>
            ) : null}
          </Answer>
          <Answer k="achievements" current={currentKey} a={a}>
            {a.achievements.some((x) => x.title) ? (
              <ul className="list-disc space-y-1 pl-5">
                {a.achievements
                  .filter((x) => x.title)
                  .map((x, i) => (
                    <li key={i}>
                      {x.title}
                      {x.year ? <span className="text-ink-3"> ({x.year})</span> : null}
                    </li>
                  ))}
              </ul>
            ) : null}
          </Answer>
          <Answer k="projects" current={currentKey} a={a}>
            {a.projects.some((x) => x.title) ? (
              <ul className="grid gap-2.5">
                {a.projects
                  .filter((x) => x.title)
                  .map((x, i) => (
                    <li key={i}>
                      <p className="font-semibold text-ink">{x.title}</p>
                      {x.description ? <p>{x.description}</p> : null}
                      {x.url ? <ExtLink href={x.url} /> : null}
                    </li>
                  ))}
              </ul>
            ) : null}
          </Answer>
          <Answer k="extra" current={currentKey} a={a}>
            {a.extra ? <p className="whitespace-pre-line">{a.extra}</p> : null}
          </Answer>
        </div>

        {/* ---------------- O'ng ustun ---------------- */}
        <aside className="grid content-start gap-4">
          {anketa.candidate_id ? (
            <Card className={published ? "border-success" : ""}>
              <CardTitle>{published ? "✅ Profil tayyor" : "Profil (qoralama)"}</CardTitle>
              <dl className="grid gap-2 text-[13px]">
                <Row label="Havola yaratgan" value={botAdmin ? `${botAdmin.full_name}${botAdmin.telegram_username ? ` (@${botAdmin.telegram_username})` : ""}` : "—"} />
                <Row label="F.I.Sh" value={fullName} />
                <Row label="Telegram" value={a.telegram || "—"} />
                <div className="grid grid-cols-[110px_1fr] gap-2">
                  <dt className="text-ink-3">Profil</dt>
                  <dd className="min-w-0">
                    {anketa.profile_url ? (
                      <ExtLink href={anketa.profile_url} />
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                {anketa.post_url ? (
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <dt className="text-ink-3">Telegram post</dt>
                    <dd className="min-w-0">
                      <ExtLink href={anketa.post_url} />
                    </dd>
                  </div>
                ) : null}
              </dl>

              {anketa.profile_url ? (
                <div className="mt-4 grid gap-2">
                  <CopyButton text={anketa.profile_url} label="Profil havolasini nusxalash" full />
                  {published ? (
                    <CopyButton
                      full
                      label="Nomzodga xabarni nusxalash"
                      text={candidateMessagePlain(fullName, anketa.profile_url, anketa.post_url)}
                      html={candidateMessageRich(fullName, anketa.profile_url, anketa.post_url)}
                    />
                  ) : null}
                </div>
              ) : null}

              <Link
                href={`/nomzodlar/${anketa.candidate_id}`}
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent-text"
              >
                Profilni tahrirlash <ExternalLink className="size-3.5" />
              </Link>
            </Card>
          ) : null}

          <Card>
            <CardTitle>Jarayon</CardTitle>
            <ol className="grid gap-4">
              <Stage n={1} done={!filling} title="Anketa yuborildi" date={anketa.submitted_at} />
              <Stage
                n={2}
                done={anketa.payment_status === "tolandi"}
                title="Toʻlov tekshiruvi"
                date={anketa.payment_confirmed_at}
                note={
                  anketa.payment_status === "tolandi" || anketa.payment_status === "tolanmadi"
                    ? `${PAYMENT_LABELS[anketa.payment_status]}${anketa.payment_confirmed_by ? ` — ${anketa.payment_confirmed_by}` : ""}`
                    : anketa.payment_status === "kutilmoqda"
                      ? `Botda ${botAdmin?.full_name ?? "admin"} javobi kutilmoqda. «Ha» bosilsa — avtomatik chop etiladi.`
                      : botAdmin
                        ? `Soʻrov ${botAdmin.full_name}ga boradi`
                        : undefined
                }
              >
                {awaitingPayment && writable ? (
                  <div className="grid gap-1">
                    <AnketaAction id={id} kind="payment" full />
                    <AnketaAction id={id} kind="manual" full />
                  </div>
                ) : null}
              </Stage>
              <Stage n={3} done={published} title="Saytda chiqarish va Telegram post" date={anketa.published_at}>
                {!published && anketa.payment_status === "tolandi" && writable ? (
                  <AnketaAction id={id} kind="publish" full />
                ) : null}
                {published && !anketa.post_url && writable ? <AnketaAction id={id} kind="repost" full /> : null}
              </Stage>
            </ol>
          </Card>

          <Card>
            <CardTitle>Rasm</CardTitle>
            {anketa.photo_url ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="yw-checker aspect-[4/5] overflow-hidden rounded-photo border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={anketa.photo_url} alt={fullName} className="size-full object-contain" />
                  </div>
                  {anketa.post_image_url || anketa.photo_white_url ? (
                    <a
                      href={anketa.post_image_url ?? anketa.photo_white_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Telegram post rasmi"
                      className="aspect-[4/5] overflow-hidden rounded-photo border border-line bg-[#06155a]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={anketa.post_image_url ?? anketa.photo_white_url ?? ""}
                        alt={`${fullName} — post`}
                        className="size-full object-contain"
                      />
                    </a>
                  ) : null}
                </div>
                <a href={anketa.photo_url} target="_blank" rel="noopener noreferrer" download className={btn("secondary", "sm", "mt-3 w-full")}>
                  <Download className="size-4" /> Yuklab olish
                </a>
              </>
            ) : (
              <div className="grid aspect-square place-items-center rounded-photo border border-dashed border-line-strong text-ink-3">
                <span className="flex flex-col items-center gap-2 text-[13px]">
                  <ImageOff className="size-6" /> Hali yuklanmagan
                </span>
              </div>
            )}
            {editable ? <PhotoReplace id={id} /> : null}
          </Card>

          {writable ? (
            <div className="grid gap-2">
              {anketa.status !== "nashr_etildi" && anketa.status !== "rad_etildi" ? (
                <AnketaAction id={id} kind="reject" full confirmText="Anketani rad etasizmi? Havola oʻchiriladi." />
              ) : null}
              <form action={deleteAnketa}>
                <input type="hidden" name="id" value={id} />
                <button type="submit" className={btn("ghost", "sm", "w-full text-danger")}>
                  <Trash2 className="size-4" /> Anketani oʻchirish
                </button>
              </form>
            </div>
          ) : null}

          <ButtonLink href="/anketalar" variant="ghost" size="sm">
            <ArrowLeft className="size-4" /> Barcha anketalar
          </ButtonLink>
        </aside>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Answer({
  k,
  a,
  current,
  children,
}: {
  k: StepKey;
  a: AnketaAnswers;
  current?: StepKey;
  children: React.ReactNode;
}) {
  const step = STEPS.find((s) => s.key === k);
  const skipped = a.skipped.includes(k);
  const active = current === k;

  return (
    <section className={`rounded-card border bg-surface p-5 transition-colors ${active ? "border-accent shadow-yw" : "border-line"}`}>
      <div className="flex items-center gap-2">
        <h2 className="text-[14px] font-bold text-ink">{step?.title}</h2>
        {active ? (
          <Badge tone="info" className="ml-auto">
            Hozir shu yerda
          </Badge>
        ) : null}
      </div>
      <div className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">
        {skipped ? <span className="text-ink-3">Maʼlumot yoʻq</span> : (children ?? <span className="text-ink-3">—</span>)}
      </div>
    </section>
  );
}

function Contact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="w-24 shrink-0 text-ink-3">{label}</span>
      <span className="min-w-0">{children ?? "—"}</span>
    </li>
  );
}

function Stage({
  n,
  done,
  title,
  date,
  note,
  children,
}: {
  n: number;
  done: boolean;
  title: string;
  date: string | null;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
          done ? "bg-success text-white" : "bg-surface-2 text-ink-3"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-ink">{title}</p>
        {date ? <p className="text-[12px] text-ink-3">{formatDateTime(date)}</p> : null}
        {note ? <p className="mt-0.5 text-[12px] text-ink-2">{note}</p> : null}
        {children ? <div className="mt-2.5 grid gap-2">{children}</div> : null}
      </div>
    </li>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <dt className="text-ink-3">{label}</dt>
      <dd className="min-w-0 text-ink [overflow-wrap:anywhere]">{value || "—"}</dd>
    </div>
  );
}

function ExtLink({ href, label }: { href: string; label?: string }) {
  const safe = /^https?:\/\//i.test(href) ? href : `https://${href}`;
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-accent-text [overflow-wrap:anywhere] hover:underline"
    >
      {label ?? href} <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}
