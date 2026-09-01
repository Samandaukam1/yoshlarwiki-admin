import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Sozlamalar" };

export default async function Page() {
  await requireAdmin();

  return (
    <ComingSoon
      title="Sozlamalar"
      description="Platforma sozlamalari va adminlar."
      icon={Settings}
      planned={[
          "Aloqa maʼlumotlari",
          "Admin foydalanuvchilar va rollari",
          "Promokodlar roʻyxati",
      ]}
    />
  );
}
