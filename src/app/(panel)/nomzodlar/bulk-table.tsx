"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck, CircleCheck, CircleX, Crown, ExternalLink, Loader2, Send, Square, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { listPublishedCandidateIds, sendCandidatePostAction } from "./actions";
import { Badge, btn, MobileItem, MobileList, TableWrap, Td, Th, type Tone } from "@/components/ui";
import { PROFILE_THEME_INFO, normalizeTheme } from "@/lib/profile-theme";

export type BulkRow = {
  id: string;
  full_name: string;
  slug: string;
  portrait_url: string | null;
  status: string;
  status_label: string;
  status_tone: Tone;
  category: string | null;
  view_count: number;
  updated_label: string;
  post_url: string | null;
  theme_color: string;
};

type Progress = {
  total: number;
  done: number;
  ok: number;
  failed: { name: string; message: string }[];
  current: string;
};

/** Telegram kanalga ketma-ket yuborish chegarasi (≈20 ta/daqiqa) uchun pauza. */
const PAUSE_MS = 3200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function BulkPostTable({
  rows,
  siteUrl,
  writable,
}: {
  rows: BulkRow[];
  siteUrl: string;
  writable: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Progress | null>(null);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);

  const publishable = useMemo(() => rows.filter((r) => r.status === "published"), [rows]);
  const names = useMemo(() => new Map(rows.map((r) => [r.id, r.full_name])), [rows]);
  const allVisibleSelected = publishable.length > 0 && publishable.every((r) => selected.has(r.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected(allVisibleSelected ? new Set() : new Set(publishable.map((r) => r.id)));

  const run = async (ids: string[], onlyNotPosted = false) => {
    if (!ids.length || running) return;
    stopRef.current = false;
    setRunning(true);
    const state: Progress = { total: ids.length, done: 0, ok: 0, failed: [], current: "" };
    setProgress({ ...state });

    for (const [i, id] of ids.entries()) {
      if (stopRef.current) break;
      state.current = names.get(id) ?? "Nomzod";
      setProgress({ ...state });
      try {
        const res = await sendCandidatePostAction(id, onlyNotPosted);
        if (res.ok) state.ok += 1;
        else state.failed.push({ name: state.current, message: res.message });
      } catch {
        state.failed.push({ name: state.current, message: "Server javob bermadi." });
      }
      state.done += 1;
      setProgress({ ...state });
      if (i < ids.length - 1 && !stopRef.current) await sleep(PAUSE_MS);
    }

    state.current = "";
    setProgress({ ...state });
    setRunning(false);
    setSelected(new Set());
    router.refresh();
  };

  const sendAll = async (onlyNotPosted: boolean) => {
    const ids = await listPublishedCandidateIds(onlyNotPosted);
    if (!ids.length) {
      setProgress({ total: 0, done: 0, ok: 0, failed: [], current: "" });
      return;
    }
    const label = onlyNotPosted ? "post yuborilmagan" : "nashr etilgan BARCHA";
    if (!window.confirm(`${label} ${ids.length} ta nomzodga kanalga post yuborilsinmi?`)) return;
    await run(ids, onlyNotPosted);
  };

  const sendSelected = () => {
    const ids = [...selected];
    if (!window.confirm(`Tanlangan ${ids.length} ta nomzodga kanalga post yuborilsinmi?`)) return;
    void run(ids);
  };

  const Check = ({ row }: { row: BulkRow }) => {
    const disabled = !writable || row.status !== "published" || running;
    return (
      <input
        type="checkbox"
        checked={selected.has(row.id)}
        disabled={disabled}
        onChange={() => toggle(row.id)}
        onClick={(e) => e.stopPropagation()}
        title={row.status === "published" ? "Post uchun tanlash" : "Faqat nashr etilgan profilga post yuboriladi"}
        aria-label={`${row.full_name} — tanlash`}
        className="size-[18px] shrink-0 cursor-pointer accent-[var(--yw-accent)] disabled:cursor-not-allowed disabled:opacity-40"
      />
    );
  };

  const PostBadge = ({ row }: { row: BulkRow }) =>
    row.post_url ? (
      <a
        href={row.post_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[12px] font-medium text-success hover:underline"
      >
        <Send className="size-3.5" /> Yuborilgan
      </a>
    ) : (
      <span className="text-[12px] text-ink-3">—</span>
    );

  const Vip = ({ row }: { row: BulkRow }) => {
    const theme = normalizeTheme(row.theme_color);
    if (theme === "standard") return null;
    const info = PROFILE_THEME_INFO[theme];
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white"
        style={{ background: info.accent }}
        title={`VIP fon: ${info.label}`}
      >
        <Crown className="size-3" /> VIP
      </span>
    );
  };

  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <>
      {writable ? (
        <div className="mt-6 rounded-card border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 flex items-center gap-2 text-[13.5px] font-semibold text-ink">
              <Send className="size-4 text-accent-text" /> Kanalga post
            </span>
            <button type="button" onClick={toggleAllVisible} disabled={running} className={btn("secondary", "sm")}>
              {allVisibleSelected ? <Square className="size-4" /> : <CheckCheck className="size-4" />}
              {allVisibleSelected ? "Tanlovni bekor qilish" : "Hammasini tanlash"}
            </button>
            <button
              type="button"
              onClick={sendSelected}
              disabled={running || selected.size === 0}
              className={btn("primary", "sm")}
            >
              <Send className="size-4" /> Tanlanganlarga yuborish ({selected.size})
            </button>
            <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
            <button type="button" onClick={() => void sendAll(true)} disabled={running} className={btn("secondary", "sm")}>
              Yuborilmaganlarning hammasiga
            </button>
            <button type="button" onClick={() => void sendAll(false)} disabled={running} className={btn("ghost", "sm")}>
              Barcha nomzodlarga
            </button>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
            Post — anketadagi kabi shablonli rasm + rasmiy matn. Faqat saytda nashr etilgan profillarga yuboriladi.
            Telegram cheklovi sababli har post orasida ~3 soniya pauza bor — sahifani yopmang.
          </p>

          {progress ? (
            <div className="mt-3 rounded-[10px] bg-surface-2 p-3">
              {progress.total === 0 ? (
                <p className="text-[13px] text-ink-2">Yuboriladigan nomzod topilmadi.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-ink">
                      {running ? <Loader2 className="size-4 shrink-0 animate-spin text-accent-text" /> : null}
                      <span className="truncate">
                        {running ? `Yuborilmoqda: ${progress.current}` : "Tugadi"}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-2">
                      {progress.done}/{progress.total}
                      <CircleCheck className="ml-2 mr-0.5 inline size-4 -mt-0.5 text-success" /> {progress.ok}
                      {progress.failed.length ? (
                        <>
                          <CircleX className="ml-2 mr-0.5 inline size-4 -mt-0.5 text-danger" /> {progress.failed.length}
                        </>
                      ) : null}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  {running ? (
                    <button
                      type="button"
                      onClick={() => (stopRef.current = true)}
                      className={btn("ghost", "sm", "mt-2")}
                    >
                      <X className="size-4" /> Toʻxtatish
                    </button>
                  ) : null}
                  {progress.failed.length ? (
                    <ul className="mt-2 space-y-1 text-[12.5px] text-danger">
                      {progress.failed.map((f, i) => (
                        <li key={i}>
                          <b>{f.name}:</b> {f.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Telefonda — kartochkalar */}
      <div className="mt-6 md:hidden">
        <MobileList>
          {rows.map((item) => (
            <MobileItem key={item.id} className="flex items-center gap-1 p-0 pl-3.5">
              {writable ? <Check row={item} /> : null}
              <Link href={`/nomzodlar/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-3.5">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {item.portrait_url ? (
                    <Image src={item.portrait_url} alt="" fill sizes="56px" className="object-cover object-top" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[14.5px] font-semibold text-ink">{item.full_name}</span>
                    <Vip row={item} />
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-ink-3">
                    {item.category ?? "Kategoriya yoʻq"}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
                    <Badge tone={item.status_tone}>{item.status_label}</Badge>
                    <span className="tabular-nums">{item.view_count} koʻrish</span>
                    {item.post_url ? (
                      <span className="inline-flex items-center gap-1 text-success">
                        <Send className="size-3.5" /> post
                      </span>
                    ) : null}
                  </span>
                </span>
              </Link>
            </MobileItem>
          ))}
        </MobileList>
      </div>

      {/* Kengroq ekranda — jadval */}
      <div className="mt-6 hidden md:block">
        <TableWrap>
          <thead>
            <tr>
              {writable ? (
                <Th className="w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    disabled={running || publishable.length === 0}
                    aria-label="Hammasini tanlash"
                    className="size-[18px] cursor-pointer accent-[var(--yw-accent)]"
                  />
                </Th>
              ) : null}
              <Th>Nomzod</Th>
              <Th>Kategoriya</Th>
              <Th>Holat</Th>
              <Th>Post</Th>
              <Th>Koʻrishlar</Th>
              <Th>Yangilangan</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr
                key={item.id}
                className={`transition-colors hover:bg-surface-hover ${selected.has(item.id) ? "bg-accent-soft/40" : ""}`}
              >
                {writable ? (
                  <Td>
                    <Check row={item} />
                  </Td>
                ) : null}
                <Td>
                  <Link href={`/nomzodlar/${item.id}`} className="flex items-center gap-3">
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      {item.portrait_url ? (
                        <Image src={item.portrait_url} alt="" fill sizes="40px" className="object-cover object-top" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-ink">{item.full_name}</span>
                        <Vip row={item} />
                      </span>
                      <span className="block truncate text-[12px] text-ink-3">/{item.slug}</span>
                    </span>
                  </Link>
                </Td>
                <Td>{item.category ?? <span className="text-ink-3">—</span>}</Td>
                <Td>
                  <Badge tone={item.status_tone}>{item.status_label}</Badge>
                </Td>
                <Td>
                  <PostBadge row={item} />
                </Td>
                <Td className="tabular-nums">{item.view_count}</Td>
                <Td className="whitespace-nowrap">{item.updated_label}</Td>
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
            ))}
          </tbody>
        </TableWrap>
      </div>
    </>
  );
}
