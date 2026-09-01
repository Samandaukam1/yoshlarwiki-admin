"use client";

import Link from "next/link";
import {
  Check,
  Loader2,
  MessageSquarePlus,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import { useActionState, useId } from "react";

import { addNote, convertToCandidate, updateStatus } from "../actions";
import { idleResult } from "../types";
import { btn, textareaClass } from "@/components/ui";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/constants";

function Feedback({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message: string;
}) {
  if (status === "idle" || !message) return null;
  const error = status === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mt-3 flex items-start gap-2.5 rounded-[10px] px-3.5 py-2.5 text-[13px] ${
        error ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
      }`}
    >
      {error ? (
        <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
      ) : (
        <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.4} />
      )}
      {message}
    </p>
  );
}

/** Statusni almashtirish tugmalari. */
export function StatusSwitcher({
  id,
  current,
  disabled,
}: {
  id: string;
  current: ApplicationStatus;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateStatus, idleResult);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        {APPLICATION_STATUSES.map((status) => {
          const active = status === current;
          return (
            <button
              key={status}
              type="submit"
              name="status"
              value={status}
              disabled={disabled || pending || active}
              className={`inline-flex h-9 items-center rounded-[10px] border px-3.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${
                active
                  ? "border-accent bg-accent-soft text-accent-soft-fg"
                  : "border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-surface-hover hover:text-ink disabled:opacity-50"
              }`}
            >
              {pending && !active ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              {STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
      <Feedback status={state.status} message={state.message} />
    </form>
  );
}

/** Ichki izoh qo'shish formasi. */
export function NoteForm({ id, disabled }: { id: string; disabled: boolean }) {
  const [state, formAction, pending] = useActionState(addNote, idleResult);
  const fieldId = useId();

  return (
    <form action={formAction} key={state.status === "success" ? state.message : "form"}>
      <input type="hidden" name="id" value={id} />
      <label htmlFor={fieldId} className="sr-only">
        Ichki izoh
      </label>
      <textarea
        id={fieldId}
        name="body"
        rows={3}
        required
        disabled={disabled}
        placeholder="Ichki izoh qoldiring — bu matn faqat adminlarga koʻrinadi."
        className={textareaClass}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <button type="submit" disabled={disabled || pending} className={btn("secondary", "sm")}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saqlanmoqda…
            </>
          ) : (
            <>
              <MessageSquarePlus className="size-4" strokeWidth={1.9} />
              Izoh qoʻshish
            </>
          )}
        </button>
      </div>
      <Feedback status={state.status} message={state.message} />
    </form>
  );
}

/** Arizani nomzodga aylantirish. */
export function ConvertButton({
  id,
  disabled,
  convertedId,
}: {
  id: string;
  disabled: boolean;
  convertedId: string | null;
}) {
  const [state, formAction, pending] = useActionState(convertToCandidate, idleResult);
  const candidateId = state.candidateId ?? convertedId;

  if (candidateId) {
    return (
      <div>
        <p className="text-[13px] text-ink-2">
          Ushbu ariza asosida nomzod qoralamasi yaratilgan.
        </p>
        <Link href={`/nomzodlar/${candidateId}`} className={btn("secondary", "sm", "mt-3")}>
          Nomzodni ochish
        </Link>
        <Feedback status={state.status} message={state.message} />
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <p className="text-[13px] leading-relaxed text-ink-2">
        Ariza asosida nomzod qoralamasi yaratiladi. Asl ariza yozuvi
        oʻchirilmaydi — u nomzodga bogʻlanadi.
      </p>
      <button type="submit" disabled={disabled || pending} className={btn("primary", "sm", "mt-3")}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Yaratilmoqda…
          </>
        ) : (
          <>
            <UserPlus className="size-4" strokeWidth={1.9} />
            Nomzodga aylantirish
          </>
        )}
      </button>
      <Feedback status={state.status} message={state.message} />
    </form>
  );
}
