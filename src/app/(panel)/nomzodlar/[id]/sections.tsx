"use client";

import { Check, Loader2, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useActionState } from "react";

import {
  addSectionItem,
  deleteSectionItem,
  setCandidateCategories,
  setCandidateStatus,
} from "../actions";
import { idleCms } from "../types";
import { btn, Card, CardTitle, inputClass, textareaClass } from "@/components/ui";
import {
  CANDIDATE_STATUSES,
  CANDIDATE_STATUS_LABELS,
  EDUCATION_LEVELS,
  SOCIAL_PLATFORMS,
  type CandidateStatus,
} from "@/lib/constants";

function Feedback({ status, message }: { status: string; message: string }) {
  if (status === "idle" || !message) return null;
  const error = status === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mt-3 flex items-start gap-2 rounded-[10px] px-3.5 py-2.5 text-[13px] ${
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

function DeleteButton({
  table,
  id,
  candidateId,
  disabled,
}: {
  table: string;
  id: string;
  candidateId: string;
  disabled: boolean;
}) {
  return (
    <form action={deleteSectionItem}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="candidate_id" value={candidateId} />
      <button
        type="submit"
        disabled={disabled}
        aria-label="Oʻchirish"
        className="grid size-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-40"
      >
        <Trash2 className="size-4" strokeWidth={1.9} />
      </button>
    </form>
  );
}

function AddButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" disabled={pending} className={btn("secondary", "sm")}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Qoʻshilmoqda…
        </>
      ) : (
        <>
          <Plus className="size-4" strokeWidth={2.2} />
          {label}
        </>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Holat boshqaruvi                                                   */
/* ------------------------------------------------------------------ */

export function StatusControls({
  candidateId,
  current,
  disabled,
}: {
  candidateId: string;
  current: CandidateStatus;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(setCandidateStatus, idleCms);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={candidateId} />
      <div className="flex flex-wrap gap-2">
        {CANDIDATE_STATUSES.map((status) => {
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
              {CANDIDATE_STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
      <Feedback status={state.status} message={state.message} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Kategoriyalar                                                      */
/* ------------------------------------------------------------------ */

export function CategoryPicker({
  candidateId,
  categories,
  selected,
  disabled,
}: {
  candidateId: string;
  categories: { id: string; name: string }[];
  selected: string[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(setCandidateCategories, idleCms);

  return (
    <Card>
      <CardTitle>Kategoriyalar</CardTitle>
      <form action={formAction}>
        <input type="hidden" name="candidate_id" value={candidateId} />
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] text-ink-2 transition-colors hover:border-line-strong has-checked:border-accent has-checked:bg-accent-soft has-checked:text-accent-soft-fg"
            >
              <input
                type="checkbox"
                name="category_ids"
                value={category.id}
                defaultChecked={selected.includes(category.id)}
                disabled={disabled}
                className="sr-only"
              />
              {category.name}
            </label>
          ))}
        </div>
        <button type="submit" disabled={disabled || pending} className={btn("secondary", "sm", "mt-4")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Kategoriyalarni saqlash
        </button>
        <Feedback status={state.status} message={state.message} />
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Ta'lim                                                             */
/* ------------------------------------------------------------------ */

type EducationRow = {
  id: string;
  institution: string;
  degree: string | null;
  level: string | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
};

export function EducationSection({
  candidateId,
  items,
  disabled,
}: {
  candidateId: string;
  items: EducationRow[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(addSectionItem, idleCms);

  return (
    <Card>
      <CardTitle>Taʼlimi</CardTitle>

      {items.length > 0 ? (
        <ul className="mb-5 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-[10px] border border-line px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">{item.institution}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-2">
                  {[item.degree, item.start_year && `${item.start_year} — ${item.is_current ? "hozir" : item.end_year ?? "…"}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <DeleteButton
                table="candidate_education"
                id={item.id}
                candidateId={candidateId}
                disabled={disabled}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="table" value="candidate_education" />
        <input type="hidden" name="candidate_id" value={candidateId} />
        <input type="hidden" name="sort_order" value={items.length + 1} />

        <input
          name="institution"
          required
          disabled={disabled}
          placeholder="Oʻquv muassasasi"
          aria-label="Oʻquv muassasasi"
          className={`${inputClass} sm:col-span-2`}
        />
        <input
          name="degree"
          disabled={disabled}
          placeholder="Yoʻnalish (Dasturiy injiniring)"
          aria-label="Yoʻnalish"
          className={inputClass}
        />
        <select name="level" disabled={disabled} aria-label="Daraja" className={inputClass}>
          <option value="">Daraja tanlanmagan</option>
          {EDUCATION_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
        <input
          name="start_year"
          type="number"
          min={1900}
          max={2200}
          disabled={disabled}
          placeholder="Boshlangan yil"
          aria-label="Boshlangan yil"
          className={inputClass}
        />
        <input
          name="end_year"
          type="number"
          min={1900}
          max={2200}
          disabled={disabled}
          placeholder="Tugagan yil"
          aria-label="Tugagan yil"
          className={inputClass}
        />
        <label className="flex items-center gap-2.5 text-[13px] text-ink sm:col-span-2">
          <input
            type="checkbox"
            name="is_current"
            disabled={disabled}
            className="size-4 accent-[var(--yw-accent)]"
          />
          Hozir oʻqimoqda
        </label>
        <div className="sm:col-span-2">
          <AddButton pending={pending} label="Taʼlim qoʻshish" />
          <Feedback status={state.status} message={state.message} />
        </div>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Faoliyat yo'li                                                     */
/* ------------------------------------------------------------------ */

type ExperienceRow = {
  id: string;
  year_label: string;
  title: string;
  subtitle: string | null;
};

export function ExperienceSection({
  candidateId,
  items,
  disabled,
}: {
  candidateId: string;
  items: ExperienceRow[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(addSectionItem, idleCms);

  return (
    <Card>
      <CardTitle>Faoliyat yoʻli</CardTitle>

      {items.length > 0 ? (
        <ul className="mb-5 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-[10px] border border-line px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">
                  <span className="mr-2 text-accent-text">{item.year_label}</span>
                  {item.title}
                </p>
                {item.subtitle ? (
                  <p className="mt-0.5 text-[12.5px] text-ink-2">{item.subtitle}</p>
                ) : null}
              </div>
              <DeleteButton
                table="candidate_experience"
                id={item.id}
                candidateId={candidateId}
                disabled={disabled}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <form action={formAction} className="grid gap-3 sm:grid-cols-[110px_1fr]">
        <input type="hidden" name="table" value="candidate_experience" />
        <input type="hidden" name="candidate_id" value={candidateId} />
        <input type="hidden" name="sort_order" value={items.length + 1} />

        <input
          name="year_label"
          required
          disabled={disabled}
          placeholder="2023"
          aria-label="Yil"
          className={inputClass}
        />
        <input
          name="title"
          required
          disabled={disabled}
          placeholder="Tashkilot yoki lavozim"
          aria-label="Nomi"
          className={inputClass}
        />
        <input
          name="subtitle"
          disabled={disabled}
          placeholder="Qisqacha izoh (Asoschi va CEO)"
          aria-label="Izoh"
          className={`${inputClass} sm:col-span-2`}
        />
        <div className="sm:col-span-2">
          <AddButton pending={pending} label="Bosqich qoʻshish" />
          <Feedback status={state.status} message={state.message} />
        </div>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Yutuqlar                                                           */
/* ------------------------------------------------------------------ */

export function AchievementsSection({
  candidateId,
  items,
  disabled,
}: {
  candidateId: string;
  items: { id: string; title: string; year: number | null }[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(addSectionItem, idleCms);

  return (
    <Card>
      <CardTitle>Yutuqlari</CardTitle>

      {items.length > 0 ? (
        <ul className="mb-5 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-line px-4 py-3"
            >
              <p className="min-w-0 text-[13.5px] text-ink">{item.title}</p>
              <DeleteButton
                table="candidate_achievements"
                id={item.id}
                candidateId={candidateId}
                disabled={disabled}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <input type="hidden" name="table" value="candidate_achievements" />
        <input type="hidden" name="candidate_id" value={candidateId} />
        <input type="hidden" name="sort_order" value={items.length + 1} />

        <input
          name="title"
          required
          disabled={disabled}
          placeholder="Yutuq nomi va yili"
          aria-label="Yutuq nomi"
          className={inputClass}
        />
        <input
          name="year"
          type="number"
          min={1900}
          max={2200}
          disabled={disabled}
          placeholder="Yil"
          aria-label="Yil"
          className={inputClass}
        />
        <div className="sm:col-span-2">
          <AddButton pending={pending} label="Yutuq qoʻshish" />
          <Feedback status={state.status} message={state.message} />
        </div>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Loyihalar                                                          */
/* ------------------------------------------------------------------ */

export function ProjectsSection({
  candidateId,
  items,
  disabled,
}: {
  candidateId: string;
  items: {
    id: string;
    title: string;
    description: string | null;
    url: string | null;
  }[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(addSectionItem, idleCms);

  return (
    <Card>
      <CardTitle>Loyihalari</CardTitle>

      {items.length > 0 ? (
        <ul className="mb-5 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-[10px] border border-line px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-[12.5px] text-ink-2">{item.description}</p>
                ) : null}
              </div>
              <DeleteButton
                table="candidate_projects"
                id={item.id}
                candidateId={candidateId}
                disabled={disabled}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="table" value="candidate_projects" />
        <input type="hidden" name="candidate_id" value={candidateId} />
        <input type="hidden" name="sort_order" value={items.length + 1} />

        <input
          name="title"
          required
          disabled={disabled}
          placeholder="Loyiha nomi"
          aria-label="Loyiha nomi"
          className={inputClass}
        />
        <input
          name="url"
          type="url"
          disabled={disabled}
          placeholder="https://loyiha.uz"
          aria-label="Loyiha havolasi"
          className={inputClass}
        />
        <input
          name="image_url"
          type="url"
          disabled={disabled}
          placeholder="Rasm havolasi"
          aria-label="Rasm havolasi"
          className={`${inputClass} sm:col-span-2`}
        />
        <textarea
          name="description"
          rows={2}
          disabled={disabled}
          placeholder="Qisqa tavsif"
          aria-label="Tavsif"
          className={`${textareaClass} sm:col-span-2`}
        />
        <div className="sm:col-span-2">
          <AddButton pending={pending} label="Loyiha qoʻshish" />
          <Feedback status={state.status} message={state.message} />
        </div>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Ijtimoiy havolalar                                                 */
/* ------------------------------------------------------------------ */

export function SocialSection({
  candidateId,
  items,
  disabled,
}: {
  candidateId: string;
  items: { id: string; platform: string; url: string }[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(addSectionItem, idleCms);

  return (
    <Card>
      <CardTitle>Ijtimoiy tarmoqlar</CardTitle>

      {items.length > 0 ? (
        <ul className="mb-5 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-line px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold capitalize text-ink">
                  {item.platform}
                </p>
                <p className="truncate text-[12.5px] text-ink-2">{item.url}</p>
              </div>
              <DeleteButton
                table="candidate_social_links"
                id={item.id}
                candidateId={candidateId}
                disabled={disabled}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <form action={formAction} className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <input type="hidden" name="table" value="candidate_social_links" />
        <input type="hidden" name="candidate_id" value={candidateId} />
        <input type="hidden" name="sort_order" value={items.length + 1} />

        <select name="platform" required disabled={disabled} aria-label="Platforma" className={inputClass}>
          {SOCIAL_PLATFORMS.map((platform) => (
            <option key={platform.value} value={platform.value}>
              {platform.label}
            </option>
          ))}
        </select>
        <input
          name="url"
          type="url"
          required
          disabled={disabled}
          placeholder="https://t.me/username"
          aria-label="Havola"
          className={inputClass}
        />
        <div className="sm:col-span-2">
          <AddButton pending={pending} label="Havola qoʻshish" />
          <Feedback status={state.status} message={state.message} />
        </div>
      </form>
    </Card>
  );
}
