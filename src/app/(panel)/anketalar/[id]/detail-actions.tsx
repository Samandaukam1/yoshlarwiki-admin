"use client";

import { Banknote, CircleCheck, Globe, Loader2, Megaphone, Send, XCircle } from "lucide-react";
import { useActionState } from "react";

import {
  approveAnketa,
  markPaidManually,
  publishAnketa,
  rejectAnketa,
  repostToChannel,
  requestPayment,
} from "../actions";
import { Feedback } from "../../bot/forms";
import { idleBot, type BotResult } from "../../bot/types";
import { btn, type ButtonVariant } from "@/components/ui";

type Action = (prev: BotResult, fd: FormData) => Promise<BotResult>;

const ACTIONS = {
  approve: { fn: approveAnketa, label: "Tasdiqlash", icon: CircleCheck, variant: "primary" },
  payment: { fn: requestPayment, label: "Tekshirish", icon: Send, variant: "primary" },
  manual: { fn: markPaidManually, label: "Qoʻlda: toʻlov qilingan", icon: Banknote, variant: "ghost" },
  publish: { fn: publishAnketa, label: "Saytda chiqarish", icon: Globe, variant: "primary" },
  repost: { fn: repostToChannel, label: "Kanalga qayta yuborish", icon: Megaphone, variant: "secondary" },
  reject: { fn: rejectAnketa, label: "Rad etish", icon: XCircle, variant: "danger" },
} satisfies Record<string, { fn: Action; label: string; icon: typeof Send; variant: ButtonVariant }>;

export function AnketaAction({
  id,
  kind,
  disabled = false,
  confirmText,
  full = false,
}: {
  id: string;
  kind: keyof typeof ACTIONS;
  disabled?: boolean;
  confirmText?: string;
  full?: boolean;
}) {
  const config = ACTIONS[kind];
  const [state, action, pending] = useActionState(config.fn as Action, idleBot);
  const Icon = config.icon;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
      className={full ? "w-full" : ""}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={disabled || pending} className={btn(config.variant, "md", full ? "w-full" : "")}>
        {pending ? <Loader2 className="size-[18px] animate-spin" /> : <Icon className="size-[18px]" strokeWidth={1.9} />}
        {config.label}
      </button>
      <Feedback state={state} />
    </form>
  );
}
