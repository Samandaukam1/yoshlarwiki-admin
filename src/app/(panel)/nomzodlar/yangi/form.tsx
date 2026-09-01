"use client";

import { ArrowRight, Loader2, TriangleAlert } from "lucide-react";
import { useActionState, useId, useState } from "react";

import { createCandidate } from "../actions";
import { idleCms } from "../types";
import { btn, Field, inputClass } from "@/components/ui";
import { slugify } from "@/lib/constants";

export function NewCandidateForm() {
  const [state, formAction, pending] = useActionState(createCandidate, idleCms);
  const [fullName, setFullName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const ids = { name: useId(), slug: useId(), title: useId() };
  const effectiveSlug = slugTouched ? slug : slugify(fullName);

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {state.message}
        </p>
      ) : null}

      <Field label="Ism familiya" htmlFor={ids.name}>
        <input
          id={ids.name}
          name="full_name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Masalan: Asadbek Yusupov"
          className={inputClass}
        />
      </Field>

      <Field
        label="Havola (slug)"
        htmlFor={ids.slug}
        hint={`Sayt manzili: /yoshlar/${effectiveSlug || "…"}`}
      >
        <input
          id={ids.slug}
          name="slug"
          value={effectiveSlug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          placeholder="asadbek-yusupov"
          className={inputClass}
        />
      </Field>

      <Field label="Kasb / lavozim" htmlFor={ids.title}>
        <input
          id={ids.title}
          name="title"
          placeholder="Dasturchi, Startap asoschisi"
          className={inputClass}
        />
      </Field>

      <button type="submit" disabled={pending} className={btn("primary")}>
        {pending ? (
          <>
            <Loader2 className="size-[18px] animate-spin" />
            Yaratilmoqda…
          </>
        ) : (
          <>
            Yaratish va tahrirlash
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
