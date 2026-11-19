-- Major News module migration. Run AFTER database-schema.sql and rls-policies.sql.
-- Existing app tables are not modified. Article content is global; read history is per authenticated user.
create table if not exists public.news_articles (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 8 and 220),
 summary text not null check(char_length(summary) between 20 and 500),
 content text not null check(char_length(content) between 100 and 50000),
 category text not null check(category in ('Business','Trading','Forex','Crypto','Stock Market','Economy')),
 image_url text not null,
 image_path text,
 image_alt text not null default '',
 status text not null default 'published' check(status in ('draft','published')),
 published_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
-- Compatibility repair for installations where news_articles was created
-- by an earlier/partial version of this migration. IF NOT EXISTS alone does
-- not add columns to an existing table.
alter table public.news_articles
  add column if not exists status text not null default 'published',
  add column if not exists image_alt text not null default '',
  add column if not exists image_path text,
  add column if not exists updated_at timestamptz not null default now();

-- Keep existing status values valid without overwriting existing articles.
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

create table if not exists public.news_reads (
 user_id uuid not null references auth.users(id) on delete cascade,
 article_id uuid not null references public.news_articles(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key(user_id,article_id)
);
create index if not exists news_articles_published_idx on public.news_articles(status,published_at desc);
create index if not exists news_articles_category_idx on public.news_articles(category,published_at desc);
create index if not exists news_reads_user_idx on public.news_reads(user_id,read_at desc);
alter table public.news_articles enable row level security;
alter table public.news_reads enable row level security;
drop policy if exists "published news visible to authenticated" on public.news_articles;
create policy "published news visible to authenticated" on public.news_articles for select to authenticated using(status='published' or public.is_admin());
drop policy if exists "admins publish news" on public.news_articles;
create policy "admins publish news" on public.news_articles for insert to authenticated with check(public.is_admin() and created_by=auth.uid());
drop policy if exists "admins update news" on public.news_articles;
create policy "admins update news" on public.news_articles for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admins delete news" on public.news_articles;
create policy "admins delete news" on public.news_articles for delete to authenticated using(public.is_admin());
drop policy if exists "users read own news history" on public.news_reads;
create policy "users read own news history" on public.news_reads for select to authenticated using(user_id=auth.uid());
drop policy if exists "users mark own news read" on public.news_reads;
create policy "users mark own news read" on public.news_reads for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.news_articles a where a.id=article_id and a.status='published'));
drop policy if exists "users remove own news read" on public.news_reads;
create policy "users remove own news read" on public.news_reads for delete to authenticated using(user_id=auth.uid());
-- Dedicated public-read image bucket. Upload is restricted to admins through is_admin().
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('news-images','news-images',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "news images public read" on storage.objects;
create policy "news images public read" on storage.objects for select to public using(bucket_id='news-images');
drop policy if exists "admins upload news images" on storage.objects;
create policy "admins upload news images" on storage.objects for insert to authenticated with check(bucket_id='news-images' and public.is_admin());
drop policy if exists "admins update news images" on storage.objects;
create policy "admins update news images" on storage.objects for update to authenticated using(bucket_id='news-images' and public.is_admin()) with check(bucket_id='news-images' and public.is_admin());
drop policy if exists "admins delete news images" on storage.objects;
create policy "admins delete news images" on storage.objects for delete to authenticated using(bucket_id='news-images' and public.is_admin());
-- Supabase Realtime publication. Safe to run repeatedly.
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='news_articles') then alter publication supabase_realtime add table public.news_articles; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='news_reads') then alter publication supabase_realtime add table public.news_reads; end if;
end $$;
