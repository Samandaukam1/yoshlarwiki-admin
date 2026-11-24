import { Sidebar } from "@/components/sidebar";
import { requireAdmin, ROLE_LABELS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { USER_SITE_URL } from "@/lib/config";

export default async function PanelLayout({ children }: LayoutProps<"/">) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ count }, { count: anketaCount }] = await Promise.all([
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "yangi"),
    // Tekshiruv kutayotgan anketalar (jadval bo'lmasa — 0).
    supabase.from("anketalar").select("id", { count: "exact", head: true }).eq("status", "yuborildi"),
  ]);

  return (
    <div className="min-h-dvh">
      <Sidebar
        user={{
          name: admin.full_name || admin.email,
          email: admin.email,
          role: ROLE_LABELS[admin.role] ?? admin.role,
        }}
        siteUrl={USER_SITE_URL}
        newApplications={count ?? 0}
        newAnketalar={anketaCount ?? 0}
      />

      {/* Telefonda pastda tab-panel bor — kontent uning ostida qolmasin. */}
      <main className="min-w-0 px-4 pb-28 pt-5 lg:ml-[264px] lg:px-8 lg:py-10">
        <div className="mx-auto min-w-0 max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
