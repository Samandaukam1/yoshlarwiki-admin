"use client";

import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, TriangleAlert } from "lucide-react";
import { useActionState, useId, useState } from "react";

import { signIn } from "./actions";
import { initialLoginState } from "./types";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialLoginState);
  const [showPassword, setShowPassword] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  const input =
    "h-12 w-full rounded-[10px] border border-line bg-surface pl-12 pr-4 text-[14px] text-ink outline-none transition-colors focus:border-accent-text placeholder:text-ink-3";

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />

      {state.status === "error" ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {state.message}
        </p>
      ) : null}

      <div>
        <label
          htmlFor={emailId}
          className="block text-[13px] font-semibold text-ink"
        >
          Email
        </label>
        <div className="relative mt-2">
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-3"
            strokeWidth={1.8}
          />
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            placeholder="admin@yoshlarwiki.uz"
            className={input}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={passwordId}
          className="block text-[13px] font-semibold text-ink"
        >
          Parol
        </label>
        <div className="relative mt-2">
          <Lock
            className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-3"
            strokeWidth={1.8}
          />
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={`${input} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Parolni yashirish" : "Parolni koʻrsatish"}
            className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-3 hover:bg-surface-hover hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="size-[18px]" strokeWidth={1.8} />
            ) : (
              <Eye className="size-[18px]" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] bg-accent text-[15px] font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="size-[18px] animate-spin" />
            Kirilmoqda…
          </>
        ) : (
          <>
            <LogIn className="size-[18px]" strokeWidth={2} />
            Kirish
          </>
        )}
      </button>
    </form>
  );
}
