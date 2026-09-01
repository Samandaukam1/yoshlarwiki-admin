import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "SEO" };

export default async function Page() {
  await requireAdmin();

  return (
    <ComingSoon
      title="SEO"
      description="Sayt boʻyicha SEO sozlamalari."
      icon={Search}
      planned={[
          "Standart sarlavha, tavsif va kalit soʻzlar",
          "Open Graph rasmi",
          "Nomzodlar boʻyicha SEO holati roʻyxati",
      ]}
    />
  );
}
