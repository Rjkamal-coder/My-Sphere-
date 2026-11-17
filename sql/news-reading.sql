-- Major News per-user reading history.
-- Run AFTER database-schema.sql and rls-policies.sql.
-- Article IDs are the stable string IDs in js/news-data.js.

create table if not exists public.user_news_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id text not null check (char_length(article_id) between 1 and 200),
  read_at timestamptz not null default now(),
  constraint user_news_reads_user_article_key unique (user_id, article_id)
);

create index if not exists user_news_reads_user_idx
  on public.user_news_reads(user_id);

alter table public.user_news_reads enable row level security;

drop policy if exists "news reads select own" on public.user_news_reads;
create policy "news reads select own"
  on public.user_news_reads
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "news reads insert own" on public.user_news_reads;
create policy "news reads insert own"
  on public.user_news_reads
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Reading history is append-only from the browser: users cannot alter or
-- delete rows through the public API. A trusted database administrator can.
revoke all on table public.user_news_reads from anon, authenticated;
grant select, insert on table public.user_news_reads to authenticated;
