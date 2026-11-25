-- Mavjud YoshlarWiki bazasiga ariza boti va shablonli postlarni qoʻshish.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '12s';

-- Anketa: shablon asosidagi post rasmi (kanalga shu rasm ketadi)
alter table public.anketalar add column if not exists post_image_url text;

-- Ariza boshqaruv boti sozlamalari (faqat service role o'qiydi — token maxfiy)
create table if not exists public.ariza_bot_settings (
  id              smallint primary key default 1 check (id = 1),
  bot_token       text,
  bot_username    text,
  webhook_secret  text,
  webhook_url     text,
  connected_at    timestamptz,
  updated_at      timestamptz not null default now(),
  updated_by      uuid
);
insert into public.ariza_bot_settings (id) values (1) on conflict (id) do nothing;
alter table public.ariza_bot_settings enable row level security;

-- Ariza boti adminlari — faqat Telegram ID orqali taniladi
create table if not exists public.ariza_bot_admins (
  id                 uuid primary key default gen_random_uuid(),
  full_name          text not null,
  telegram_id        bigint not null unique,
  telegram_username  text,
  chat_id            bigint,
  is_active          boolean not null default true,
  state              jsonb not null default '{}'::jsonb,
  last_seen_at       timestamptz,
  created_by         uuid,
  created_at         timestamptz not null default now()
);
alter table public.ariza_bot_admins enable row level security;

revoke all on public.ariza_bot_settings, public.ariza_bot_admins
  from public, anon, authenticated;
grant select, insert, update, delete on public.ariza_bot_settings, public.ariza_bot_admins
  to service_role;

-- Yangi profillar standart rang bilan yaratiladi. Saqlangan ranglar oʻz holida qoladi.
alter table public.candidates
  drop constraint if exists candidates_theme_color_check,
  add constraint candidates_theme_color_check check (theme_color in ('standard', 'blue', 'pink', 'gold')),
  alter column theme_color set default 'standard';

commit;
