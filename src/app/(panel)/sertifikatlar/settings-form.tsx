"use client";

import { Check, Loader2, Save, TriangleAlert } from "lucide-react";
import { useActionState, useId } from "react";

import { saveCertificateSettings } from "./actions";
import type { CertificateSettings } from "./types";
import { idleSettings } from "../seo/types";
import { btn, Field, inputClass } from "@/components/ui";

export function CertificateSettingsForm({
  settings,
  disabled,
}: {
  settings: CertificateSettings;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveCertificateSettings, idleSettings);
  const uid = useId();

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {state.status !== "idle" && state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`flex items-start gap-2.5 rounded-[10px] px-4 py-3 text-[13px] sm:col-span-2 ${
            state.status === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
          }`}
        >
          {state.status === "error" ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          ) : (
            <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.4} />
          )}
          {state.message}
        </p>
      ) : null}

      <Field label="Imzo qoʻyuvchi" htmlFor={`${uid}-name`} hint="Imzo oʻrnida qoʻlyozma shriftda yoziladi.">
        <input
          id={`${uid}-name`}
          name="signer_name"
          disabled={disabled}
          defaultValue={settings.signer_name}
          placeholder="Saidaxror Olimov"
          maxLength={60}
          className={inputClass}
        />
      </Field>

      <Field label="Lavozimi" htmlFor={`${uid}-title`}>
        <input
          id={`${uid}-title`}
          name="signer_title"
          disabled={disabled}
          defaultValue={settings.signer_title}
          placeholder="Loyiha rahbari"
          className={inputClass}
        />
      </Field>

      <Field
        label="Imzo rasmi (ixtiyoriy)"
        htmlFor={`${uid}-sig`}
        hint="Shaffof fonli PNG havolasi (Media boʻlimidan yuklang). Boʻlsa — qoʻlyozma shrift oʻrniga haqiqiy imzo chiqadi."
        className="sm:col-span-2"
      >
        <input
          id={`${uid}-sig`}
          name="signature_url"
          type="url"
          disabled={disabled}
          defaultValue={settings.signature_url}
          placeholder="https://…/imzo.png"
          className={inputClass}
        />
      </Field>

      <div className="sm:col-span-2">
        <button type="submit" disabled={disabled || pending} className={btn("primary", "sm")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" strokeWidth={1.9} />}
          {pending ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </div>
    </form>
  );
}
