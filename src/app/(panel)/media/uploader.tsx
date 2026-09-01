"use client";

import { Check, Copy, Loader2, TriangleAlert, Upload } from "lucide-react";
import { useActionState, useId, useRef, useState } from "react";

import { uploadMedia } from "./actions";
import { BUCKET_LABELS, idleMedia } from "./types";
import { btn, Card, CardTitle, Field, inputClass } from "@/components/ui";

export function MediaUploader({
  buckets,
  disabled,
}: {
  buckets: readonly string[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(uploadMedia, idleMedia);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uid = useId();

  const copy = async () => {
    if (!state.url) return;
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(state.url);
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card>
      <CardTitle>Fayl yuklash</CardTitle>

      <form action={formAction} className="grid gap-4 sm:grid-cols-[200px_1fr_auto] sm:items-end">
        <Field label="Bucket" htmlFor={`${uid}-bucket`}>
          <select
            id={`${uid}-bucket`}
            name="bucket"
            disabled={disabled}
            defaultValue="portraits"
            className={inputClass}
          >
            {buckets.map((bucket) => (
              <option key={bucket} value={bucket}>
                {BUCKET_LABELS[bucket] ?? bucket}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Fayl"
          htmlFor={`${uid}-file`}
          hint="JPEG, PNG, WebP, AVIF yoki MP4. Maksimal 8 MB."
        >
          <input
            id={`${uid}-file`}
            name="file"
            type="file"
            required
            disabled={disabled}
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4"
            className="block w-full text-[13px] text-ink-2 file:mr-3 file:rounded-[8px] file:border-0 file:bg-accent-soft file:px-3.5 file:py-2 file:text-[13px] file:font-semibold file:text-accent-soft-fg"
          />
        </Field>

        <button type="submit" disabled={disabled || pending} className={btn("primary")}>
          {pending ? (
            <>
              <Loader2 className="size-[18px] animate-spin" />
              Yuklanmoqda…
            </>
          ) : (
            <>
              <Upload className="size-[18px]" strokeWidth={1.9} />
              Yuklash
            </>
          )}
        </button>
      </form>

      {state.status === "error" ? (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {state.message}
        </p>
      ) : null}

      {state.status === "success" && state.url ? (
        <div className="mt-4 rounded-[10px] bg-success-soft px-4 py-3">
          <p role="status" className="flex items-center gap-2.5 text-[13px] text-success">
            <Check className="size-4 shrink-0" strokeWidth={2.4} />
            {state.message}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md bg-surface px-3 py-2 text-[12px] text-ink-2">
              {state.url}
            </code>
            <button type="button" onClick={copy} className={btn("secondary", "sm")}>
              {copied ? (
                <>
                  <Check className="size-4" strokeWidth={2.4} />
                  Nusxalandi
                </>
              ) : (
                <>
                  <Copy className="size-4" strokeWidth={1.9} />
                  Nusxalash
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
