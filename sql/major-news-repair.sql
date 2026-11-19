-- Run this once if the Major News migration has already been applied but
-- the existing news_articles table is missing columns used by the website.
-- Safe to run repeatedly; it does not delete or rewrite article data.
alter table public.news_articles
  add column if not exists status text not null default 'published',
  add column if not exists image_alt text not null default '',
  add column if not exists image_path text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'news_articles_status_check'
      and conrelid = 'public.news_articles'::regclass
  ) then
    alter table public.news_articles
      add constraint news_articles_status_check
      check (status in ('draft', 'published'));
  end if;
end $$;

notify pgrst, 'reload schema';
