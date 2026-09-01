"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useActionState, useEffect, useId, useState } from "react";

import { deleteCategory, moveCategory, saveCategory } from "./actions";
import { idleCategory } from "./types";
import {
  Badge,
  btn,
  Card,
  CardTitle,
  Field,
  inputClass,
  textareaClass,
} from "@/components/ui";
import { CATEGORY_ICONS, slugify } from "@/lib/constants";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  is_active: boolean;
};

function CategoryForm({
  category,
  onDone,
  disabled,
}: {
  category?: CategoryRow;
  onDone?: () => void;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveCategory, idleCategory);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const uid = useId();
  const f = (key: string) => `${uid}-${key}`;

  const effectiveSlug = slugTouched ? slug : slugify(name);

  // Muvaffaqiyatli saqlangach tahrirlash rejimini yopamiz.
  const succeeded = state.status === "success";
  useEffect(() => {
    if (succeeded && onDone) onDone();
  }, [succeeded, onDone]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      {state.status === "error" ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-4 py-3 text-[13px] text-danger sm:col-span-2"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {state.message}
        </p>
      ) : null}

      {state.status === "success" && !onDone ? (
        <p
          role="status"
          className="flex items-start gap-2.5 rounded-[10px] bg-success-soft px-4 py-3 text-[13px] text-success sm:col-span-2"
        >
          <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.4} />
          {state.message}
        </p>
      ) : null}

      <Field label="Nomi" htmlFor={f("name")}>
        <input
          id={f("name")}
          name="name"
          required
          disabled={disabled}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Havola (slug)" htmlFor={f("slug")} hint={`/kategoriyalar/${effectiveSlug || "…"}`}>
        <input
          id={f("slug")}
          name="slug"
          disabled={disabled}
          value={effectiveSlug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          className={inputClass}
        />
      </Field>

      <Field label="Ikonka" htmlFor={f("icon")}>
        <select
          id={f("icon")}
          name="icon"
          disabled={disabled}
          defaultValue={category?.icon ?? "briefcase"}
          className={inputClass}
        >
          {CATEGORY_ICONS.map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tartib raqami" htmlFor={f("order")}>
        <input
          id={f("order")}
          name="sort_order"
          type="number"
          disabled={disabled}
          defaultValue={category?.sort_order ?? 99}
          className={inputClass}
        />
      </Field>

      <Field label="Tavsif" htmlFor={f("desc")} className="sm:col-span-2">
        <textarea
          id={f("desc")}
          name="description"
          rows={2}
          disabled={disabled}
          defaultValue={category?.description ?? ""}
          className={textareaClass}
        />
      </Field>

      <Field label="SEO sarlavha" htmlFor={f("seotitle")}>
        <input
          id={f("seotitle")}
          name="seo_title"
          disabled={disabled}
          defaultValue={category?.seo_title ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="SEO tavsif" htmlFor={f("seodesc")}>
        <input
          id={f("seodesc")}
          name="seo_description"
          disabled={disabled}
          defaultValue={category?.seo_description ?? ""}
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-3 text-[13.5px] text-ink sm:col-span-2">
        <input
          type="checkbox"
          name="is_active"
          disabled={disabled}
          defaultChecked={category?.is_active ?? true}
          className="size-4 accent-[var(--yw-accent)]"
        />
        Faol (saytda koʻrinadi)
      </label>

      <div className="flex gap-2.5 sm:col-span-2">
        <button type="submit" disabled={disabled || pending} className={btn("primary", "sm")}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saqlanmoqda…
            </>
          ) : category ? (
            "Saqlash"
          ) : (
            <>
              <Plus className="size-4" strokeWidth={2.2} />
              Qoʻshish
            </>
          )}
        </button>
        {onDone ? (
          <button type="button" onClick={onDone} className={btn("ghost", "sm")}>
            <X className="size-4" />
            Bekor qilish
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function CategoryList({
  categories,
  counts,
  disabled,
}: {
  categories: CategoryRow[];
  counts: Record<string, number>;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle
          action={
            !adding && !disabled ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className={btn("primary", "sm")}
              >
                <Plus className="size-4" strokeWidth={2.2} />
                Yangi kategoriya
              </button>
            ) : null
          }
        >
          Kategoriyalar ({categories.length})
        </CardTitle>

        {adding ? (
          <div className="mb-5 rounded-card border border-line bg-surface-2 p-4">
            <CategoryForm onDone={() => setAdding(false)} disabled={disabled} />
          </div>
        ) : null}

        <ul className="space-y-2">
          {categories.map((category, index) => (
            <li key={category.id} className="rounded-card border border-line">
              {editing === category.id ? (
                <div className="bg-surface-2 p-4">
                  <CategoryForm
                    category={category}
                    onDone={() => setEditing(null)}
                    disabled={disabled}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-7 shrink-0 text-[12px] tabular-nums text-ink-3">
                    {category.sort_order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                      {category.name}
                      {!category.is_active ? (
                        <Badge tone="warning">Nofaol</Badge>
                      ) : null}
                    </p>
                    <p className="truncate text-[12px] text-ink-3">
                      /{category.slug} · {category.icon} ·{" "}
                      {counts[category.slug] ?? 0} ta profil
                    </p>
                  </div>

                  {!disabled ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <form action={moveCategory}>
                        <input type="hidden" name="id" value={category.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={index === 0}
                          aria-label="Yuqoriga"
                          className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-hover hover:text-ink disabled:opacity-30"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                      </form>
                      <form action={moveCategory}>
                        <input type="hidden" name="id" value={category.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={index === categories.length - 1}
                          aria-label="Pastga"
                          className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-hover hover:text-ink disabled:opacity-30"
                        >
                          <ChevronDown className="size-4" />
                        </button>
                      </form>
                      <button
                        type="button"
                        onClick={() => setEditing(category.id)}
                        aria-label="Tahrirlash"
                        className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-hover hover:text-ink"
                      >
                        <Pencil className="size-4" strokeWidth={1.9} />
                      </button>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={category.id} />
                        <button
                          type="submit"
                          aria-label="Oʻchirish"
                          className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="size-4" strokeWidth={1.9} />
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
