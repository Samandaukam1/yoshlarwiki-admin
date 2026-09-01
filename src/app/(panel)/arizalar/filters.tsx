"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { inputClass } from "@/components/ui";
import {
  AGE_RANGES,
  APPLICATION_STATUSES,
  GENDERS,
  STATUS_LABELS,
} from "@/lib/constants";

export function ApplicationFilters({ promoCodes }: { promoCodes: string[] }) {
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
    next.delete("sahifa");
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

  const select = `${inputClass} appearance-none`;
  const active = ["status", "jins", "yosh", "promo", "sana"].filter((key) =>
    params.get(key),
  ).length;

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-3"
          strokeWidth={1.9}
        />
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Ism, telefon yoki Telegram boʻyicha qidirish…"
          aria-label="Arizalar orasidan qidirish"
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

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={params.get("status") ?? ""}
          onChange={(event) => push({ status: event.target.value || null })}
          aria-label="Status boʻyicha filtr"
          className={select}
        >
          <option value="">Barcha statuslar</option>
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <select
          value={params.get("jins") ?? ""}
          onChange={(event) => push({ jins: event.target.value || null })}
          aria-label="Jins boʻyicha filtr"
          className={select}
        >
          <option value="">Jins: barchasi</option>
          {GENDERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={params.get("yosh") ?? ""}
          onChange={(event) => push({ yosh: event.target.value || null })}
          aria-label="Yosh oraligʻi boʻyicha filtr"
          className={select}
        >
          <option value="">Yosh: barchasi</option>
          {AGE_RANGES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={params.get("promo") ?? ""}
          onChange={(event) => push({ promo: event.target.value || null })}
          aria-label="Promokod boʻyicha filtr"
          className={select}
        >
          <option value="">Promokod: barchasi</option>
          <option value="__yes__">Promokodi bor</option>
          {promoCodes.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>

        <select
          value={params.get("sana") ?? ""}
          onChange={(event) => push({ sana: event.target.value || null })}
          aria-label="Sana boʻyicha filtr"
          className={select}
        >
          <option value="">Butun davr</option>
          <option value="today">Bugun</option>
          <option value="7">Soʻnggi 7 kun</option>
          <option value="30">Soʻnggi 30 kun</option>
        </select>
      </div>

      {active > 0 || term ? (
        <button
          type="button"
          onClick={() => {
            setTerm("");
            push({ status: null, jins: null, yosh: null, promo: null, sana: null, q: null });
          }}
          className="mt-3 text-[13px] font-medium text-accent-text hover:underline"
        >
          Filtrlarni tozalash
        </button>
      ) : null}
    </div>
  );
}
