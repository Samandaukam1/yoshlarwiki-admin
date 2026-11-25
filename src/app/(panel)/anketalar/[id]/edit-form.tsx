"use client";

import { GraduationCap, Loader2, Pencil, Plus, Save, Trash2, Trophy, UserRound } from "lucide-react";
import { useActionState, useId, useState } from "react";

import { saveAnketaEdits } from "../actions";
import { Feedback } from "../../bot/forms";
import { idleBot } from "../../bot/types";
import { btn, Field, inputClass, textareaClass } from "@/components/ui";
import type { AchievementItem, AnketaAnswers, ExperienceItem, ProjectItem } from "@/lib/anketa";
import { achievementLine, educationLine } from "@/lib/post-text";

/**
 * Anketa ma'lumotlarini tahrirlash. Saqlanganda profil yangilanadi,
 * profil saytda bo'lsa — kanaldagi post ham avtomatik yangilanadi.
 */
export function AnketaEditForm({ id, initial, published }: { id: string; initial: AnketaAnswers; published: boolean }) {
  const [a, setA] = useState<AnketaAnswers>(initial);
  const [state, action, pending] = useActionState(saveAnketaEdits, idleBot);
  const uid = useId();
  const f = (name: string) => `${uid}-${name}`;

  const set = <K extends keyof AnketaAnswers>(key: K, value: AnketaAnswers[K]) => setA((prev) => ({ ...prev, [key]: value }));

  const postStudy = educationLine(a) || a.activity.trim();
  const postAchievement = achievementLine({ ...a, skipped: a.skipped.filter((k) => k !== "achievements") });

  return (
    <details className="group rounded-card border border-line bg-surface open:border-accent">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-soft-fg">
          <Pencil className="size-[18px]" strokeWidth={1.9} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-ink">Maʼlumotlarni tahrirlash</span>
          <span className="block text-[12.5px] text-ink-2">
            {published
              ? "Saqlanganda saytdagi profil va kanaldagi post avtomatik yangilanadi."
              : "Saqlanganda chop etiladigan profil va post shu maʼlumotlardan tuziladi."}
          </span>
        </span>
      </summary>

      <form action={action} className="grid gap-5 border-t border-line p-5">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="answers" value={JSON.stringify(a)} />

        {/* Postda nima chiqadi */}
        <div className="grid gap-2 rounded-[10px] bg-surface-2 p-4 text-[13px]">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">Telegram post rasmida</p>
          <PostLine icon={UserRound} text={a.full_name} />
          <PostLine icon={GraduationCap} text={postStudy} />
          <PostLine icon={Trophy} text={postAchievement} empty="Yutuq yoʻq — 3-quti chiqmaydi" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="F.I.Sh" htmlFor={f("name")} className="sm:col-span-2">
            <input id={f("name")} value={a.full_name} onChange={(e) => set("full_name", e.target.value)} className={inputClass} required />
          </Field>
          <Field label="Telefon" htmlFor={f("phone")}>
            <input id={f("phone")} value={a.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+998 90 123 45 67" className={inputClass} />
          </Field>
          <Field label="Telegram" htmlFor={f("tg")}>
            <input id={f("tg")} value={a.telegram} onChange={(e) => set("telegram", e.target.value)} placeholder="@username" className={inputClass} />
          </Field>
          <Field label="Instagram" htmlFor={f("ig")}>
            <input id={f("ig")} value={a.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@username" className={inputClass} />
          </Field>
          <Field label="Tugʻilgan sana" htmlFor={f("bd")}>
            <input id={f("bd")} type="date" value={a.birth_date} onChange={(e) => set("birth_date", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Tugʻilgan joy" htmlFor={f("bp")} className="sm:col-span-2">
            <input id={f("bp")} value={a.birth_place} onChange={(e) => set("birth_place", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Hozirgi faoliyati" htmlFor={f("act")} className="sm:col-span-2">
            <input id={f("act")} value={a.activity} onChange={(e) => set("activity", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Oʻzi haqida" htmlFor={f("about")} className="sm:col-span-2">
            <textarea id={f("about")} rows={5} value={a.about} onChange={(e) => set("about", e.target.value)} className={textareaClass} />
          </Field>
          <Field label="Oʻqish joyi" htmlFor={f("sp")}>
            <input id={f("sp")} value={a.study_place} onChange={(e) => set("study_place", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Yoʻnalishi" htmlFor={f("sd")}>
            <input id={f("sd")} value={a.study_direction} onChange={(e) => set("study_direction", e.target.value)} className={inputClass} />
          </Field>
        </div>

        <ListEditor<AchievementItem>
          title="Yutuqlar"
          items={a.achievements}
          onChange={(v) => set("achievements", v)}
          blank={{ title: "", year: "" }}
          render={(item, update) => (
            <div className="grid gap-2 sm:grid-cols-[1fr_96px]">
              <input value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} placeholder="Yutuq" className={inputClass} />
              <input value={item.year} onChange={(e) => update({ ...item, year: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="Yil" className={inputClass} />
            </div>
          )}
        />

        <ListEditor<ExperienceItem>
          title="Tajriba"
          items={a.experience}
          onChange={(v) => set("experience", v)}
          blank={{ year: "", title: "", description: "" }}
          render={(item, update) => (
            <div className="grid gap-2">
              <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
                <input value={item.year} onChange={(e) => update({ ...item, year: e.target.value })} placeholder="Yil(lar)" className={inputClass} />
                <input value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} placeholder="Lavozim / joy" className={inputClass} />
              </div>
              <textarea rows={2} value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} placeholder="Qisqa tavsif" className={textareaClass} />
            </div>
          )}
        />

        <ListEditor<ProjectItem>
          title="Loyihalar"
          items={a.projects}
          onChange={(v) => set("projects", v)}
          blank={{ title: "", url: "", description: "" }}
          render={(item, update) => (
            <div className="grid gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} placeholder="Nomi" className={inputClass} />
                <input value={item.url} onChange={(e) => update({ ...item, url: e.target.value })} placeholder="Havola (ixtiyoriy)" className={inputClass} />
              </div>
              <textarea rows={2} value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} placeholder="Qisqa tavsif" className={textareaClass} />
            </div>
          )}
        />

        <Field label="Qoʻshimcha maʼlumotlar" htmlFor={f("extra")}>
          <textarea id={f("extra")} rows={3} value={a.extra} onChange={(e) => set("extra", e.target.value)} className={textareaClass} />
        </Field>

        <div className="flex flex-wrap items-center gap-2.5">
          <button type="submit" disabled={pending} className={btn("primary")}>
            {pending ? <Loader2 className="size-[18px] animate-spin" /> : <Save className="size-[18px]" />}
            {pending && published ? "Saqlanmoqda, post yangilanmoqda…" : "Saqlash"}
          </button>
          <button type="button" disabled={pending} onClick={() => setA(initial)} className={btn("ghost")}>
            Bekor qilish
          </button>
        </div>
        <Feedback state={state} />
      </form>
    </details>
  );
}

function PostLine({ icon: Icon, text, empty = "—" }: { icon: typeof UserRound; text: string; empty?: string }) {
  return (
    <p className="flex items-start gap-2.5 text-ink-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-accent-text" strokeWidth={1.9} />
      {text.trim() ? <span className="font-semibold text-ink">{text}</span> : <span className="text-ink-3">{empty}</span>}
    </p>
  );
}

function ListEditor<T>({
  title,
  items,
  onChange,
  blank,
  render,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  render: (item: T, update: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      <ul className="mt-2 grid gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">{render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}</div>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className={btn("ghost", "sm", "mt-1 px-2.5 text-danger")}
              aria-label="Oʻchirish"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      {items.length < 15 ? (
        <button type="button" onClick={() => onChange([...items, blank])} className={btn("secondary", "sm", "mt-2.5")}>
          <Plus className="size-4" /> Qoʻshish
        </button>
      ) : null}
    </div>
  );
}
