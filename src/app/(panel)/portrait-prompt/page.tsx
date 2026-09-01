import type { Metadata } from "next";
import { Info, Lock } from "lucide-react";

import { PromptEditor } from "./prompt-editor";
import { Badge, Card, formatDateTime, PageHeader } from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nomzod rasmi prompti" };
export const dynamic = "force-dynamic";

export default async function PortraitPromptPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_settings")
    .select("value, updated_at, is_public")
    .eq("key", "portrait_prompt")
    .maybeSingle();

  const prompt =
    ((data?.value as { prompt?: string } | null)?.prompt ?? "").toString();
  const writable = canWrite(admin);

  return (
    <>
      <PageHeader
        title="Nomzod rasmi prompti"
        description="Nomzod portretlarini tayyorlashda ishlatiladigan standart AI prompt."
      >
        <Badge tone={data?.is_public ? "warning" : "success"}>
          <Lock className="mr-1.5 size-3" strokeWidth={2.2} />
          {data?.is_public ? "Ommaviy" : "Faqat admin uchun"}
        </Badge>
      </PageHeader>

      <Card className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
            <Info className="mt-0.5 size-4 shrink-0 text-accent-text" strokeWidth={1.9} />
            <span className="max-w-2xl">
              Prompt Supabase’dagi <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[12px]">site_settings</code>{" "}
              jadvalida saqlanadi va <strong>brauzerga hech qachon uzatilmaydi</strong> —
              faqat tizimga kirgan adminlar koʻra oladi. «Nusxalash» tugmasi
              promptning toʻliq matnini buferga koʻchiradi.
            </span>
          </p>
          {data?.updated_at ? (
            <p className="text-[12px] text-ink-3">
              Oxirgi oʻzgarish: {formatDateTime(data.updated_at)}
            </p>
          ) : null}
        </div>

        {!writable ? (
          <p className="mt-4 rounded-[10px] bg-warning-soft px-4 py-3 text-[13px] text-warning">
            Sizning rolingiz promptni faqat koʻrish va nusxalash imkonini beradi.
          </p>
        ) : null}

        <PromptEditor initialPrompt={prompt} readOnly={!writable} />
      </Card>
    </>
  );
}
