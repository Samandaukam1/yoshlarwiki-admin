"use client";

import {
  Check,
  ChevronUp,
  Loader2,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useActionState, useId, useRef, useState } from "react";

import { saveAbout } from "./actions";
import { formatAmount, type AboutContent } from "./types";
import { idleSettings } from "../seo/types";
import { btn, Card, CardTitle, Field, inputClass, textareaClass } from "@/components/ui";

type Rule = { id: number; text: string };

export function AboutForm({
  about,
  telegram,
  instagram,
  disabled,
}: {
  about: AboutContent;
  telegram: string;
  instagram: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveAbout, idleSettings);
  const uid = useId();
  const f = (key: string) => `${uid}-${key}`;

  const [feeEnabled, setFeeEnabled] = useState(about.fee_enabled);
  const [amount, setAmount] = useState(formatAmount(about.fee_amount));
  const [currency, setCurrency] = useState(about.fee_currency);
  const [period, setPeriod] = useState(about.fee_period);

  const nextId = useRef(about.rules.length);
  const [rules, setRules] = useState<Rule[]>(
    about.rules.map((text, id) => ({ id, text })),
  );

  const addRule = () => {
    const id = nextId.current++;
    setRules((list) => [...list, { id, text: "" }]);
    // Yangi maydonga fokus — keyingi kadrda, element paydo bo'lgach.
    requestAnimationFrame(() => {
      document.getElementById(`${uid}-rule-${id}`)?.focus();
    });
  };

  const moveRule = (index: number, delta: -1 | 1) => {
    setRules((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <form action={formAction} className="space-y-5">
      {state.status !== "idle" && state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`flex items-start gap-2.5 rounded-[10px] px-4 py-3 text-[13px] ${
            state.status === "error"
              ? "bg-danger-soft text-danger"
              : "bg-success-soft text-success"
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

      {/* -------------------------- Umumiy ma'lumot -------------------------- */}
      <Card>
        <CardTitle>Umumiy maʼlumot</CardTitle>
        <Field
          label="Sahifa boshidagi matn"
          htmlFor={f("intro")}
          hint="Yangi xatboshi uchun bitta boʻsh qator qoldiring."
        >
          <textarea
            id={f("intro")}
            name="intro"
            rows={6}
            required
            disabled={disabled}
            defaultValue={about.intro}
            className={textareaClass}
          />
        </Field>
      </Card>

      {/* --------------------------- Badal to'lovi --------------------------- */}
      <Card>
        <CardTitle
          action={
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-ink-2">
              <span className="relative inline-flex">
                <input
                  type="checkbox"
                  name="fee_enabled"
                  checked={feeEnabled}
                  disabled={disabled}
                  onChange={(event) => setFeeEnabled(event.target.checked)}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-line-strong transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40" />
                <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </span>
              Saytda koʻrsatish
            </label>
          }
        >
          Badal toʻlovi
        </CardTitle>

        <div className={`grid gap-5 sm:grid-cols-2 ${feeEnabled ? "" : "opacity-55"}`}>
          <Field label="Sarlavha" htmlFor={f("fee_title")}>
            <input
              id={f("fee_title")}
              name="fee_title"
              disabled={disabled}
              defaultValue={about.fee_title}
              placeholder="Badal toʻlovi"
              className={inputClass}
            />
          </Field>

          <Field
            label="Narx"
            htmlFor={f("fee_amount")}
            hint="Faqat raqam. Boʻsh qoldirilsa narx koʻrsatilmaydi."
          >
            <input
              id={f("fee_amount")}
              name="fee_amount"
              inputMode="numeric"
              autoComplete="off"
              disabled={disabled}
              value={amount}
              onChange={(event) => setAmount(formatAmount(event.target.value))}
              placeholder="150 000"
              className={`${inputClass} tabular-nums`}
            />
          </Field>

          <Field label="Valyuta" htmlFor={f("fee_currency")}>
            <input
              id={f("fee_currency")}
              name="fee_currency"
              disabled={disabled}
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              placeholder="soʻm"
              className={inputClass}
            />
          </Field>

          <Field
            label="Narx yonidagi belgi"
            htmlFor={f("fee_period")}
            hint="Masalan: bir martalik, yillik. Ixtiyoriy."
          >
            <input
              id={f("fee_period")}
              name="fee_period"
              disabled={disabled}
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder="bir martalik"
              className={inputClass}
            />
          </Field>

          <Field
            label="Tavsif"
            htmlFor={f("fee_description")}
            hint="Toʻlov nima uchun va qanday amalga oshirilishi haqida."
            className="sm:col-span-2"
          >
            <textarea
              id={f("fee_description")}
              name="fee_description"
              rows={4}
              disabled={disabled}
              defaultValue={about.fee_description}
              className={textareaClass}
            />
          </Field>
        </div>

        {/* Saytdagi ko'rinish */}
        <div className="mt-5 rounded-[12px] border border-dashed border-line-strong bg-surface-2 px-4 py-3.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">
            Saytda shunday koʻrinadi
          </p>
          {feeEnabled ? (
            amount ? (
              <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-[28px] font-extrabold leading-none tracking-[-0.03em] text-accent-text tabular-nums">
                  {amount}
                </span>
                <span className="text-[14px] font-semibold text-ink">{currency || "soʻm"}</span>
                {period ? (
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-soft-fg">
                    {period}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="mt-2 text-[13px] text-ink-2">
                Narx kiritilmagan — faqat sarlavha va tavsif koʻrsatiladi.
              </p>
            )
          ) : (
            <p className="mt-2 text-[13px] text-ink-2">Badal toʻlovi bloki yashirilgan.</p>
          )}
        </div>
      </Card>

      {/* ------------------------------ Qoidalar ----------------------------- */}
      <Card>
        <CardTitle>Qoidalar</CardTitle>

        <Field label="Boʻlim sarlavhasi" htmlFor={f("rules_title")}>
          <input
            id={f("rules_title")}
            name="rules_title"
            disabled={disabled}
            defaultValue={about.rules_title}
            placeholder="Qoidalar"
            className={inputClass}
          />
        </Field>

        <ol className="mt-5 space-y-2.5">
          {rules.map((rule, index) => (
            <li key={rule.id} className="flex items-start gap-2">
              <span className="mt-2.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-fg tabular-nums">
                {index + 1}
              </span>
              <textarea
                id={`${uid}-rule-${rule.id}`}
                name="rules"
                rows={2}
                disabled={disabled}
                value={rule.text}
                onChange={(event) =>
                  setRules((list) =>
                    list.map((item) =>
                      item.id === rule.id ? { ...item, text: event.target.value } : item,
                    ),
                  )
                }
                aria-label={`${index + 1}-qoida`}
                placeholder="Qoida matni…"
                className={`${textareaClass} min-h-11 flex-1 resize-y py-2.5`}
              />
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => moveRule(index, -1)}
                  aria-label="Yuqoriga"
                  title="Yuqoriga"
                  className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-hover hover:text-ink disabled:opacity-30"
                >
                  <ChevronUp className="size-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    setRules((list) => list.filter((item) => item.id !== rule.id))
                  }
                  aria-label="Qoidani oʻchirish"
                  title="Oʻchirish"
                  className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="size-4" strokeWidth={1.9} />
                </button>
              </div>
            </li>
          ))}
        </ol>

        {rules.length === 0 ? (
          <p className="mt-4 text-[13px] text-ink-3">
            Qoida yoʻq — saytda bu boʻlim koʻrsatilmaydi.
          </p>
        ) : null}

        <button
          type="button"
          disabled={disabled}
          onClick={addRule}
          className={btn("secondary", "sm", "mt-4")}
        >
          <Plus className="size-4" strokeWidth={2} />
          Qoida qoʻshish
        </button>
      </Card>

      {/* ------------------------- Ijtimoiy tarmoqlar ------------------------ */}
      <Card>
        <CardTitle>Ijtimoiy tarmoqlar</CardTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Telegram"
            htmlFor={f("telegram")}
            hint="Havola yoki @username."
          >
            <input
              id={f("telegram")}
              name="telegram"
              disabled={disabled}
              defaultValue={telegram}
              placeholder="https://t.me/yoshlarwiki"
              className={inputClass}
            />
          </Field>
          <Field
            label="Instagram"
            htmlFor={f("instagram")}
            hint="Havola yoki @username."
          >
            <input
              id={f("instagram")}
              name="instagram"
              disabled={disabled}
              defaultValue={instagram}
              placeholder="https://instagram.com/yoshlarwiki"
              className={inputClass}
            />
          </Field>
        </div>
        <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
          Bu havolalar “Sozlamalar → Aloqa maʼlumotlari” bilan bir xil — bir
          joyda oʻzgartirilsa, ikkinchisida ham yangilanadi.
        </p>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="submit"
          disabled={disabled || pending}
          className={btn("primary", "md", "shadow-yw-lg")}
        >
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
