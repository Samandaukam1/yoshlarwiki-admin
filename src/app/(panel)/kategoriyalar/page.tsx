import type { Metadata } from "next";
import { FolderTree } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Kategoriyalar" };

export default async function Page() {
  await requireAdmin();

  return (
    <ComingSoon
      title="Kategoriyalar"
      description="Yoʻnalishlarni boshqarish."
      icon={FolderTree}
      planned={[
          "Kategoriya qoʻshish, tahrirlash, oʻchirish",
          "Nomi, slug, ikonka, tavsif va SEO maydonlari",
          "Faol/nofaol holati va tartibni oʻzgartirish",
      ]}
    />
  );
}
