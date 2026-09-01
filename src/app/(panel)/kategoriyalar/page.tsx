import type { Metadata } from "next";

import { CategoryList, type CategoryRow } from "./category-editor";
import { PageHeader } from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kategoriyalar" };
export const dynamic = "force-dynamic";

export default async function CategoriesAdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: categories }, { data: links }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("candidate_categories")
      .select("categories!inner(slug), candidates!inner(status)")
      .eq("candidates.status", "published"),
  ]);

  const counts: Record<string, number> = {};
  for (const row of (links ?? []) as unknown as { categories: { slug: string } }[]) {
    const slug = row.categories?.slug;
    if (slug) counts[slug] = (counts[slug] ?? 0) + 1;
  }

  return (
    <>
      <PageHeader
        title="Kategoriyalar"
        description="Yoʻnalishlarni qoʻshing, tahrirlang va tartibini oʻzgartiring."
      />

      <div className="mt-7">
        <CategoryList
          categories={(categories ?? []) as CategoryRow[]}
          counts={counts}
          disabled={!canWrite(admin)}
        />
      </div>
    </>
  );
}
