"use client";

import { Check, Loader2, Plus, Save, TriangleAlert } from "lucide-react";
import { useActionState, useId } from "react";

import { addPromocode, saveContacts } from "./actions";
import { idleSettings } from "../seo/types";
import { btn, Field, inputClass } from "@/components/ui";

function Feedback({ status, message }: { status: string; message: string }) {
  if (status === "idle" || !message) return null;
  const error = status === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-[10px] px-4 py-3 text-[13px] sm:col-span-2 ${
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

export type Contacts = {
  email?: string;
  telegram?: string;
  instagram?: string;
  youtube?: string;
};

export function ContactsForm({
  contacts,
  disabled,
}: {
  contacts: Contacts;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveContacts, idleSettings);
  const uid = useId();
  const f = (key: string) => `${uid}-${key}`;

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <Feedback status={state.status} message={state.message} />

      <Field label="Email" htmlFor={f("email")}>
        <input
          id={f("email")}
          name="email"
          type="email"
          disabled={disabled}
          defaultValue={contacts.email ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Telegram" htmlFor={f("tg")}>
        <input
          id={f("tg")}
          name="telegram"
          disabled={disabled}
          defaultValue={contacts.telegram ?? ""}
          placeholder="https://t.me/yoshlarwiki"
          className={inputClass}
        />
      </Field>

      <Field label="Instagram" htmlFor={f("ig")}>
        <input
          id={f("ig")}
          name="instagram"
          disabled={disabled}
          defaultValue={contacts.instagram ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="YouTube" htmlFor={f("yt")}>
        <input
          id={f("yt")}
          name="youtube"
          disabled={disabled}
          defaultValue={contacts.youtube ?? ""}
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

export function PromocodeForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(addPromocode, idleSettings);
  const uid = useId();

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
      <Feedback status={state.status} message={state.message} />

      <Field label="Promokod" htmlFor={`${uid}-code`}>
        <input
          id={`${uid}-code`}
          name="code"
          required
          disabled={disabled}
          placeholder="YOSHLAR2026"
          autoCapitalize="characters"
          className={`${inputClass} uppercase tracking-wide`}
        />
      </Field>

      <Field label="Izoh" htmlFor={`${uid}-label`}>
        <input
          id={`${uid}-label`}
          name="label"
          disabled={disabled}
          placeholder="Qayerda tarqatilgani"
          className={inputClass}
        />
      </Field>

      <button type="submit" disabled={disabled || pending} className={btn("secondary")}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" strokeWidth={2.2} />
        )}
        Qoʻshish
      </button>
    </form>
  );
}
