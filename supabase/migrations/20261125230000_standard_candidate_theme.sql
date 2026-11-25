begin;
set local lock_timeout = '5s';
set local statement_timeout = '15s';

create schema if not exists yoshlarwiki_migration_backup;
revoke all on schema yoshlarwiki_migration_backup from public, anon, authenticated, service_role;

create table if not exists yoshlarwiki_migration_backup.candidate_theme_color_20261125 (
  candidate_id uuid primary key,
  previous_theme_color text
);
alter table yoshlarwiki_migration_backup.candidate_theme_color_20261125 enable row level security;
revoke all on yoshlarwiki_migration_backup.candidate_theme_color_20261125
  from public, anon, authenticated, service_role;

lock table public.candidates in access exclusive mode;

insert into yoshlarwiki_migration_backup.candidate_theme_color_20261125 (candidate_id, previous_theme_color)
select id, theme_color from public.candidates where theme_color is distinct from 'standard'
on conflict (candidate_id) do nothing;

alter table public.candidates drop constraint if exists candidates_theme_color_check;
update public.candidates set theme_color = 'standard' where theme_color is distinct from 'standard';
alter table public.candidates
  add constraint candidates_theme_color_check check (theme_color = 'standard'),
  alter column theme_color set default 'standard';

commit;
