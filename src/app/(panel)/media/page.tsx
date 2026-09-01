import type { Metadata } from "next";
import { Image } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Media" };

export default async function Page() {
  await requireAdmin();

  return (
    <ComingSoon
      title="Media"
      description="Supabase Storage fayllari."
      icon={Image}
      planned={[
          "Portret, loyiha rasmi va galereya fayllarini yuklash",
          "Bucketlar boʻyicha koʻrish: portraits, projects, media, og",
          "Fayl turi va hajmini tekshirish",
      ]}
    />
  );
}
