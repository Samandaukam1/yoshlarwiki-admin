import type { Metadata } from "next";
import { Power, Trash2 } from "lucide-react";

import { deletePromocode, togglePromocode } from "./actions";
import { ContactsForm, PromocodeForm, type Contacts } from "./forms";
import {
  Badge,
  Card,
  CardTitle,
  formatDateTime,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { canWrite, requireAdmin, ROLE_LABELS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sozlamalar" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const writable = canWrite(admin);

  const [{ data: contactSetting }, { data: admins }, { data: promocodes }] =
    await Promise.all([
      supabase.from("site_settings").select("value").eq("key", "contacts").maybeSingle(),
      supabase.from("admin_users").select("*").order("created_at"),
      supabase.from("promocodes").select("*").order("created_at", { ascending: false }),
    ]);

  const contacts = (contactSetting?.value ?? {}) as Contacts;

  return (
    <>
      <PageHeader
        title="Sozlamalar"
        description="Aloqa maʼlumotlari, adminlar va promokodlar."
      />

      <div className="mt-7 space-y-5">
        <Card>
          <CardTitle>Aloqa maʼlumotlari</CardTitle>
          <ContactsForm contacts={contacts} disabled={!writable} />
        </Card>

        <Card>
          <CardTitle>Promokodlar</CardTitle>
          <PromocodeForm disabled={!writable} />

          {promocodes && promocodes.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {promocodes.map((promo) => (
                <li
                  key={promo.id}
                  className="flex items-center gap-3 rounded-[10px] border border-line px-4 py-3"
                >
                  <span className="font-mono text-[13.5px] font-semibold tracking-wide text-ink">
                    {promo.code}
                  </span>
                  {!promo.is_active ? <Badge tone="warning">Nofaol</Badge> : null}
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-3">
                    {promo.label ?? "—"}
                  </span>
                  <span className="shrink-0 text-[12.5px] tabular-nums text-ink-2">
                    {promo.usage_count} marta
                  </span>
                  {writable ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <form action={togglePromocode}>
                        <input type="hidden" name="id" value={promo.id} />
                        <input type="hidden" name="active" value={String(promo.is_active)} />
                        <button
                          type="submit"
                          aria-label={promo.is_active ? "Nofaol qilish" : "Faollashtirish"}
                          className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-hover hover:text-ink"
                        >
                          <Power className="size-4" strokeWidth={1.9} />
                        </button>
                      </form>
                      <form action={deletePromocode}>
                        <input type="hidden" name="id" value={promo.id} />
                        <button
                          type="submit"
                          aria-label="Oʻchirish"
                          className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="size-4" strokeWidth={1.9} />
                        </button>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-[13px] text-ink-3">Promokod qoʻshilmagan.</p>
          )}
        </Card>

        <Card padded={false}>
          <div className="p-5">
            <CardTitle>Adminlar</CardTitle>
          </div>
          <TableWrap>
            <thead>
              <tr>
                <Th className="border-t">Foydalanuvchi</Th>
                <Th className="border-t">Rol</Th>
                <Th className="border-t">Holat</Th>
                <Th className="border-t">Oxirgi kirish</Th>
              </tr>
            </thead>
            <tbody>
              {(admins ?? []).map((user) => (
                <tr key={user.id}>
                  <Td>
                    <span className="font-semibold text-ink">
                      {user.full_name || "—"}
                    </span>
                    <span className="block text-[12px] text-ink-3">{user.email}</span>
                  </Td>
                  <Td>{ROLE_LABELS[user.role] ?? user.role}</Td>
                  <Td>
                    <Badge tone={user.is_active ? "success" : "neutral"}>
                      {user.is_active ? "Faol" : "Nofaol"}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDateTime(user.last_seen_at)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="px-5 py-4 text-[12.5px] leading-relaxed text-ink-3">
            Yangi admin qoʻshish uchun Supabase Auth’da foydalanuvchi yarating va
            uni <code>admin_users</code> jadvaliga qoʻshing. Bu amal xavfsizlik
            sababli panel orqali bajarilmaydi.
          </p>
        </Card>
      </div>
    </>
  );
}
