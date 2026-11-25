"use client";

import { Loader2, Plug, UserPlus } from "lucide-react";
import { useActionState } from "react";

import { addArizaBotAdmin, connectArizaBot } from "./actions";
import { Feedback } from "../bot/forms";
import { idleBot } from "../bot/types";
import { btn, Field, inputClass } from "@/components/ui";

export function ArizaConnectForm({
  connected,
  username,
  disabled,
}: {
  connected: boolean;
  username: string | null;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(connectArizaBot, idleBot);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Bot API token" hint="@BotFather → /mybots → API Token" htmlFor="ab_token">
        <input
          id="ab_token"
          name="bot_token"
          type="password"
          autoComplete="off"
          placeholder={connected ? "•••••••••• (yangilash uchun qayta kiriting)" : "123456789:AAH…"}
          className={`${inputClass} font-mono text-[13px]`}
          required
          disabled={disabled}
        />
      </Field>
      <Field label="Bot username" htmlFor="ab_username">
        <input
          id="ab_username"
          name="bot_username"
          defaultValue={username ? `@${username}` : ""}
          placeholder="@yoshlarwiki_ariza_bot"
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

export function ArizaAddAdminForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(addArizaBotAdmin, idleBot);
  return (
    <form action={action}>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Ism" htmlFor="aa_name">
          <input id="aa_name" name="full_name" placeholder="Masalan: Jasur" className={inputClass} required disabled={disabled} />
        </Field>
        <Field label="Telegram ID" htmlFor="aa_id">
          <input
            id="aa_id"
            name="telegram_id"
            inputMode="numeric"
            placeholder="123456789"
            className={`${inputClass} tabular-nums`}
            required
            disabled={disabled}
          />
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
