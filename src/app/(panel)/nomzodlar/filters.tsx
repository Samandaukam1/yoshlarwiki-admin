"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { inputClass } from "@/components/ui";
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS } from "@/lib/constants";

export function CandidateFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const urlQuery = params.get("q") ?? "";
  const [term, setTerm] = useState(urlQuery);
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  const first = useRef(true);

  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setTerm(urlQuery);
  }

  const push = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if ((params.get("q") ?? "") !== term) push({ q: term || null });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-3"
          strokeWidth={1.9}
        />
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Ism yoki kasb boʻyicha qidirish…"
          aria-label="Nomzodlar orasidan qidirish"
          className={`${inputClass} pl-11 pr-10`}
        />
        {pending ? (
          <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-3" />
        ) : term ? (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Qidiruvni tozalash"
            className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-3 hover:bg-surface-hover hover:text-ink"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <select
        value={params.get("status") ?? ""}
        onChange={(event) => push({ status: event.target.value || null })}
        aria-label="Holat boʻyicha filtr"
        className={`${inputClass} sm:w-[200px]`}
      >
        <option value="">Barcha holatlar</option>
        {CANDIDATE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {CANDIDATE_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>
  );
}
