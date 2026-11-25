"use client";

import { Check, Loader2, Save, TriangleAlert } from "lucide-react";
import { useActionState, useId, useState } from "react";

import { saveCandidate } from "../actions";
import { idleCms } from "../types";
import {
  btn,
  Card,
  CardTitle,
  Field,
  inputClass,
  textareaClass,
} from "@/components/ui";
import { slugify } from "@/lib/constants";

type Option = { id: string; name: string };

export type CandidateFormValues = {
  id: string;
  full_name: string;
  slug: string;
  title: string | null;
  intro: string | null;
  about: string | null;
  portrait_url: string | null;
  portrait_alt: string | null;
  video_url: string | null;
  birth_date: string | null;
  birth_place: string | null;
  specialization: string | null;
  direction: string | null;
  activity_field: string | null;
  region_id: string | null;
  primary_category_id: string | null;
  years_experience: number | null;
  projects_count: number | null;
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  keywords: string[];
  no_index: boolean;
};

export function CandidateEditForm({
  candidate,
  regions,
  categories,
  disabled,
}: {
  candidate: CandidateFormValues;
  regions: Option[];
  categories: Option[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveCandidate, idleCms);
  const [slug, setSlug] = useState(candidate.slug);
  const [fullName, setFullName] = useState(candidate.full_name);
  const id = useId();
  const f = (name: string) => `${id}-${name}`;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={candidate.id} />

      {/* Saqlash paneli */}
      <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0 text-[13px]">
          {state.status === "error" ? (
            <span role="alert" className="flex items-center gap-2 text-danger">
              <TriangleAlert className="size-4 shrink-0" strokeWidth={2} />
              {state.message}
            </span>
          ) : state.status === "success" ? (
            <span role="status" className="flex items-center gap-2 text-success">
              <Check className="size-4 shrink-0" strokeWidth={2.4} />
              {state.message}
            </span>
          ) : (
            <span className="text-ink-3">Oʻzgarishlarni saqlashni unutmang.</span>
          )}
        </div>
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

      {/* Asosiy ma'lumot */}
      <Card>
        <CardTitle>Asosiy maʼlumot</CardTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ism familiya" htmlFor={f("name")}>
            <input
              id={f("name")}
              name="full_name"
              required
              disabled={disabled}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Havola (slug)"
            htmlFor={f("slug")}
            hint={`/yoshlar/${slug || slugify(fullName) || "…"}`}
          >
            <input
              id={f("slug")}
              name="slug"
              disabled={disabled}
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Kasb / lavozim" htmlFor={f("title")} className="sm:col-span-2">
            <input
              id={f("title")}
              name="title"
              disabled={disabled}
              defaultValue={candidate.title ?? ""}
              placeholder="Dasturchi, Startap asoschisi"
              className={inputClass}
            />
          </Field>

          <Field
            label="Qisqa tanishtiruv"
            htmlFor={f("intro")}
            hint="Profil sarlavhasi ostida chiqadi."
            className="sm:col-span-2"
          >
            <textarea
              id={f("intro")}
              name="intro"
              rows={3}
              disabled={disabled}
              defaultValue={candidate.intro ?? ""}
              className={textareaClass}
            />
          </Field>

          <Field
            label="Men haqimda"
            htmlFor={f("about")}
            hint="Profildagi kengaytirilgan matn."
            className="sm:col-span-2"
          >
            <textarea
              id={f("about")}
              name="about"
              rows={5}
              disabled={disabled}
              defaultValue={candidate.about ?? ""}
              className={textareaClass}
            />
          </Field>
        </div>
      </Card>

      {/* Portret va video */}
      <Card>
        <CardTitle>Portret va video</CardTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Portret havolasi"
            htmlFor={f("portrait")}
            hint="Media boʻlimidan yuklab, havolani shu yerga qoʻying."
            className="sm:col-span-2"
          >
            <input
              id={f("portrait")}
              name="portrait_url"
              type="url"
              disabled={disabled}
              defaultValue={candidate.portrait_url ?? ""}
              placeholder="https://…/portraits/…"
              className={inputClass}
            />
          </Field>

          <Field label="Portret alt matni" htmlFor={f("alt")}>
            <input
              id={f("alt")}
              name="portrait_alt"
              disabled={disabled}
              defaultValue={candidate.portrait_alt ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Video havolasi" htmlFor={f("video")} hint="YouTube yoki Vimeo">
            <input
              id={f("video")}
              name="video_url"
              type="url"
              disabled={disabled}
              defaultValue={candidate.video_url ?? ""}
              placeholder="https://youtube.com/watch?v=…"
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      {/* Profil faktlari */}
      <Card>
        <CardTitle>Profil maʼlumotlari</CardTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tugʻilgan sana" htmlFor={f("birth")}>
            <input
              id={f("birth")}
              name="birth_date"
              type="date"
              disabled={disabled}
              defaultValue={candidate.birth_date ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Tugʻilgan joy" htmlFor={f("place")}>
            <input
              id={f("place")}
              name="birth_place"
              disabled={disabled}
              defaultValue={candidate.birth_place ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Mutaxassisligi" htmlFor={f("spec")}>
            <input
              id={f("spec")}
              name="specialization"
              disabled={disabled}
              defaultValue={candidate.specialization ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Yoʻnalishi" htmlFor={f("dir")}>
            <input
              id={f("dir")}
              name="direction"
              disabled={disabled}
              defaultValue={candidate.direction ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Faoliyat sohasi" htmlFor={f("field")}>
            <input
              id={f("field")}
              name="activity_field"
              disabled={disabled}
              defaultValue={candidate.activity_field ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Hudud" htmlFor={f("region")}>
            <select
              id={f("region")}
              name="region_id"
              disabled={disabled}
              defaultValue={candidate.region_id ?? ""}
              className={inputClass}
            >
              <option value="">Tanlanmagan</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Asosiy kategoriya" htmlFor={f("cat")}>
            <select
              id={f("cat")}
              name="primary_category_id"
              disabled={disabled}
              defaultValue={candidate.primary_category_id ?? ""}
              className={inputClass}
            >
              <option value="">Tanlanmagan</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Yillik tajriba" htmlFor={f("years")}>
            <input
              id={f("years")}
              name="years_experience"
              type="number"
              min={0}
              max={99}
              disabled={disabled}
              defaultValue={candidate.years_experience ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Tugallangan loyihalar" htmlFor={f("projects")}>
            <input
              id={f("projects")}
              name="projects_count"
              type="number"
              min={0}
              max={9999}
              disabled={disabled}
              defaultValue={candidate.projects_count ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Tartib raqami" htmlFor={f("sort")} hint="Kichik raqam yuqorida turadi.">
            <input
              id={f("sort")}
              name="sort_order"
              type="number"
              disabled={disabled}
              defaultValue={candidate.sort_order}
              className={inputClass}
            />
          </Field>

          <label className="flex items-center gap-3 self-end pb-2 text-[13.5px] text-ink">
            <input
              type="checkbox"
              name="is_featured"
              disabled={disabled}
              defaultChecked={candidate.is_featured}
              className="size-4 accent-[var(--yw-accent)]"
            />
            Tanlanganlar roʻyxatida koʻrsatilsin
          </label>
        </div>
      </Card>

      {/* SEO */}
      <Card>
        <CardTitle>SEO</CardTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="SEO sarlavha" htmlFor={f("seotitle")} className="sm:col-span-2">
            <input
              id={f("seotitle")}
              name="seo_title"
              disabled={disabled}
              defaultValue={candidate.seo_title ?? ""}
              placeholder="Boʻsh qoldirilsa ism va kasbdan hosil qilinadi"
              className={inputClass}
            />
          </Field>

          <Field
            label="Meta tavsif"
            htmlFor={f("seodesc")}
            hint="150–160 belgi tavsiya etiladi."
            className="sm:col-span-2"
          >
            <textarea
              id={f("seodesc")}
              name="seo_description"
              rows={2}
              disabled={disabled}
              defaultValue={candidate.seo_description ?? ""}
              className={textareaClass}
            />
          </Field>

          <Field label="Open Graph sarlavha" htmlFor={f("ogtitle")}>
            <input
              id={f("ogtitle")}
              name="og_title"
              disabled={disabled}
              defaultValue={candidate.og_title ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Open Graph rasm havolasi" htmlFor={f("ogimg")}>
            <input
              id={f("ogimg")}
              name="og_image_url"
              type="url"
              disabled={disabled}
              defaultValue={candidate.og_image_url ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Open Graph tavsif" htmlFor={f("ogdesc")} className="sm:col-span-2">
            <textarea
              id={f("ogdesc")}
              name="og_description"
              rows={2}
              disabled={disabled}
              defaultValue={candidate.og_description ?? ""}
              className={textareaClass}
            />
          </Field>

          <Field label="Canonical havola" htmlFor={f("canon")}>
            <input
              id={f("canon")}
              name="canonical_url"
              disabled={disabled}
              defaultValue={candidate.canonical_url ?? ""}
              placeholder="Odatda boʻsh qoldiriladi"
              className={inputClass}
            />
          </Field>

          <Field
            label="Kalit soʻzlar"
            htmlFor={f("kw")}
            hint="Vergul bilan ajrating."
          >
            <input
              id={f("kw")}
              name="keywords"
              disabled={disabled}
              defaultValue={candidate.keywords.join(", ")}
              className={inputClass}
            />
          </Field>

          <label className="flex items-center gap-3 text-[13.5px] text-ink sm:col-span-2">
            <input
              type="checkbox"
              name="no_index"
              disabled={disabled}
              defaultChecked={candidate.no_index}
              className="size-4 accent-[var(--yw-accent)]"
            />
            Qidiruv tizimlariga indekslashni taqiqlash (noindex)
          </label>
        </div>
      </Card>
    </form>
  );
}
