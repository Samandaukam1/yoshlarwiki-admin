"use client";

import { Check, Loader2, Save, TriangleAlert } from "lucide-react";
import { useActionState, useId } from "react";

import { saveSeoDefaults } from "./actions";
import { idleSettings } from "./types";
import { btn, Field, inputClass, textareaClass } from "@/components/ui";

export type SeoDefaults = {
  site_name?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  og_image?: string;
};

export function SeoForm({
  defaults,
  disabled,
}: {
  defaults: SeoDefaults;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveSeoDefaults, idleSettings);
  const uid = useId();
  const f = (key: string) => `${uid}-${key}`;

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      {state.status === "error" ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-4 py-3 text-[13px] text-danger sm:col-span-2"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p
          role="status"
          className="flex items-start gap-2.5 rounded-[10px] bg-success-soft px-4 py-3 text-[13px] text-success sm:col-span-2"
        >
          <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.4} />
          {state.message}
        </p>
      ) : null}

      <Field label="Sayt nomi" htmlFor={f("site")}>
        <input
          id={f("site")}
          name="site_name"
          disabled={disabled}
          defaultValue={defaults.site_name ?? "YoshlarWiki"}
          className={inputClass}
        />
      </Field>

      <Field label="Open Graph rasm havolasi" htmlFor={f("og")}>
        <input
          id={f("og")}
          name="og_image"
          type="url"
          disabled={disabled}
          defaultValue={defaults.og_image ?? ""}
          placeholder="Media boʻlimidan yuklang"
          className={inputClass}
        />
      </Field>

      <Field label="Standart sarlavha" htmlFor={f("title")} className="sm:col-span-2">
        <input
          id={f("title")}
          name="title"
          required
          disabled={disabled}
          defaultValue={defaults.title ?? ""}
          className={inputClass}
        />
      </Field>

      <Field
        label="Standart tavsif"
        htmlFor={f("desc")}
        hint="150–160 belgi tavsiya etiladi."
        className="sm:col-span-2"
      >
        <textarea
          id={f("desc")}
          name="description"
          rows={3}
          required
          disabled={disabled}
          defaultValue={defaults.description ?? ""}
          className={textareaClass}
        />
      </Field>

      <Field
        label="Kalit soʻzlar"
        htmlFor={f("kw")}
        hint="Vergul bilan ajrating."
        className="sm:col-span-2"
      >
        <input
          id={f("kw")}
          name="keywords"
          disabled={disabled}
          defaultValue={(defaults.keywords ?? []).join(", ")}
          className={inputClass}
        />
      </Field>

      <div className="sm:col-span-2">
        <button type="submit" disabled={disabled || pending} className={btn("primary", "sm")}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saqlanmoqda…
            </>
          ) : (
            <>
              <Save className="size-4" strokeWidth={1.9} />
              Saqlash
            </>
          )}
        </button>
      </div>
    </form>
  );
}
