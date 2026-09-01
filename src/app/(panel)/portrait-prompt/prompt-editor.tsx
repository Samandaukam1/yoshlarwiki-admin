"use client";

import {
  Check,
  Copy,
  Loader2,
  RotateCcw,
  Save,
  TriangleAlert,
} from "lucide-react";
import { useActionState, useId, useRef, useState } from "react";

import { savePrompt } from "./actions";
import { initialPromptState } from "./types";
import { btn, textareaClass } from "@/components/ui";

export function PromptEditor({
  initialPrompt,
  readOnly,
}: {
  initialPrompt: string;
  readOnly: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    savePrompt,
    initialPromptState,
  );
  const [value, setValue] = useState(initialPrompt);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();

  const dirty = value !== initialPrompt;

  // Intl server va brauzerda turlicha ajratgich beradi (gidratsiya xatosi),
  // shuning uchun formatlash aniq belgilangan.
  const charCount = value.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  /** Butun promptni buferga nusxalaydi. */
  const copy = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      await navigator.clipboard.writeText(value);
      setCopied("ok");
    } catch {
      // Clipboard API mavjud bo'lmasa — matnni belgilab beramiz.
      textareaRef.current?.select();
      setCopied("fail");
    }
    timerRef.current = setTimeout(() => setCopied("idle"), 2500);
  };

  return (
    <form action={formAction} className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label
          htmlFor={fieldId}
          className="text-[13px] font-semibold text-ink"
        >
          Prompt matni
        </label>
        <span className="text-[12px] tabular-nums text-ink-3">
          {charCount} ta belgi
        </span>
      </div>

      <textarea
        ref={textareaRef}
        id={fieldId}
        name="prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        rows={22}
        className={`${textareaClass} mt-2 font-mono text-[12.5px] leading-[1.65]`}
      />

      {state.status === "error" ? (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p
          role="status"
          className="mt-3 flex items-start gap-2.5 rounded-[10px] bg-success-soft px-4 py-3 text-[13px] text-success"
        >
          <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.4} />
          {state.message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={copy}
          className={btn(copied === "ok" ? "secondary" : "primary")}
        >
          {copied === "ok" ? (
            <>
              <Check className="size-[18px]" strokeWidth={2.4} />
              Nusxalandi
            </>
          ) : (
            <>
              <Copy className="size-[18px]" strokeWidth={1.9} />
              Nusxalash
            </>
          )}
        </button>

        {!readOnly ? (
          <>
            <button
              type="submit"
              disabled={pending || !dirty}
              className={btn("secondary")}
            >
              {pending ? (
                <>
                  <Loader2 className="size-[18px] animate-spin" />
                  Saqlanmoqda…
                </>
              ) : (
                <>
                  <Save className="size-[18px]" strokeWidth={1.9} />
                  Saqlash
                </>
              )}
            </button>

            {dirty ? (
              <button
                type="button"
                onClick={() => setValue(initialPrompt)}
                className={btn("ghost")}
              >
                <RotateCcw className="size-[18px]" strokeWidth={1.9} />
                Bekor qilish
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      {copied === "fail" ? (
        <p role="status" className="mt-3 text-[12.5px] text-warning">
          Brauzer buferga ruxsat bermadi — matn belgilandi, Cmd/Ctrl + C bosing.
        </p>
      ) : null}
    </form>
  );
}
