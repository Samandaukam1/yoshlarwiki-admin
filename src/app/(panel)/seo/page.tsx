import Link from "next/link";
import type { Metadata } from "next";
import { Check, ExternalLink, X } from "lucide-react";

import { SeoForm, type SeoDefaults } from "./seo-form";
import {
  Card,
  CardTitle,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "SEO" };
export const dynamic = "force-dynamic";

function Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="size-4 text-success" strokeWidth={2.4} aria-label="Toʻldirilgan" />
  ) : (
    <X className="size-4 text-ink-3" strokeWidth={2.2} aria-label="Boʻsh" />
  );
}

export default async function SeoPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [{ data: setting }, { data: candidates }] = await Promise.all([
    supabase.from("site_settings").select("value").eq("key", "seo_defaults").maybeSingle(),
    supabase
      .from("candidates")
      .select("id, full_name, slug, status, seo_title, seo_description, og_image_url, no_index")
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  const defaults = (setting?.value ?? {}) as SeoDefaults;
  const siteUrl = process.env.NEXT_PUBLIC_USER_SITE_URL ?? "http://localhost:3000";

  const published = (candidates ?? []).filter((c) => c.status === "published");
  const incomplete = published.filter((c) => !c.seo_title || !c.seo_description);

  return (
    <>
      <PageHeader
        title="SEO"
        description="Sayt boʻyicha standart metama'lumotlar va nomzodlar SEO holati."
      />

      <div className="mt-7 space-y-5">
        <Card>
          <CardTitle>Sayt boʻyicha standart qiymatlar</CardTitle>
          <SeoForm defaults={defaults} disabled={!canWrite(admin)} />
        </Card>

        <Card>
          <CardTitle>Texnik fayllar</CardTitle>
          <ul className="flex flex-wrap gap-2.5">
            {["/sitemap.xml", "/robots.txt"].map((path) => (
              <li key={path}>
                <a
                  href={`${siteUrl}${path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-accent-text"
                >
                  <ExternalLink className="size-3.5" strokeWidth={1.9} />
                  {path}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
            Sitemap nashr etilgan nomzodlar va faol kategoriyalardan avtomatik
            hosil qilinadi. Nomzod profillarida schema.org <code>Person</code>{" "}
            markirovkasi mavjud.
          </p>
        </Card>

        <Card padded={false}>
          <div className="p-5">
            <CardTitle>
              Nomzodlar SEO holati
              {incomplete.length > 0 ? (
                <span className="ml-2 text-[13px] font-medium text-warning">
                  ({incomplete.length} ta toʻldirilmagan)
                </span>
              ) : null}
            </CardTitle>
          </div>

          <TableWrap>
            <thead>
              <tr>
                <Th className="border-t">Nomzod</Th>
                <Th className="border-t">Holat</Th>
                <Th className="border-t">SEO sarlavha</Th>
                <Th className="border-t">Meta tavsif</Th>
                <Th className="border-t">OG rasm</Th>
                <Th className="border-t">Indeks</Th>
              </tr>
            </thead>
            <tbody>
              {(candidates ?? []).map((item) => (
                <tr key={item.id} className="hover:bg-surface-hover">
                  <Td>
                    <Link
                      href={`/nomzodlar/${item.id}`}
                      className="font-semibold text-ink hover:text-accent-text"
                    >
                      {item.full_name}
                    </Link>
                    <span className="block text-[12px] text-ink-3">/{item.slug}</span>
                  </Td>
                  <Td>{item.status === "published" ? "Nashr etilgan" : "Yopiq"}</Td>
                  <Td><Mark ok={Boolean(item.seo_title)} /></Td>
                  <Td><Mark ok={Boolean(item.seo_description)} /></Td>
                  <Td><Mark ok={Boolean(item.og_image_url)} /></Td>
                  <Td>
                    {item.no_index ? (
                      <span className="text-[12.5px] text-warning">noindex</span>
                    ) : (
                      <span className="text-[12.5px] text-ink-3">index</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      </div>
    </>
  );
}
