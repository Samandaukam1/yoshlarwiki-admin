import type { Metadata } from "next";
import { CircleCheck, Inbox, ListChecks, Power, ShieldCheck, Trash2, UsersRound } from "lucide-react";

import { deleteArizaBotAdmin, disconnectArizaBot, toggleArizaBotAdmin } from "./actions";
import { ArizaAddAdminForm, ArizaConnectForm } from "./forms";
import { Badge, btn, Card, CardTitle, formatDateTime, PageHeader, StatCard } from "@/components/ui";
import { getArizaBotSettings } from "@/lib/ariza-bot";
import { canWrite, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Ariza boshqaruv bot" };
export const dynamic = "force-dynamic";

export default async function ArizaBotPage() {
  const admin = await requireAdmin();
  const writable = canWrite(admin);
  const db = createAdminClient();

  const [settings, admins, newCount, totalCount] = await Promise.all([
    getArizaBotSettings().catch(() => null),
    db.from("ariza_bot_admins").select("*").order("created_at").then((r) => r.data ?? []),
    db.from("applications").select("id", { count: "exact", head: true }).eq("status", "yangi").then((r) => r.count ?? 0),
    db.from("applications").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
  ]);

  const connected = !!settings?.connected_at && !!settings.bot_token;

  return (
    <>
      <PageHeader
        title="Ariza boshqaruv bot"
        description="Saytdan kelgan arizalarni Telegram’da koʻrish va bekor qilish uchun alohida bot."
      >
        {connected ? (
          <Badge tone="success">
            <CircleCheck className="mr-1.5 size-3.5" /> @{settings?.bot_username} ulangan
          </Badge>
        ) : (
          <Badge tone="warning">Bot ulanmagan</Badge>
        )}
      </PageHeader>

      {!settings ? (
        <p className="mt-6 rounded-[10px] bg-danger-soft px-4 py-3 text-[13px] text-danger">
          Maʼlumotlar bazasida ariza boti jadvallari topilmadi. <code>supabase/migrations/20261125182400_ariza_bot_and_post_templates.sql</code> faylini
          Supabase SQL Editor’da qoʻllang.
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard icon={Inbox} label="Yangi arizalar" value={newCount} href="/arizalar?status=yangi" />
        <StatCard icon={ListChecks} label="Jami arizalar" value={totalCount} href="/arizalar" />
        <StatCard icon={UsersRound} label="Bot adminlari" value={admins.filter((a) => a.is_active).length} />
      </div>

      <Card className="mt-6">
        <CardTitle>Botda nima bor</CardTitle>
        <ul className="grid gap-2.5 text-[13.5px] leading-relaxed text-ink-2">
          <li>
            <b className="text-ink">🆕 Yangi arizalar</b> va <b className="text-ink">📋 Jami arizalar</b> — har bir ariza: F.I.Sh,
            telefon, Telegram, jins, yosh oraligʻi, promo kod, soat va sana. Har sahifada 10 tadan, ⬅️ ➡️ bilan varaqlanadi.
          </li>
          <li>
            <b className="text-ink">❌ Arizani bekor qilish</b> — Telegram username yoziladi, tasdiqlansa ariza «Rad etildi» boʻladi.
          </li>
          <li>
            Anketa botida profil chop etilganda mos ariza (username yoki telefon boʻyicha) avtomatik{" "}
            <b className="text-ink">«Nomzodga aylantirildi»</b> boʻladi.
          </li>
        </ul>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle
            action={
              connected && writable ? (
                <form action={disconnectArizaBot}>
                  <button type="submit" className={btn("danger", "sm")}>
                    <Power className="size-4" /> Uzish
                  </button>
                </form>
              ) : null
            }
          >
            Bot ulanishi
          </CardTitle>

          {connected ? (
            <div className="mb-5 grid gap-1.5 rounded-[10px] bg-surface-2 p-4 text-[13px] text-ink-2">
              <p>
                Bot:{" "}
                <a
                  href={`https://t.me/${settings?.bot_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-text"
                >
                  @{settings?.bot_username}
                </a>
              </p>
              <p className="[overflow-wrap:anywhere]">Webhook: {settings?.webhook_url}</p>
              <p>Ulangan: {formatDateTime(settings?.connected_at ?? null)}</p>
            </div>
          ) : null}

          <ArizaConnectForm connected={connected} username={settings?.bot_username ?? null} disabled={!writable || !settings} />
          <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
            Anketa botidan boshqa bot boʻlishi kerak: @BotFather → /newbot orqali yangi bot yarating.
          </p>
        </Card>

        <Card>
          <CardTitle>Bot adminlari</CardTitle>
          <p className="-mt-2 mb-4 flex gap-2 text-[13px] leading-relaxed text-ink-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-text" />
            <span>
              Bot faqat shu Telegram ID’larga ishlaydi, begonaga hech narsa koʻrsatmaydi. ID’ni bilmasangiz — odam botga{" "}
              <b>/start</b> yozsin, bot unga ID’sini koʻrsatadi.
            </span>
          </p>

          <ArizaAddAdminForm disabled={!writable || !settings} />

          <ul className="mt-5 divide-y divide-line rounded-card border border-line">
            {admins.length === 0 ? (
              <li className="flex items-center gap-3 p-4 text-[13px] text-ink-3">
                <UsersRound className="size-4" /> Hali admin qoʻshilmagan.
              </li>
            ) : null}
            {admins.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 p-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-bold text-accent-soft-fg">
                  {a.full_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{a.full_name}</span>
                  <span className="block truncate text-[12px] text-ink-3">
                    ID {a.telegram_id}
                    {a.telegram_username ? ` · @${a.telegram_username}` : ""}
                    {" · "}
                    {a.chat_id ? `faol: ${formatDateTime(a.last_seen_at)}` : "hali /start bosmagan"}
                  </span>
                </span>
                {!a.is_active ? <Badge tone="neutral">Oʻchirilgan</Badge> : null}
                {writable ? (
                  <span className="flex gap-1.5">
                    <form action={toggleArizaBotAdmin}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="active" value={a.is_active ? "0" : "1"} />
                      <button type="submit" className={btn("ghost", "sm")}>
                        {a.is_active ? "Toʻxtatish" : "Yoqish"}
                      </button>
                    </form>
                    <form action={deleteArizaBotAdmin}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className={btn("danger", "sm", "px-2.5")} aria-label="Oʻchirish">
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
