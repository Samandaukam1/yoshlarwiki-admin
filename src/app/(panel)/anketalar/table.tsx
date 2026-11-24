import Link from "next/link";

import { GenderIcon } from "@/components/gender-icon";

import {
  Badge,
  DesktopOnly,
  formatDateTime,
  MobileItem,
  MobileList,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import {
  ANKETA_STATUS_LABELS,
  ANKETA_STATUS_TONES,
  PAYMENT_LABELS,
  PAYMENT_TONES,
  STEPS,
} from "@/lib/anketa";
import type { Database } from "@/lib/supabase/database.types";

type Row = Database["public"]["Tables"]["anketalar"]["Row"];

export function StatusBadge({ row, now }: { row: Row; now: number }) {
  const expired = row.status === "toldirilmoqda" && new Date(row.expires_at).getTime() < now;
  if (expired) return <Badge tone="danger">Muddati tugagan</Badge>;

  const live =
    row.status === "toldirilmoqda" &&
    row.last_activity_at &&
    now - new Date(row.last_activity_at).getTime() < 60_000;

  return (
    <Badge tone={ANKETA_STATUS_TONES[row.status]}>
      {live ? <span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-success" /> : null}
      {live ? "Hozir toʻldirmoqda" : ANKETA_STATUS_LABELS[row.status]}
    </Badge>
  );
}

export function GenderDot({ gender }: { gender: "erkak" | "ayol" }) {
  return <GenderIcon gender={gender} className="size-4 shrink-0" />;
}

function stepLabel(row: Row) {
  if (row.status !== "toldirilmoqda") return "—";
  if (!row.opened_at) return "Ochilmagan";
  return `${row.current_step + 1}/${STEPS.length}`;
}

export function AnketaTable({ rows, now }: { rows: Row[]; now: number }) {
  return (
    <>
      <MobileList>
        {rows.map((row) => (
          <MobileItem key={row.id}>
            <Link href={`/anketalar/${row.id}`} className="block">
              <span className="flex items-center gap-2">
                <GenderDot gender={row.gender} />
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">{row.full_name}</span>
              </span>
              <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <StatusBadge row={row} now={now} />
                {row.payment_status !== "yoq" ? (
                  <Badge tone={PAYMENT_TONES[row.payment_status]}>{PAYMENT_LABELS[row.payment_status]}</Badge>
                ) : null}
                <span className="ml-auto text-[12px] text-ink-3">{formatDateTime(row.created_at)}</span>
              </span>
            </Link>
          </MobileItem>
        ))}
      </MobileList>

      <DesktopOnly>
        <TableWrap>
          <thead>
            <tr>
              <Th>Nomzod</Th>
              <Th>Holat</Th>
              <Th>Toʻlov</Th>
              <Th>Bosqich</Th>
              <Th>Oxirgi faollik</Th>
              <Th>Yaratilgan</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-surface-hover">
                <Td>
                  <Link href={`/anketalar/${row.id}`} className="flex items-center gap-2.5 font-semibold text-ink hover:text-accent-text">
                    <GenderDot gender={row.gender} />
                    {row.full_name}
                  </Link>
                </Td>
                <Td>
                  <StatusBadge row={row} now={now} />
                </Td>
                <Td>
                  <Badge tone={PAYMENT_TONES[row.payment_status]}>{PAYMENT_LABELS[row.payment_status]}</Badge>
                </Td>
                <Td className="tabular-nums">{stepLabel(row)}</Td>
                <Td>{formatDateTime(row.last_activity_at)}</Td>
                <Td>{formatDateTime(row.created_at)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </DesktopOnly>
    </>
  );
}
