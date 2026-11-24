import type { Metadata } from "next";
import { LinkIcon } from "lucide-react";

import { AnketaForm } from "./form";
import { YoshlarWikiLogo } from "../../../../components/brand/YoshlarWikiLogo";
import { PORTRAIT_PROMPT, sanitizeAnswers } from "@/lib/anketa";
import { loadActiveLink } from "@/lib/anketa-server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Anketa",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AnketaPage(props: PageProps<"/anketa/[token]">) {
  const { token } = await props.params;
  const anketa = await loadActiveLink(token);

  if (!anketa) return <InvalidLink />;

  if (!anketa.opened_at) {
    await createAdminClient()
      .from("anketalar")
      .update({ opened_at: new Date().toISOString(), last_activity_at: new Date().toISOString() })
      .eq("id", anketa.id);
  }

  const answers = sanitizeAnswers(anketa.answers);
  if (!answers.full_name) answers.full_name = anketa.full_name;

  return (
    <AnketaForm
      token={token}
      fullName={anketa.full_name}
      gender={anketa.gender}
      initialAnswers={answers}
      initialStep={anketa.current_step}
      initialPhoto={anketa.photo_url}
      expiresAt={anketa.expires_at}
      prompt={PORTRAIT_PROMPT}
    />
  );
}

function InvalidLink() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5">
      <div className="w-full max-w-[420px] text-center">
        <YoshlarWikiLogo variant="horizontal" className="mx-auto h-9 w-auto" priority />
        <div className="mt-10 rounded-panel border border-line bg-surface p-8 shadow-yw">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-danger-soft text-danger">
            <LinkIcon className="size-6" strokeWidth={1.8} />
          </span>
          <h1 className="mt-5 text-[20px] font-bold tracking-[-0.02em] text-ink">Havola yaroqsiz</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
            Bu havola muddati tugagan yoki anketa allaqachon yuborilgan. Havolalar faqat bir marta
            ishlaydi. Yangi havola uchun YoshlarWiki administratoriga murojaat qiling.
          </p>
        </div>
      </div>
    </main>
  );
}
