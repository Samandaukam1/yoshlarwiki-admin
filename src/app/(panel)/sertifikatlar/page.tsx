import Link from "next/link";
import type { Metadata } from "next";
import { Award, ChevronLeft, ChevronRight, DatabaseZap, Search } from "lucide-react";

import { CreateCertificateForm } from "./create-form";
import { CertificateRowActions } from "./row-actions";
import { CertificateSettingsForm } from "./settings-form";
import {
  CERTIFICATE_SHORT,
  CERTIFICATE_TYPES,
  DEFAULT_CERTIFICATE_SETTINGS,
  type CandidateOption,
  type CertificateSettings,
  type CertificateType,
} from "./types";
import {
  Badge,
  btn,
  Card,
  CardTitle,
  EmptyState,
  inputClass,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import { formatIsoDate, todayTashkentDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sertifikatlar" };
export const dynamic = "force-dynamic";

const PER_PAGE = 25;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  code: string;
  type: CertificateType;
  recipient_name: string;
  issued_on: string;
  is_revoked: boolean;
  candidate_id: string | null;
  candidate: { full_name: string; status: string } | null;
};

export default async function CertificatesPage(props: PageProps<"/sertifikatlar">) {
  const admin = await requireAdmin();
  const writable = canWrite(admin);
  const searchParams = await props.searchParams;
  const str = (key: string) => {
    const raw = searchParams[key];
    return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
  };

  const term = str("q");
  const typeFilter = str("tur") as CertificateType | undefined;
  const page = Math.max(1, Number.parseInt(str("sahifa") ?? "1", 10) || 1);
  const preselect = str("nomzod");

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_USER_SITE_URL ?? "http://localhost:3000";

  let query = supabase
    .from("certificates")
    .select(
      "id, code, type, recipient_name, issued_on, is_revoked, candidate_id, candidate:candidates(full_name, status)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

  if (typeFilter && CERTIFICATE_TYPES.includes(typeFilter)) query = query.eq("type", typeFilter);
  if (term) {
    const safe = term.replace(/[%,()_\\]/g, " ").trim();
    if (safe) query = query.or(`recipient_name.ilike.%${safe}%,code.ilike.%${safe}%`);
  }

  const [{ data, count, error }, { data: settingRow }, { data: preselected }] = await Promise.all([
    query,
    supabase.from("site_settings").select("value").eq("key", "certificate").maybeSingle(),
    preselect && UUID_RE.test(preselect)
      ? supabase
          .from("candidates")
          .select("id, full_name, title, portrait_url, status")
          .eq("id", preselect)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const missingTable =
    error && (error.code === "42P01" || error.code === "PGRST205" || /schema cache|does not exist/.test(error.message));
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const stored = (settingRow?.value ?? {}) as Partial<CertificateSettings>;
  const settings: CertificateSettings = {
    signer_name: stored.signer_name ?? DEFAULT_CERTIFICATE_SETTINGS.signer_name,
    signer_title: stored.signer_title ?? DEFAULT_CERTIFICATE_SETTINGS.signer_title,
    signature_url: stored.signature_url ?? DEFAULT_CERTIFICATE_SETTINGS.signature_url,
  };

  const href = (overrides: Record<string, string | null>) => {
    const next = new URLSearchParams();
    for (const [key, raw] of Object.entries(searchParams)) {
      if (typeof raw === "string" && raw && key !== "nomzod") next.set(key, raw);
    }
    for (const [key, raw] of Object.entries(overrides)) {
      if (raw) next.set(key, raw);
      else next.delete(key);
    }
    const qs = next.toString();
    return `/sertifikatlar${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Sertifikatlar"
        description="Nomzodlarga mualliflik va aʼzolik sertifikatlarini berish, tekshirish va boshqarish."
      >
        <a href={`${siteUrl}/sertifikat`} target="_blank" rel="noopener noreferrer" className={btn("secondary", "sm")}>
          Tekshirish sahifasi
        </a>
      </PageHeader>

      {missingTable ? (
        <div className="mt-7">
          <EmptyState
            icon={DatabaseZap}
            title="Maʼlumotlar bazasi tayyor emas"
            description="Sertifikatlar jadvali hali yaratilmagan. yoshlarwiki-supabase repodagi 20261004120000_certificates.sql migratsiyasini Supabase’da qoʻllang — shundan soʻng boʻlim toʻliq ishlaydi."
          />
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          <Card>
            <CardTitle>Yangi sertifikat</CardTitle>
            <CreateCertificateForm
              key={preselected?.id ?? "yangi"}
              siteUrl={siteUrl}
              today={todayTashkentDate()}
              initialCandidate={(preselected as CandidateOption | null) ?? null}
              disabled={!writable}
            />
          </Card>

          <Card padded={false}>
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[15px] font-bold text-ink">
                Berilgan sertifikatlar <span className="font-medium text-ink-3">({total})</span>
              </h2>
              <form action="/sertifikatlar" className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={term ?? ""}
                    placeholder="Ism yoki raqam…"
                    aria-label="Sertifikatlar orasidan qidirish"
                    className={`${inputClass} h-9 pl-9 sm:w-[220px]`}
                  />
                </div>
                <select
                  name="tur"
                  defaultValue={typeFilter ?? ""}
                  aria-label="Turi boʻyicha"
                  className={`${inputClass} h-9 appearance-none sm:w-[150px]`}
                >
                  <option value="">Barcha turlar</option>
                  {CERTIFICATE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CERTIFICATE_SHORT[type]}
                    </option>
                  ))}
                </select>
                <button type="submit" className={btn("secondary", "sm")}>
                  Qidirish
                </button>
              </form>
            </div>

            {rows.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={Award}
                  title={term || typeFilter ? "Hech narsa topilmadi" : "Hali sertifikat berilmagan"}
                  description={
                    term || typeFilter
                      ? "Qidiruv yoki filtrni oʻzgartirib koʻring."
                      : "Yuqoridagi formadan birinchi sertifikatni yarating."
                  }
                />
              </div>
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th className="border-t">Raqam</Th>
                    <Th className="border-t">Egasi</Th>
                    <Th className="border-t">Turi</Th>
                    <Th className="border-t">Sana</Th>
                    <Th className="border-t">Holat</Th>
                    <Th className="border-t text-right">Amallar</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-hover">
                      <Td className="whitespace-nowrap font-mono text-[12.5px] font-semibold text-ink">{row.code}</Td>
                      <Td>
                        <span className="font-semibold text-ink">{row.recipient_name}</span>
                        {row.candidate_id && row.candidate ? (
                          <Link
                            href={`/nomzodlar/${row.candidate_id}`}
                            className="block text-[12px] text-ink-3 hover:text-accent-text"
                          >
                            Nomzod: {row.candidate.full_name}
                          </Link>
                        ) : (
                          <span className="block text-[12px] text-ink-3">Nomzodga bogʻlanmagan</span>
                        )}
                      </Td>
                      <Td>
                        <Badge tone={row.type === "mualliflik" ? "info" : "neutral"}>
                          {CERTIFICATE_SHORT[row.type]}
                        </Badge>
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums">{formatIsoDate(row.issued_on)}</Td>
                      <Td>
                        <Badge tone={row.is_revoked ? "danger" : "success"}>
                          {row.is_revoked ? "Bekor qilingan" : "Faol"}
                        </Badge>
                      </Td>
                      <Td>
                        <CertificateRowActions
                          id={row.id}
                          code={row.code}
                          revoked={row.is_revoked}
                          siteUrl={siteUrl}
                          writable={writable}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}

            {pages > 1 ? (
              <nav aria-label="Sahifalar" className="flex items-center justify-center gap-1.5 p-4">
                {page > 1 ? (
                  <Link
                    href={href({ sahifa: page - 1 > 1 ? String(page - 1) : null })}
                    aria-label="Oldingi sahifa"
                    className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface hover:bg-surface-hover"
                  >
                    <ChevronLeft className="size-4" />
                  </Link>
                ) : null}
                <span className="px-3 text-[13px] text-ink-2">
                  {page} / {pages}
                </span>
                {page < pages ? (
                  <Link
                    href={href({ sahifa: String(page + 1) })}
                    aria-label="Keyingi sahifa"
                    className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface hover:bg-surface-hover"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </Card>

          <Card>
            <CardTitle>Imzo</CardTitle>
            <CertificateSettingsForm settings={settings} disabled={!writable} />
          </Card>
        </div>
      )}
    </>
  );
}
