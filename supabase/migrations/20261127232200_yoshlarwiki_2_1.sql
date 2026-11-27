begin;
set local lock_timeout = '5s';
set local statement_timeout = '20s';

alter table public.candidates
  add column if not exists theme_color text not null default 'standard',
  add column if not exists profile_bg_url text,
  add column if not exists post_url text,
  add column if not exists post_image_url text,
  add column if not exists posted_at timestamptz;

alter table public.candidates
  drop constraint if exists candidates_theme_color_check,
  add constraint candidates_theme_color_check
    check (theme_color in ('standard', 'blue', 'pink', 'gold')),
  alter column theme_color set default 'standard';

with linked_posts as (
  select distinct on (candidate_id) candidate_id, post_url, post_image_url, published_at
  from public.anketalar
  where candidate_id is not null and post_url is not null
  order by candidate_id, published_at desc nulls last, updated_at desc, id
)
update public.candidates as candidate
set post_url = linked.post_url,
    post_image_url = coalesce(candidate.post_image_url, linked.post_image_url),
    posted_at = coalesce(candidate.posted_at, linked.published_at)
from linked_posts as linked
where candidate.id = linked.candidate_id and candidate.post_url is null;

create or replace function public.set_candidate_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.view_count is distinct from old.view_count
    and (to_jsonb(new) - array['view_count', 'updated_at', 'search_vector'])
      = (to_jsonb(old) - array['view_count', 'updated_at', 'search_vector']) then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace trigger set_updated_at
before update on public.candidates
for each row execute function public.set_candidate_updated_at();

drop function if exists public.increment_candidate_view(text);
create function public.increment_candidate_view(p_slug text) returns integer
language sql security definer set search_path = '' as $$
  update public.candidates
  set view_count = view_count + 1
  where slug = p_slug and status = 'published'
  returning view_count;
$$;

revoke execute on function public.increment_candidate_view(text) from public;
grant execute on function public.increment_candidate_view(text) to anon, authenticated, service_role;
notify pgrst, 'reload schema';

commit;
