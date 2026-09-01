import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { NewCandidateForm } from "./form";
import { Card, PageHeader } from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Yangi nomzod" };

export default async function NewCandidatePage() {
  const admin = await requireAdmin();

  return (
    <>
      <Link
        href="/nomzodlar"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-2 hover:text-accent-text"
      >
        <ArrowLeft className="size-4" />
        Nomzodlar
      </Link>

      <div className="mt-4">
        <PageHeader
          title="Yangi nomzod"
          description="Avval asosiy maʼlumotni kiriting — qolgan boʻlimlarni keyingi qadamda toʻldirasiz."
        />
      </div>

      <Card className="mt-7 max-w-[560px]">
        {canWrite(admin) ? (
          <NewCandidateForm />
        ) : (
          <p className="text-[13px] text-warning">
            Sizning rolingiz nomzod yaratishga ruxsat bermaydi.
          </p>
        )}
      </Card>
    </>
  );
}
