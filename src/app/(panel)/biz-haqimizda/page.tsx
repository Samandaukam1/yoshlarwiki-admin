import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";

import { AboutForm } from "./about-form";
import { withDefaults, type AboutContent } from "./types";
import { PageHeader } from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Biz haqimizda" };
export const dynamic = "force-dynamic";

export default async function AboutSettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["about", "contacts"]);

  const byKey = Object.fromEntries((rows ?? []).map((row) => [row.key, row.value]));
  const about = withDefaults((byKey.about ?? null) as Partial<AboutContent> | null);
  const contacts = (byKey.contacts ?? {}) as { telegram?: string; instagram?: string };

  const siteUrl = process.env.NEXT_PUBLIC_USER_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      <PageHeader
        title="Biz haqimizda"
        description="Saytdagi “Biz haqimizda” sahifasi: umumiy maʼlumot, badal toʻlovi narxi, qoidalar va ijtimoiy tarmoqlar."
      >
        <a
          href={`${siteUrl}/biz-haqimizda`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-hover"
        >
          <ExternalLink className="size-4" strokeWidth={1.9} />
          Saytda koʻrish
        </a>
      </PageHeader>

      <div className="mt-7">
        <AboutForm
          about={about}
          telegram={contacts.telegram ?? ""}
          instagram={contacts.instagram ?? ""}
          disabled={!canWrite(admin)}
        />
      </div>
    </>
  );
}
