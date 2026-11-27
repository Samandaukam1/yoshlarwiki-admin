"use client";

import { Check, Crown, Loader2, Send } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import { sendCandidatePostAction, setProfileTheme } from "../actions";
import { idleCms } from "../types";
import { btn, Card, CardTitle } from "@/components/ui";
import { PROFILE_THEME_INFO, PROFILE_THEMES, type ProfileTheme } from "@/lib/profile-theme";

/** Profil foni: Oddiy (saytning asl foni) yoki VIP — Ko'k / Oltin / Pushti. */
export function ProfileThemePicker({
  candidateId,
  current,
  disabled,
}: {
  candidateId: string;
  current: ProfileTheme;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(setProfileTheme, idleCms);
  const [choice, setChoice] = useState<ProfileTheme>(current);

  return (
    <Card>
      <CardTitle>Profil foni</CardTitle>
      <form action={action} className="grid grid-cols-2 gap-2.5">
        <input type="hidden" name="id" value={candidateId} />
        {PROFILE_THEMES.map((theme) => {
          const info = PROFILE_THEME_INFO[theme];
          const active = choice === theme;
          return (
            <button
              key={theme}
              type="submit"
              name="theme"
              value={theme}
              disabled={disabled || pending}
              onClick={() => setChoice(theme)}
              className={`group relative overflow-hidden rounded-[12px] border-2 text-left transition ${
                active ? "border-accent ring-2 ring-accent/25" : "border-line hover:border-line-strong"
              } disabled:cursor-not-allowed`}
            >
              <span className="relative block aspect-[16/9] w-full bg-[#f4efe6]">
                {info.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={info.thumb} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-[11px] font-medium text-[#8a8170]">
                    asl fon
                  </span>
                )}
                {info.vip ? (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    <Crown className="size-2.5" /> VIP
                  </span>
                ) : null}
                {active ? (
                  <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-accent text-accent-fg">
                    {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" strokeWidth={3} />}
                  </span>
                ) : null}
              </span>
              <span className="block px-2.5 py-1.5 text-[12.5px] font-semibold text-ink">{info.label}</span>
            </button>
          );
        })}
      </form>
      {state.message ? (
        <p className={`mt-3 text-[12.5px] ${state.status === "error" ? "text-danger" : "text-success"}`}>
          {state.message}
        </p>
      ) : null}
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
        <b>Oddiy</b> — saytdagi asl fon. <b>VIP</b> fonlarda profilning tepa qismi toʻliq tanlangan rasm bilan
        qoplanadi.
      </p>
    </Card>
  );
}

/** Bitta nomzodga kanal posti (eski shablon). */
export function SendPostCard({
  candidateId,
  postUrl,
  published,
  disabled,
}: {
  candidateId: string;
  postUrl: string | null;
  published: boolean;
  disabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string; url?: string } | null>(null);

  const send = () => {
    if (postUrl && !window.confirm("Bu nomzodga post avval yuborilgan. Yana yangi post yuborilsinmi?")) return;
    start(async () => {
      const res = await sendCandidatePostAction(candidateId);
      setResult(res.ok ? { ok: true, text: "Post yuborildi.", url: res.url } : { ok: false, text: res.message });
    });
  };

  const link = result?.url ?? postUrl;

  return (
    <Card>
      <CardTitle>Telegram post</CardTitle>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-accent-text hover:underline">
          {link}
        </a>
      ) : (
        <p className="text-[13px] text-ink-3">Hali yuborilmagan.</p>
      )}
      <button
        type="button"
        onClick={send}
        disabled={disabled || pending || !published}
        className={btn("primary", "sm", "mt-3 w-full")}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {postUrl ? "Qayta yuborish" : "Kanalga yuborish"}
      </button>
      {!published ? <p className="mt-2 text-[12px] text-ink-3">Avval profilni nashr eting.</p> : null}
      {result ? (
        <p className={`mt-2 text-[12.5px] ${result.ok ? "text-success" : "text-danger"}`}>{result.text}</p>
      ) : null}
    </Card>
  );
}
