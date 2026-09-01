import type { Metadata } from "next";
import { Inbox } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Arizalar" };

export default async function Page() {
  await requireAdmin();

  return (
    <ComingSoon
      title="Arizalar"
      description="Saytdan kelgan arizalar bilan ishlash (CRM)."
      icon={Inbox}
      planned={[
          "Status boʻyicha ish jarayoni: Yangi → Bogʻlanildi → Jarayonda → Tasdiqlandi / Rad etildi",
          "Ism, telefon, Telegram boʻyicha qidiruv",
          "Jins, yosh oraligʻi, promokod va sana boʻyicha filtrlash",
          "Ichki izohlar va status oʻzgarishlari tarixi",
          "Arizani nomzodga aylantirish (asl yozuv saqlanadi)",
      ]}
    />
  );
}
