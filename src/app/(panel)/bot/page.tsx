import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Globe,
  Inbox,
  Power,
  Trash2,
  Users,
} from "lucide-react";

import { deleteBotAdmin, disconnectBot, toggleBotAdmin } from "./actions";
import { AddAdminForm, ChannelForm, ConnectForm, TtlForm } from "./forms";
import {
  Badge,
  btn,
  Card,
  CardTitle,
  formatDateTime,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import { getAnketaStats } from "@/lib/anketa-server";
import { createClient } from "@/lib/supabase/server";
import { getBotSettings } from "@/lib/telegram";

export const metadata: Metadata = { title: "Telegram bot" };
export const dynamic = "force-dynamic";

export default async function BotPage() {
  const admin = await requireAdmin();
  const writable = canWrite(admin);
  const supabase = await createClient();

  const [settings, stats, { data: admins }] = await Promise.all([
    getBotSettings().catch(() => null),
    getAnketaStats().catch(() => null),
    supabase.from("bot_admins").select("*").order("created_at"),
  ]);

  const connected = !!settings?.connected_at && !!settings.bot_token;
  const ttl = settings?.link_ttl_hours ?? 24;

  return (
    <>
      <PageHeader
        title="Telegram bot"
        description="Telegram adminlar botda «Anketa yaratish» orqali nomzodlarga bir martalik havola beradi."
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
          Maʼlumotlar bazasida bot jadvallari topilmadi. <code>supabase/migrations/20261125182400_ariza_bot_and_post_templates.sql</code>{" "}
          faylini Supabase SQL Editor’da ishga tushiring va <code>SUPABASE_SERVICE_ROLE_KEY</code> sozlanganini tekshiring.
        </p>
      ) : null}

      {/* Statistika */}
      {stats ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={Users} label="Jami nomzodlar" value={stats.total} hint={`${stats.filling} tasi toʻldirmoqda`} href="/anketalar" />
          <StatCard icon={CalendarDays} label="Bugungi nomzodlar" value={stats.today} href="/anketalar?davr=bugun" />
          <StatCard icon={Inbox} label="Toʻlov kutilmoqda" value={stats.submitted} href="/anketalar?holat=yuborildi" />
          <StatCard icon={Globe} label="Saytda eʼlon qilingan" value={stats.published} href="/anketalar?holat=nashr_etildi" />
        </div>
      ) : null}

      <Link
        href="/anketalar"
        className="group mt-6 flex items-center gap-4 rounded-card border border-line bg-surface p-5 transition-colors hover:border-line-strong"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-soft-fg">
          <ClipboardList className="size-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-ink">Anketalar</span>
          <span className="block text-[13px] text-ink-2">
            Toʻldirilgan anketalar alohida boʻlimda — tahrirlash, toʻlov va chop etish.
          </span>
        </span>
        <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <Card className="mt-6">
        <CardTitle>Telegram kanal va post havolalari</CardTitle>
        <ChannelForm
          channel={settings?.channel ?? null}
          instagram={settings?.instagram_url ?? null}
          telegram={settings?.telegram_url ?? null}
          apply={settings?.apply_url ?? null}
          disabled={!writable || !settings}
        />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Ulanish */}
        <Card>
          <CardTitle
            action={
              connected && writable ? (
                <form action={disconnectBot}>
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
                <a href={`https://t.me/${settings?.bot_username}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-text">
                  @{settings?.bot_username}
                </a>
              </p>
              <p className="[overflow-wrap:anywhere]">Webhook: {settings?.webhook_url}</p>
              <p>Ulangan: {formatDateTime(settings?.connected_at ?? null)}</p>
            </div>
          ) : null}

          <ConnectForm connected={connected} username={settings?.bot_username ?? null} disabled={!writable || !settings} />

          <div className="mt-6 border-t border-line pt-5">
            <TtlForm ttl={ttl} disabled={!writable || !settings} />
          </div>
        </Card>

        {/* Adminlar */}
        <Card>
          <CardTitle>Telegram adminlar</CardTitle>
          <p className="-mt-2 mb-4 text-[13px] leading-relaxed text-ink-2">
            Faqat shu roʻyxatdagilar botdan foydalana oladi. Qoʻshilgach, ular botga kirib <b>/start</b> bosadi.
          </p>

          <AddAdminForm disabled={!writable || !settings} />

          <ul className="mt-5 divide-y divide-line rounded-card border border-line">
            {(admins ?? []).length === 0 ? (
              <li className="flex items-center gap-3 p-4 text-[13px] text-ink-3">
                <Bot className="size-4" /> Hali admin qoʻshilmagan.
              </li>
            ) : null}
            {(admins ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 p-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-bold text-accent-soft-fg">
                  {a.full_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{a.full_name}</span>
                  <span className="block truncate text-[12px] text-ink-3">
                    {a.telegram_username ? `@${a.telegram_username}` : `ID ${a.telegram_id}`}
                    {" · "}
                    {a.chat_id ? `faol: ${formatDateTime(a.last_seen_at)}` : "hali /start bosmagan"}
                  </span>
                </span>
                {!a.is_active ? <Badge tone="neutral">Oʻchirilgan</Badge> : null}
                {writable ? (
                  <span className="flex gap-1.5">
                    <form action={toggleBotAdmin}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="active" value={a.is_active ? "0" : "1"} />
                      <button type="submit" className={btn("ghost", "sm")}>
                        {a.is_active ? "Toʻxtatish" : "Yoqish"}
                      </button>
                    </form>
                    <form action={deleteBotAdmin}>
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
