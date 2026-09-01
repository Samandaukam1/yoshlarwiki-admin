import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Kirish",
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next =
    typeof searchParams.keyingi === "string" && searchParams.keyingi.startsWith("/")
      ? searchParams.keyingi
      : "/";
  const denied = searchParams.xato === "ruxsat";

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="mt-8 rounded-panel border border-line bg-surface p-7 shadow-yw sm:p-8">
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-ink">
            Admin panelga kirish
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-2">
            Davom etish uchun hisobingizga kiring.
          </p>

          {denied ? (
            <p
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-[10px] bg-warning-soft px-4 py-3 text-[13px] text-warning"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              Bu hisob uchun admin panelga ruxsat yoʻq.
            </p>
          ) : null}

          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-center text-[12px] text-ink-3">
          YoshlarWiki boshqaruv paneli
        </p>
      </div>
    </main>
  );
}
