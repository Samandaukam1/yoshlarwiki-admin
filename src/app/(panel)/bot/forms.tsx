"use client";

import { Check, Loader2, Plug, Save, TriangleAlert, UserPlus } from "lucide-react";
import { useActionState } from "react";

import { addBotAdmin, connectBot, saveChannelSettings, saveLinkTtl } from "./actions";
import { idleBot, type BotResult } from "./types";
import { btn, Field, inputClass } from "@/components/ui";

export function Feedback({ state }: { state: BotResult }) {
  if (state.status === "idle" || !state.message) return null;
  const error = state.status === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mt-3 flex items-start gap-2.5 rounded-[10px] px-3.5 py-2.5 text-[13px] ${
        error ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
      }`}
    >
      {error ? <TriangleAlert className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.4} />}
      <span className="[overflow-wrap:anywhere]">{state.message}</span>
    </p>
  );
}

export function ConnectForm({
  connected,
  username,
  disabled,
}: {
  connected: boolean;
  username: string | null;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(connectBot, idleBot);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Bot API token" hint="@BotFather → /mybots → API Token" htmlFor="bot_token">
        <input
          id="bot_token"
          name="bot_token"
          type="password"
          autoComplete="off"
          placeholder={connected ? "•••••••••• (yangilash uchun qayta kiriting)" : "123456789:AAH…"}
          className={`${inputClass} font-mono text-[13px]`}
          required
          disabled={disabled}
        />
      </Field>
      <Field label="Bot username" htmlFor="bot_username">
        <input
          id="bot_username"
          name="bot_username"
          defaultValue={username ? `@${username}` : ""}
          placeholder="@yoshlarwiki_bot"
          className={inputClass}
          required
          disabled={disabled}
        />
      </Field>
      <div>
        <button type="submit" disabled={pending || disabled} className={btn("primary")}>
          {pending ? <Loader2 className="size-[18px] animate-spin" /> : <Plug className="size-[18px]" />}
          {connected ? "Qayta ulash" : "Botni ulash"}
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function TtlForm({ ttl, disabled }: { ttl: number; disabled: boolean }) {
  const [state, action, pending] = useActionState(saveLinkTtl, idleBot);
  return (
    <form action={action}>
      <div className="flex flex-wrap items-end gap-2.5">
        <Field label="Havola muddati (soat)" htmlFor="ttl" className="w-[180px]">
          <input id="ttl" name="link_ttl_hours" type="number" min={1} max={720} defaultValue={ttl} className={inputClass} disabled={disabled} />
        </Field>
        <button type="submit" disabled={pending || disabled} className={btn("secondary")}>
          {pending ? <Loader2 className="size-[18px] animate-spin" /> : <Save className="size-[18px]" />}
          Saqlash
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function AddAdminForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(addBotAdmin, idleBot);
  return (
    <form action={action}>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Ism" htmlFor="ba_name">
          <input id="ba_name" name="full_name" placeholder="Masalan: Jasur" className={inputClass} required disabled={disabled} />
        </Field>
        <Field label="Telegram username yoki ID" htmlFor="ba_tg">
          <input id="ba_tg" name="telegram" placeholder="@username" className={inputClass} required disabled={disabled} />
        </Field>
        <button type="submit" disabled={pending || disabled} className={btn("primary")}>
          {pending ? <Loader2 className="size-[18px] animate-spin" /> : <UserPlus className="size-[18px]" />}
          Qoʻshish
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function ChannelForm({
  channel,
  instagram,
  telegram,
  apply,
  disabled,
}: {
  channel: string | null;
  instagram: string | null;
  telegram: string | null;
  apply: string | null;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(saveChannelSettings, idleBot);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Telegram kanal" hint="Profil tayyor boʻlganda post shu kanalga yuboriladi. Bot kanalga admin boʻlishi kerak." htmlFor="ch">
        <input id="ch" name="channel" defaultValue={channel?.startsWith("@") ? `https://t.me/${channel.slice(1)}` : (channel ?? "")} placeholder="https://t.me/yoshlarwiki" className={inputClass} disabled={disabled} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Instagram havolasi" hint="Post ostidagi «Instagram» yozuvi" htmlFor="ig">
          <input id="ig" name="instagram_url" defaultValue={instagram ?? ""} placeholder="https://instagram.com/yoshlarwiki" className={inputClass} disabled={disabled} />
        </Field>
        <Field label="Telegram havolasi" hint="Post ostidagi «Telegram» yozuvi" htmlFor="tgl">
          <input id="tgl" name="telegram_url" defaultValue={telegram ?? ""} placeholder="https://t.me/yoshlarwiki" className={inputClass} disabled={disabled} />
        </Field>
      </div>
      <Field
        label="Ariza uchun sayt havolasi"
        hint="Postdagi «ushbu havolani bosish orqali ariza qoldiring» yozuvi shu havolaga olib boradi."
        htmlFor="apply"
      >
        <input id="apply" name="apply_url" defaultValue={apply ?? ""} placeholder="https://yoshlarwiki.uz/ariza" className={inputClass} disabled={disabled} />
      </Field>
      <div>
        <button type="submit" disabled={pending || disabled} className={btn("primary")}>
          {pending ? <Loader2 className="size-[18px] animate-spin" /> : <Save className="size-[18px]" />}
          Saqlash
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}
