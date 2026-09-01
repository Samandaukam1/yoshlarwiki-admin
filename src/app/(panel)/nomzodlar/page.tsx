import type { Metadata } from "next";
import { Users } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nomzodlar" };

export default async function Page() {
  await requireAdmin();

  return (
    <ComingSoon
      title="Nomzodlar"
      description="Ensiklopediya profillarini boshqarish (CMS)."
      icon={Users}
      planned={[
          "Nomzod yaratish, tahrirlash, qoralama saqlash",
          "Nashr etish, nashrdan olish, arxivlash",
          "Portret yuklash, taʼlim, faoliyat yoʻli, yutuqlar, loyihalar, ijtimoiy havolalar",
          "Kategoriya, hudud va SEO maydonlari",
          "Nashrdan oldin profilni koʻrib chiqish",
      ]}
    />
  );
}
