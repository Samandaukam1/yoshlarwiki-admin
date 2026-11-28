"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  CloudUpload,
  Copy,
  ImagePlus,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { confirmPhoto, createPhotoUpload, saveDraft, submitAnketa } from "./actions";
import { YoshlarWikiLogo } from "../../../../components/brand/YoshlarWikiLogo";
import { ThemeToggle } from "@/components/theme";
import { btn, inputClass, textareaClass } from "@/components/ui";
import { GenderIcon } from "@/components/gender-icon";
import {
  GENDER_CLASS,
  normalizePhone,
  STEPS,
  stepFilled,
  type AnketaAnswers,
  type StepKey,
} from "@/lib/anketa";
import { checkPromptPortrait } from "@/lib/portrait-check";
import { processPortrait } from "@/lib/remove-bg";
import { createClient } from "@/lib/supabase/client";

type SaveState = "idle" | "saving" | "saved" | "error";

export function AnketaForm({
  token,
  fullName,
  gender,
  initialAnswers,
  initialStep,
  initialPhoto,
  expiresAt,
  prompt,
}: {
  token: string;
  fullName: string;
  gender: "erkak" | "ayol";
  initialAnswers: AnketaAnswers;
  initialStep: number;
  initialPhoto: string | null;
  expiresAt: string;
  prompt: string;
}) {
  const [answers, setAnswers] = useState<AnketaAnswers>(initialAnswers);
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), STEPS.length - 1));
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const firstRender = useRef(true);
  const topRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];

  /* ---------------- Avtomatik saqlash (admin jonli ko'radi) ---------------- */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (done) return;
    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await saveDraft(token, answers, step);
        if (!res.ok && res.message.startsWith("Havola")) setExpired(true);
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [answers, step, token, done]);

  const update = useCallback(<K extends keyof AnketaAnswers>(key: K, value: AnketaAnswers[K], stepKey?: StepKey) => {
    setError("");
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
      skipped: stepKey ? prev.skipped.filter((k) => k !== stepKey) : prev.skipped,
    }));
  }, []);

  const go = (next: number) => {
    setError("");
    setStep(Math.min(Math.max(next, 0), STEPS.length - 1));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const next = () => {
    if (current.key === "photo" && !photo) {
      setError("Davom etish uchun profil rasmingizni yuklang.");
      return;
    }
    if (!stepFilled(current.key, answers)) {
      setError("Javob yozing yoki «Maʼlumot yoʻq» tugmasini bosing.");
      return;
    }
    go(step + 1);
  };

  const skip = () => {
    setAnswers((prev) => ({
      ...prev,
      skipped: prev.skipped.includes(current.key) ? prev.skipped : [...prev.skipped, current.key],
    }));
    go(step + 1);
  };

  const submit = () => {
    setError("");
    if (answers.full_name.trim().length < 3) {
      setError("F.I.Sh ni toʻliq yozing.");
      return;
    }
    if (!normalizePhone(answers.phone)) {
      setError("Telefon raqamingizni toʻgʻri kiriting: +998 XX XXX XX XX");
      return;
    }
    if (!photo) {
      setError("Profil rasmi yuklanmagan.");
      go(0);
      return;
    }
    startSubmit(async () => {
      const res = await submitAnketa(token, answers);
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.message);
        if (res.message.startsWith("Havola")) setExpired(true);
      }
    });
  };

  const until = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(expiresAt));

  const isQuestion = current.key !== "photo" && current.key !== "final";
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className={`${GENDER_CLASS[gender]} relative min-h-dvh bg-bg`}>
      <div className="yw-apply-bg" aria-hidden />

      {/* Sarlavha */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[720px] items-center gap-3 px-5">
          <YoshlarWikiLogo variant="horizontal" className="h-8 w-auto" priority />
          <span className="ml-auto hidden text-[12px] text-ink-3 sm:block">
            {saveState === "saving" ? (
              "Saqlanmoqda…"
            ) : saveState === "saved" ? (
              <span className="inline-flex items-center gap-1">
                Saqlandi <Check className="size-3.5" strokeWidth={2.6} />
              </span>
            ) : (
              ""
            )}
          </span>
          <ThemeToggle />
        </div>
        {!done ? (
          <div className="h-[3px] w-full bg-line">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </header>

      <main ref={topRef} className="relative mx-auto max-w-[720px] scroll-mt-24 px-5 pb-36 pt-8 sm:pt-12">
        {expired ? (
          <Notice
            tone="danger"
            title="Havola yaroqsiz"
            text="Havola muddati tugagan yoki anketa allaqachon yuborilgan. Yangi havola uchun administratorga murojaat qiling."
          />
        ) : done ? (
          <Success name={answers.full_name} />
        ) : (
          <>
            {step === 0 ? (
              <div className="mb-8">
                <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-[12px] font-semibold text-accent-soft-fg">
                  <GenderIcon gender={gender} className="size-3.5" colored={false} /> YoshlarWiki anketasi
                </p>
                <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-[34px]">
                  Assalomu alaykum, <span className="text-accent-text">{fullName}</span>!
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  Anketani toʻgʻri va toʻliq toʻldiring — profilingiz shu maʼlumotlar asosida tayyorlanadi.
                  Havola <b className="text-ink">{until}</b> gacha amal qiladi va faqat bir marta ishlaydi.
                </p>
              </div>
            ) : null}

            <section className="rounded-panel border border-line bg-surface p-5 shadow-yw sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-accent-text">
                  {step + 1} / {STEPS.length}-savol
                </span>
                {current.optional ? (
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11.5px] font-medium text-ink-3">
                    Ixtiyoriy
                  </span>
                ) : null}
              </div>
              <h2 className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-ink sm:text-[23px]">
                {current.title}
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{current.hint}</p>

              <div className="mt-6">
                <StepBody
                  stepKey={current.key}
                  answers={answers}
                  update={update}
                  token={token}
                  photo={photo}
                  setPhoto={setPhoto}
                  prompt={prompt}
                  setError={setError}
                  jump={go}
                />
              </div>

              {error ? (
                <p role="alert" className="mt-5 flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-4 py-3 text-[13px] text-danger">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
              ) : null}
            </section>
          </>
        )}
      </main>

      {/* Pastki navigatsiya */}
      {!done && !expired ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-[720px] items-center gap-2 px-5 py-3">
            <button
              type="button"
              onClick={() => go(step - 1)}
              disabled={step === 0}
              className={btn("ghost", "md", "px-3.5")}
              aria-label="Orqaga"
            >
              <ArrowLeft className="size-[18px]" />
              <span className="hidden sm:inline">Orqaga</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              {isQuestion ? (
                <button type="button" onClick={skip} className={btn("secondary")}>
                  Maʼlumot yoʻq
                </button>
              ) : null}

              {current.key === "final" ? (
                <button type="button" onClick={submit} disabled={submitting} className={btn("primary")}>
                  {submitting ? <Loader2 className="size-[18px] animate-spin" /> : <Send className="size-[18px]" />}
                  {submitting ? "Yuborilmoqda…" : "Yuborish"}
                </button>
              ) : (
                <button type="button" onClick={next} className={btn("primary")}>
                  Keyingi
                  <ArrowRight className="size-[18px]" />
                </button>
              )}
            </div>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

/* ================================================================== */
/* Qadam tarkibi                                                      */
/* ================================================================== */

type Update = <K extends keyof AnketaAnswers>(key: K, value: AnketaAnswers[K], stepKey?: StepKey) => void;

function StepBody({
  stepKey,
  answers: a,
  update,
  token,
  photo,
  setPhoto,
  prompt,
  setError,
  jump,
}: {
  stepKey: StepKey;
  answers: AnketaAnswers;
  update: Update;
  token: string;
  photo: string | null;
  setPhoto: (url: string) => void;
  prompt: string;
  setError: (message: string) => void;
  jump: (step: number) => void;
}) {
  switch (stepKey) {
    case "photo":
      return <PhotoStep token={token} photo={photo} setPhoto={setPhoto} prompt={prompt} setError={setError} />;

    case "birth":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="Tugʻilgan sana">
            <input
              type="date"
              value={a.birth_date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => update("birth_date", e.target.value, "birth")}
              className={inputClass}
            />
          </Labeled>
          <Labeled label="Tugʻilgan joy">
            <input
              value={a.birth_place}
              onChange={(e) => update("birth_place", e.target.value, "birth")}
              placeholder="Masalan: Samarqand viloyati, Urgut tumani"
              className={inputClass}
            />
          </Labeled>
        </div>
      );

    case "activity":
      return (
        <textarea
          rows={3}
          value={a.activity}
          onChange={(e) => update("activity", e.target.value, "activity")}
          placeholder="Masalan: Frontend dasturchi, «EduTech» startapi asoschisi"
          className={textareaClass}
        />
      );

    case "about":
      return (
        <>
          <textarea
            rows={7}
            value={a.about}
            onChange={(e) => update("about", e.target.value, "about")}
            placeholder="Oʻzingiz haqingizda bir necha gap yozing…"
            className={textareaClass}
          />
          <p className="mt-2 text-right text-[12px] tabular-nums text-ink-3">{a.about.length} / 4000</p>
        </>
      );

    case "study":
      return (
        <div className="grid gap-4">
          <Labeled label="Oʻqish joyi">
            <input
              value={a.study_place}
              onChange={(e) => update("study_place", e.target.value, "study")}
              placeholder="Masalan: Toshkent axborot texnologiyalari universiteti"
              className={inputClass}
            />
          </Labeled>
          <Labeled label="Yoʻnalish / mutaxassislik">
            <input
              value={a.study_direction}
              onChange={(e) => update("study_direction", e.target.value, "study")}
              placeholder="Masalan: Dasturiy injiniring"
              className={inputClass}
            />
          </Labeled>
        </div>
      );

    case "experience":
      return (
        <ListEditor
          items={a.experience}
          onChange={(items) => update("experience", items, "experience")}
          blank={{ year: "", title: "", description: "" }}
          addLabel="Tajriba qoʻshish"
          render={(item, set) => (
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <input value={item.year} onChange={(e) => set({ year: e.target.value })} placeholder="2023 – hozir" className={inputClass} />
              <input value={item.title} onChange={(e) => set({ title: e.target.value })} placeholder="Lavozim va tashkilot" className={inputClass} />
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Nima ish qildingiz (ixtiyoriy)"
                className={`${textareaClass} sm:col-span-2`}
              />
            </div>
          )}
        />
      );

    case "achievements":
      return (
        <ListEditor
          items={a.achievements}
          onChange={(items) => update("achievements", items, "achievements")}
          blank={{ title: "", year: "" }}
          addLabel="Yutuq qoʻshish"
          render={(item, set) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
              <input value={item.title} onChange={(e) => set({ title: e.target.value })} placeholder="Masalan: «Yosh dasturchi» tanlovi gʻolibi" className={inputClass} />
              <input
                value={item.year}
                inputMode="numeric"
                maxLength={4}
                onChange={(e) => set({ year: e.target.value.replace(/\D/g, "") })}
                placeholder="Yil"
                className={inputClass}
              />
            </div>
          )}
        />
      );

    case "projects":
      return (
        <ListEditor
          items={a.projects}
          onChange={(items) => update("projects", items, "projects")}
          blank={{ title: "", url: "", description: "" }}
          addLabel="Loyiha qoʻshish"
          render={(item, set) => (
            <div className="grid gap-3">
              <input value={item.title} onChange={(e) => set({ title: e.target.value })} placeholder="Loyiha nomi" className={inputClass} />
              <input value={item.url} onChange={(e) => set({ url: e.target.value })} placeholder="Havola (ixtiyoriy): https://…" inputMode="url" className={inputClass} />
              <textarea rows={2} value={item.description} onChange={(e) => set({ description: e.target.value })} placeholder="Qisqa tavsif" className={textareaClass} />
            </div>
          )}
        />
      );

    case "extra":
      return (
        <textarea
          rows={5}
          value={a.extra}
          onChange={(e) => update("extra", e.target.value, "extra")}
          placeholder="Qiziqishlaringiz, til bilish darajangiz, qoʻshimcha faoliyat…"
          className={textareaClass}
        />
      );

    case "final":
      return (
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label="F.I.Sh" required>
              <input value={a.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Familiya Ism Otasining ismi" className={inputClass} />
            </Labeled>
            <Labeled label="Telefon raqam" required>
              <input
                value={a.phone}
                onChange={(e) => update("phone", formatPhoneInput(e.target.value))}
                placeholder="+998 90 123 45 67"
                inputMode="tel"
                autoComplete="tel"
                className={inputClass}
              />
            </Labeled>
          </div>

          <div className="rounded-card border border-line p-4">
            <p className="text-[13px] font-semibold text-ink">
              Ijtimoiy tarmoqlar <span className="font-normal text-ink-3">— ixtiyoriy</span>
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Labeled label="Instagram">
                <AtInput value={a.instagram} onChange={(v) => update("instagram", v)} placeholder="yoshlarwiki" />
              </Labeled>
              <Labeled label="Telegram">
                <AtInput value={a.telegram} onChange={(v) => update("telegram", v)} placeholder="yoshlarwiki" />
              </Labeled>
            </div>
            <p className="mt-1.5 text-[12px] text-ink-3">Misol: @yoshlarwiki</p>

          </div>

          <div className="rounded-card border border-line bg-surface-2 p-4">
            <p className="text-[13px] font-semibold text-ink">Toʻldirilgan boʻlimlar</p>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {STEPS.slice(0, -1).map((s, i) => {
                const skipped = a.skipped.includes(s.key);
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => jump(i)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-ink-2 hover:bg-surface-hover hover:text-ink"
                    >
                      {skipped ? (
                        <span className="grid size-4 place-items-center rounded-full bg-line text-[10px] text-ink-3">–</span>
                      ) : (
                        <CircleCheck className="size-4 text-accent-text" />
                      )}
                      <span className="truncate">{s.title}</span>
                      {skipped ? <span className="ml-auto text-[11px] text-ink-3">yoʻq</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="text-[12.5px] leading-relaxed text-ink-3">
            «Yuborish» bosilgach anketa administratorga tekshiruvga ketadi va havola yaroqsiz boʻladi.
            Imlo va harf xatolari avtomatik tuzatiladi.
          </p>
        </div>
      );
  }
}

/* ================================================================== */
/* Rasm yuklash + prompt                                              */
/* ================================================================== */

function PhotoStep({
  token,
  photo,
  setPhoto,
  prompt,
  setError,
}: {
  token: string;
  photo: string | null;
  setPhoto: (url: string) => void;
  prompt: string;
  setError: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState("");

  const send = async (blob: Blob, variant: "portrait" | "white") => {
    const signed = await createPhotoUpload(token, blob.type, blob.size, variant);
    if (!signed.ok) throw new Error(signed.message);
    const { error } = await createClient()
      .storage.from("portraits")
      .uploadToSignedUrl(signed.path, signed.uploadToken, blob, { contentType: blob.type });
    if (error) throw new Error("Rasm yuklanmadi. Internetni tekshirib, qayta urinib koʻring.");
    return signed.path;
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("PNG, JPG yoki WebP formatidagi rasmni yuklang.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Rasm hajmi 15 MB dan oshmasin.");
      return;
    }

    setUploading(true);
    try {
      setStatus("Rasm tekshirilmoqda…");
      const check = await checkPromptPortrait(file, true);
      if (!check.ok) {
        setError(check.message);
        return;
      }
      const processed = await processPortrait(file, { removeBackground: true, onStatus: setStatus });
      if (!processed.removed) {
        throw new Error("Rasm fonini olib tashlab boʻlmadi. Internetni tekshirib, qayta urinib koʻring yoki shaffof fonli PNG yuklang.");
      }
      setStatus("Yuklanmoqda…");
      const [portraitPath, whitePath] = await Promise.all([
        send(processed.cutout, "portrait"),
        send(processed.white, "white"),
      ]);
      const saved = await confirmPhoto(token, portraitPath, whitePath);
      if (!saved.ok) throw new Error(saved.message);
      setPhoto(saved.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rasm yuklanmadi.");
    } finally {
      setUploading(false);
      setStatus("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const area = document.getElementById("yw-prompt") as HTMLTextAreaElement | null;
      area?.select();
      document.execCommand?.("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="grid gap-6">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void upload(e.dataTransfer.files?.[0]);
        }}
        disabled={uploading}
        className={`group relative mx-auto grid aspect-square w-full max-w-[340px] place-items-center overflow-hidden rounded-panel border-2 border-dashed transition-colors ${
          drag ? "border-accent bg-accent-soft" : "border-line-strong hover:border-accent-text"
        } ${photo ? "yw-checker" : "bg-surface-2"}`}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Yuklangan rasm" className="absolute inset-0 size-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-3 px-6 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent-soft-fg">
              <ImagePlus className="size-7" strokeWidth={1.7} />
            </span>
            <span className="text-[15px] font-semibold text-ink">Rasm yuklash</span>
            <span className="text-[12.5px] text-ink-3">PNG, JPG yoki WebP — fon avtomatik olib tashlanadi</span>
          </span>
        )}

        {photo && !uploading ? (
          <span className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-[10px] bg-surface/90 py-2 text-[12.5px] font-semibold text-ink opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            <CloudUpload className="size-4" /> Boshqa rasm yuklash
          </span>
        ) : null}

        {uploading ? (
          <span className="absolute inset-0 grid place-items-center bg-surface/80 backdrop-blur-sm">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Loader2 className="size-5 animate-spin text-accent-text" /> {status || "Yuklanmoqda…"}
            </span>
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => void upload(e.target.files?.[0])}
      />

      <p className="-mt-2 text-center text-[12.5px] leading-relaxed text-ink-3">
        Avval pastdagi prompt bilan portret yasating. Rasm foni boʻlsa, yuklashda avtomatik olib tashlanadi.
      </p>

      {photo ? (
        <p className="-mt-2 flex items-center justify-center gap-1.5 text-[13px] font-medium text-success">
          <Check className="size-4" strokeWidth={2.4} /> Rasm yuklandi
        </p>
      ) : null}

      <div className="rounded-card border border-line bg-surface-2 p-4 sm:p-5">
        <p className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent-text" />
          <span>
            Quyidagi promptni nusxalang va oʻz rasmingiz bilan birga <b>ChatGPT</b> yoki boshqa AI’larga
            yuboring. Professional rasmingizni yasang va uni shu yerga yuklang.
          </span>
        </p>
        <textarea
          id="yw-prompt"
          readOnly
          value={prompt}
          rows={7}
          className={`${textareaClass} mt-3 resize-none bg-surface font-mono text-[11.5px] leading-[1.6]`}
        />
        <button type="button" onClick={copy} className={btn(copied ? "secondary" : "primary", "md", "mt-3 w-full")}>
          {copied ? <Check className="size-[18px]" strokeWidth={2.4} /> : <Copy className="size-[18px]" />}
          {copied ? "Nusxalandi" : "Promptni nusxalash"}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Kichik komponentlar                                                */
/* ================================================================== */

/** Yozish paytida +998 XX XXX XX XX ko'rinishiga keltiradi. */
function formatPhoneInput(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (!d) return "";
  if (!d.startsWith("998")) d = `998${d}`;
  d = d.slice(0, 12);
  const parts = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
  return `+${parts.join(" ")}`;
}

function Labeled({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-ink">
        {label}
        {required ? <span className="ml-0.5 text-accent-text">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function AtInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-ink-3">@</span>
      <input
        value={value.replace(/^@+/, "")}
        onChange={(e) => onChange(e.target.value.replace(/^@+/, "").replace(/\s/g, ""))}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        className={`${inputClass} pl-8`}
      />
    </div>
  );
}

function ListEditor<T extends Record<string, string>>({
  items,
  onChange,
  blank,
  addLabel,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  addLabel: string;
  render: (item: T, set: (patch: Partial<T>) => void) => React.ReactNode;
}) {
  const list = items.length ? items : [blank];

  return (
    <div className="grid gap-3">
      {list.map((item, index) => (
        <div key={index} className="relative rounded-card border border-line bg-surface-2 p-4 pr-12">
          <span className="absolute left-4 top-0 -translate-y-1/2 rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-fg">
            {index + 1}
          </span>
          {render(item, (patch) => {
            const nextList = [...list];
            nextList[index] = { ...item, ...patch };
            onChange(nextList);
          })}
          {list.length > 1 ? (
            <button
              type="button"
              onClick={() => onChange(list.filter((_, i) => i !== index))}
              aria-label="Oʻchirish"
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      ))}
      {list.length < 15 ? (
        <button type="button" onClick={() => onChange([...list, blank])} className={btn("secondary", "md", "border-dashed")}>
          <Plus className="size-[18px]" /> {addLabel}
        </button>
      ) : null}
    </div>
  );
}

function Notice({ tone, title, text }: { tone: "danger"; title: string; text: string }) {
  return (
    <div className="rounded-panel border border-line bg-surface p-8 text-center shadow-yw">
      <span className={`mx-auto grid size-12 place-items-center rounded-xl ${tone === "danger" ? "bg-danger-soft text-danger" : ""}`}>
        <TriangleAlert className="size-6" />
      </span>
      <h1 className="mt-5 text-[20px] font-bold text-ink">{title}</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{text}</p>
    </div>
  );
}

function Success({ name }: { name: string }) {
  return (
    <div className="rounded-panel border border-line bg-surface p-8 text-center shadow-yw sm:p-12">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent-soft-fg">
        <Check className="size-8" strokeWidth={2.4} />
      </span>
      <h1 className="mt-6 text-[24px] font-extrabold tracking-[-0.02em] text-ink">Rahmat, {name.split(" ")[1] || name}!</h1>
      <p className="mx-auto mt-3 max-w-[420px] text-[14.5px] leading-relaxed text-ink-2">
        Anketangiz qabul qilindi va administratorga tekshiruvga yuborildi. Profilingiz tayyor boʻlgach siz bilan
        Telegram orqali bogʻlanamiz. Bu havola endi yaroqsiz.
      </p>
    </div>
  );
}
