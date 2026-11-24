-- Telegram bot va anketalarni mavjud YoshlarWiki bazasiga qoʻshish.
begin;

do $$ begin
  create type public.anketa_status as enum (
    'toldirilmoqda', 'yuborildi', 'tasdiqlandi', 'nashr_etildi', 'rad_etildi'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.anketa_payment as enum ('yoq', 'kutilmoqda', 'tolandi', 'tolanmadi');
exception when duplicate_object then null; end $$;

-- Bot sozlamalari (faqat service role o'qiydi)
create table if not exists public.bot_settings (
  id              smallint primary key default 1 check (id = 1),
  bot_token       text,
  bot_username    text,
  webhook_secret  text,
  webhook_url     text,
  link_ttl_hours  integer not null default 24 check (link_ttl_hours between 1 and 720),
  connected_at    timestamptz,
  updated_at      timestamptz not null default now(),
  updated_by      uuid
);
insert into public.bot_settings (id) values (1) on conflict (id) do nothing;
alter table public.bot_settings enable row level security;

-- Telegram adminlar
create table if not exists public.bot_admins (
  id                 uuid primary key default gen_random_uuid(),
  full_name          text not null,
  telegram_username  text unique,
  telegram_id        bigint unique,
  chat_id            bigint,
  is_active          boolean not null default true,
  state              jsonb not null default '{}'::jsonb,
  last_seen_at       timestamptz,
  created_by         uuid,
  created_at         timestamptz not null default now(),
  constraint bot_admins_identity check (telegram_username is not null or telegram_id is not null)
);
alter table public.bot_admins enable row level security;

-- Anketalar
create table if not exists public.anketalar (
  id                     uuid primary key default gen_random_uuid(),
  full_name              text not null,
  gender                 public.gender not null,
  status                 public.anketa_status not null default 'toldirilmoqda',
  answers                jsonb not null default '{}'::jsonb,
  answers_fixed          jsonb,
  seo                    jsonb,
  photo_url              text,
  photo_path             text,
  current_step           integer not null default 0,
  expires_at             timestamptz not null,
  opened_at              timestamptz,
  last_activity_at       timestamptz,
  submitted_at           timestamptz,
  approved_at            timestamptz,
  published_at           timestamptz,
  payment_status         public.anketa_payment not null default 'yoq',
  payment_requested_at   timestamptz,
  payment_confirmed_at   timestamptz,
  payment_confirmed_by   text,
  candidate_id           uuid,
  created_by_bot_admin   uuid references public.bot_admins(id) on delete set null,
  created_by_admin       uuid,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists anketalar_status_idx on public.anketalar (status);
create index if not exists anketalar_created_idx on public.anketalar (created_at desc);
alter table public.anketalar enable row level security;

-- Bir martalik havolalar (yuborilgach / muddati tugagach o'chiriladi)
create table if not exists public.anketa_links (
  token       text primary key,
  anketa_id   uuid not null unique references public.anketalar(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
alter table public.anketa_links enable row level security;

create or replace function public.touch_anketa() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists anketalar_touch on public.anketalar;
create trigger anketalar_touch before update on public.anketalar
  for each row execute function public.touch_anketa();

alter table public.candidates add column if not exists gender public.gender;
-- Nomzod profili rangi: och ko'k / och pushti / gold
alter table public.candidates
  add column if not exists theme_color text not null default 'blue';
do $$ begin
  alter table public.candidates
    add constraint candidates_theme_color_check check (theme_color in ('blue','pink','gold'));
exception when duplicate_object then null; end $$;

-- Anketa: oq fonli post rasmi, profil va Telegram post havolalari
alter table public.anketalar add column if not exists photo_white_url text;
alter table public.anketalar add column if not exists profile_url text;
alter table public.anketalar add column if not exists post_url text;

-- Bot: kanal va post ostidagi havolalar
alter table public.bot_settings add column if not exists channel text;
alter table public.bot_settings add column if not exists instagram_url text;
alter table public.bot_settings add column if not exists telegram_url text;
alter table public.bot_settings add column if not exists apply_url text;   -- postdagi «ariza qoldiring» havolasi

revoke all on public.bot_settings, public.bot_admins, public.anketalar,
  public.anketa_links from public, anon, authenticated;
grant select, insert, update, delete on public.bot_settings, public.bot_admins,
  public.anketalar, public.anketa_links to service_role;
grant select on public.anketalar to authenticated;
grant select, insert, update, delete on public.bot_admins to authenticated;

drop policy if exists anketalar_select on public.anketalar;
create policy anketalar_select on public.anketalar
  for select to authenticated using ((select public.is_admin()));

drop policy if exists bot_admins_select on public.bot_admins;
create policy bot_admins_select on public.bot_admins
  for select to authenticated using ((select public.is_admin()));

drop policy if exists bot_admins_write on public.bot_admins;
create policy bot_admins_write on public.bot_admins
  for all to authenticated using ((select public.can_write()))
  with check ((select public.can_write()));

create or replace function public.cleanup_expired_anketa_links() returns integer
language sql set search_path = '' as $$
  with deleted as (
    delete from public.anketa_links where expires_at < now() returning 1
  )
  select count(*)::integer from deleted;
$$;

revoke execute on function public.cleanup_expired_anketa_links() from public, anon, authenticated;
grant execute on function public.cleanup_expired_anketa_links() to service_role;

commit;
