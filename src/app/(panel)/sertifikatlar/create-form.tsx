"use client";

import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";

import { createCertificate, findCandidates } from "./actions";
import {
  CERTIFICATE_LABELS,
  idleCreateResult,
  type CandidateOption,
  type CertificateType,
} from "./types";
import { Badge, btn, Field, inputClass } from "@/components/ui";

const STATUS: Record<CandidateOption["status"], { label: string; tone: "success" | "neutral" | "warning" }> = {
  published: { label: "Nashr etilgan", tone: "success" },
  draft: { label: "Qoralama", tone: "neutral" },
  archived: { label: "Arxiv", tone: "warning" },
};

function Avatar({ url, size = 36 }: { url: string | null; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 text-ink-3"
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover object-top" />
      ) : (
        <UserRound className="size-1/2" strokeWidth={1.6} />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Nomzod tanlash                                                     */
/* ------------------------------------------------------------------ */

function CandidatePicker({
  value,
  onChange,
  disabled,
}: {
  value: CandidateOption | null;
  onChange: (candidate: CandidateOption | null) => void;
  disabled: boolean;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CandidateOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [searched, setSearched] = useState("");
  const [pending, startTransition] = useTransition();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const query = term.trim();
    if (query.length < 2) return;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const found = await findCandidates(query);
        setResults(found);
        setSearched(query);
        setActive(0);
        setOpen(true);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [term]);

  const choose = (candidate: CandidateOption) => {
    onChange(candidate);
    setOpen(false);
    setTerm("");
    setResults([]);
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-[12px] border border-accent/40 bg-accent-soft/50 px-3.5 py-3">
        <Avatar url={value.portrait_url} size={44} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold text-ink">{value.full_name}</span>
          <span className="block truncate text-[12.5px] text-ink-2">{value.title ?? "Kasb koʻrsatilmagan"}</span>
        </span>
        <Badge tone={STATUS[value.status].tone}>{STATUS[value.status].label}</Badge>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onChange(null);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          aria-label="Boshqa nomzodni tanlash"
          title="Almashtirish"
          className="grid size-8 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-surface-hover hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  const query = term.trim();
  const showList = open && query.length >= 2;

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-3" strokeWidth={1.9} />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        disabled={disabled}
        value={term}
        onChange={(event) => {
          setTerm(event.target.value);
          if (event.target.value.trim().length < 2) {
            setOpen(false);
            setResults([]);
          }
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => {
          if (!showList || results.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => (index + 1) % results.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => (index - 1 + results.length) % results.length);
          } else if (event.key === "Enter") {
            event.preventDefault();
            choose(results[active]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Nomzod ismini yozing…"
        autoComplete="off"
        className={`${inputClass} pl-11 pr-10`}
      />
      {pending ? (
        <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-3" />
      ) : null}

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-[320px] overflow-y-auto rounded-[12px] border border-line bg-surface p-1.5 shadow-yw-lg"
        >
          {results.length === 0 && !pending ? (
            <li className="px-3 py-4 text-center text-[13px] text-ink-3">
              «{searched || query}» boʻyicha nomzod topilmadi.
            </li>
          ) : (
            results.map((candidate, index) => (
              <li
                key={candidate.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(candidate)}
                className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-2 ${
                  index === active ? "bg-surface-hover" : ""
                }`}
              >
                <Avatar url={candidate.portrait_url} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{candidate.full_name}</span>
                  <span className="block truncate text-[12px] text-ink-3">{candidate.title ?? "—"}</span>
                </span>
                {candidate.status !== "published" ? (
                  <Badge tone={STATUS[candidate.status].tone}>{STATUS[candidate.status].label}</Badge>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tur tanlash — kichik vizual namunalar                              */
/* ------------------------------------------------------------------ */

function TypePreview({ type }: { type: CertificateType }) {
  if (type === "mualliflik") {
    return (
      <span className="relative block aspect-[1123/794] overflow-hidden rounded-[8px] bg-linear-to-br from-[#f9fafb] via-[#eef1f5] to-[#f6f7f9] ring-1 ring-black/5">
        <span className="absolute -left-3 -top-3 size-10 rotate-45 bg-[#13284f]" />
        <span className="absolute -bottom-3 -right-3 size-8 rotate-45 bg-[#13284f]" />
        <span className="absolute inset-x-0 top-[30%] text-center font-serif text-[15px] font-bold tracking-wider text-[#0f2147]">
          SERTIFIKAT
        </span>
        <span className="absolute inset-x-0 top-[52%] text-center text-[5px] tracking-[0.3em] text-[#13254a]">
          MUALLIFLIK SERTIFIKATI
        </span>
        <span className="absolute inset-x-[30%] top-[64%] h-[3px] rounded-full bg-[#0f2147]/70" />
        <span className="absolute bottom-[10%] right-[12%] size-5 rounded-full border-2 border-[#22389a]/70" />
      </span>
    );
  }
  return (
    <span className="relative flex aspect-[1123/794] overflow-hidden rounded-[8px] bg-[#f6f2ea] ring-1 ring-black/5">
      <span className="h-full w-[33%] bg-linear-to-b from-[#2a77ff] to-[#0036b8] p-1.5">
        <span className="mx-auto mt-[18%] block aspect-[4/5] w-[70%] rounded-[4px] border border-white/90 bg-white/20" />
      </span>
      <span className="flex-1 p-2">
        <span className="block h-1.5 w-8 rounded-full bg-[#e7edfb]" />
        <span className="mt-1.5 block text-[9px] font-extrabold leading-none text-[#0a1020]">Aʼzolik</span>
        <span className="block text-[9px] font-extrabold leading-tight text-[#0050fa]">sertifikati.</span>
        <span className="mt-1 block h-[2px] w-10 rounded-full bg-[#0050fa]" />
        <span className="mt-2 flex gap-1">
          <span className="h-2.5 flex-1 rounded-[3px] border border-[#e8e1d5] bg-white" />
          <span className="h-2.5 flex-1 rounded-[3px] border border-[#e8e1d5] bg-white" />
          <span className="h-2.5 flex-1 rounded-[3px] border border-[#e8e1d5] bg-white" />
        </span>
      </span>
    </span>
  );
}

const TYPE_HINTS: Record<CertificateType, string> = {
  mualliflik: "Maqola va materiallar taqdim etgan mualliflarga. Klassik, rasmiy uslub.",
  azolik: "YoshlarWiki aʼzoligini tasdiqlaydi. Brend uslubida, nomzod portreti bilan.",
};

/* ------------------------------------------------------------------ */
/* Asosiy forma                                                       */
/* ------------------------------------------------------------------ */

export function CreateCertificateForm({
  siteUrl,
  today,
  initialCandidate,
  disabled,
}: {
  siteUrl: string;
  today: string;
  initialCandidate: CandidateOption | null;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(createCertificate, idleCreateResult);
  const [candidate, setCandidate] = useState<CandidateOption | null>(initialCandidate);
  const [name, setName] = useState(initialCandidate?.full_name ?? "");
  const [type, setType] = useState<CertificateType>("mualliflik");
  const [issuedOn, setIssuedOn] = useState(today);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const uid = useId();

  const success = state.status === "success" && state.code && dismissed !== state.code ? state.code : null;

  if (success) {
    const page = `${siteUrl}/sertifikat/${success}`;
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <a
          href={page}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-[14px] border border-line bg-surface-2 shadow-yw"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${siteUrl}/sertifikat/${success}/rasm`}
            alt={`Sertifikat ${success}`}
            className="block aspect-[1123/794] h-auto w-full bg-surface-2 object-cover"
          />
        </a>
        <div>
          <p role="status" className="flex items-center gap-2 text-[15px] font-bold text-success">
            <Check className="size-5" strokeWidth={2.4} />
            {state.message}
          </p>
          <p className="mt-2 text-[13px] text-ink-2">
            Raqami: <span className="font-mono font-semibold text-ink">{success}</span>
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <a href={`${siteUrl}/sertifikat/${success}/pdf`} className={btn("primary", "md")}>
              <Download className="size-4" strokeWidth={2} />
              PDF yuklab olish
            </a>
            <a href={page} target="_blank" rel="noopener noreferrer" className={btn("secondary", "md")}>
              <ExternalLink className="size-4" strokeWidth={1.9} />
              Sahifani ochish
            </a>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(page);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  window.prompt("Havolani nusxalang:", page);
                }
              }}
              className={btn("ghost", "md")}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" strokeWidth={1.9} />}
              {copied ? "Nusxalandi" : "Havolani nusxalash"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setDismissed(success);
              setCandidate(null);
              setName("");
              setAllowDuplicate(false);
            }}
            className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-text hover:underline"
          >
            <Plus className="size-4" strokeWidth={2.2} />
            Yana sertifikat yaratish
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === "error" ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-4 py-3 text-[13px] text-danger">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          <div className="flex-1">
            {state.message}
            {state.existingCode ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                <a
                  href={`${siteUrl}/sertifikat/${state.existingCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  {state.existingCode} ni koʻrish
                </a>
                <label className="inline-flex cursor-pointer items-center gap-2 text-ink-2">
                  <input
                    type="checkbox"
                    checked={allowDuplicate}
                    onChange={(event) => setAllowDuplicate(event.target.checked)}
                    className="size-4 accent-[var(--yw-accent)]"
                  />
                  Baribir yangisini yaratish
                </label>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <input type="hidden" name="candidate_id" value={candidate?.id ?? ""} />
      <input type="hidden" name="allow_duplicate" value={allowDuplicate ? "1" : ""} />

      <Field
        label="1. Nomzod"
        hint="Ism boʻyicha qidiring. Nomzodsiz (faqat ism bilan) ham yaratish mumkin."
      >
        <CandidatePicker
          value={candidate}
          disabled={disabled}
          onChange={(next) => {
            setCandidate(next);
            setAllowDuplicate(false);
            if (next) setName(next.full_name);
          }}
        />
      </Field>

      <Field
        label="2. Sertifikatdagi ism"
        htmlFor={`${uid}-name`}
        hint="Sertifikatda aynan shunday yoziladi. Masalan: Olimov Saidaxrorxon."
      >
        <input
          id={`${uid}-name`}
          name="recipient_name"
          required
          minLength={2}
          maxLength={120}
          disabled={disabled}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Familiya Ism"
          className={inputClass}
        />
      </Field>

      <fieldset>
        <legend className="block text-[13px] font-semibold text-ink">3. Sertifikat turi</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(["mualliflik", "azolik"] as const).map((option) => (
            <label
              key={option}
              className={`group cursor-pointer rounded-[14px] border p-3 transition-all ${
                type === option
                  ? "border-accent bg-accent-soft/40 ring-2 ring-accent/25"
                  : "border-line bg-surface hover:border-line-strong"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={option}
                checked={type === option}
                onChange={() => {
                  setType(option);
                  setAllowDuplicate(false);
                }}
                disabled={disabled}
                className="sr-only"
              />
              <TypePreview type={option} />
              <span className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[14px] font-bold text-ink">{CERTIFICATE_LABELS[option]}</span>
                <span
                  className={`grid size-5 place-items-center rounded-full border-2 ${
                    type === option ? "border-accent bg-accent text-white" : "border-line-strong"
                  }`}
                >
                  {type === option ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
              </span>
              <span className="mt-1 block text-[12.5px] leading-snug text-ink-2">{TYPE_HINTS[option]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="4. Berilgan sana" htmlFor={`${uid}-date`}>
        <input
          id={`${uid}-date`}
          name="issued_on"
          type="date"
          required
          max={today}
          min="2020-01-01"
          disabled={disabled}
          value={issuedOn}
          onChange={(event) => setIssuedOn(event.target.value)}
          className={`${inputClass} sm:max-w-[220px]`}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button type="submit" disabled={disabled || pending || name.trim().length < 2} className={btn("primary", "md")}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Yaratilmoqda…
            </>
          ) : (
            <>
              <Plus className="size-4" strokeWidth={2.2} />
              Sertifikat yaratish
            </>
          )}
        </button>
        {candidate ? (
          <Link href={`/nomzodlar/${candidate.id}`} className="text-[13px] font-medium text-ink-2 hover:text-accent-text">
            Nomzod sahifasi
          </Link>
        ) : null}
      </div>
    </form>
  );
}
