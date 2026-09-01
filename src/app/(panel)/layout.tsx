import { Sidebar } from "@/components/sidebar";
import { requireAdmin, ROLE_LABELS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PanelLayout({ children }: LayoutProps<"/">) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { count } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "yangi");

  return (
    <div className="min-h-dvh">
      <Sidebar
        user={{
          name: admin.full_name || admin.email,
          email: admin.email,
          role: ROLE_LABELS[admin.role] ?? admin.role,
        }}
        siteUrl={process.env.NEXT_PUBLIC_USER_SITE_URL ?? "http://localhost:3000"}
        newApplications={count ?? 0}
      />

      <main className="px-4 py-6 lg:ml-[264px] lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
