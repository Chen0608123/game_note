-- 在 Supabase SQL Editor 執行這份檔案。
-- 這份版本已加入登入功能，每位使用者只會看到自己的遊戲資料。

create extension if not exists "pgcrypto";

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text not null default '未設定平台',
  status text not null default '遊玩中',
  cover_url text default '',
  cover_storage_path text default '',
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.games
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.games
alter column user_id set default auth.uid();

alter table public.games
add column if not exists cover_url text default '';

alter table public.games
add column if not exists cover_storage_path text default '';

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  title text not null,
  content text default '',
  note_type text not null default 'text' check (note_type in ('text', 'image', 'video')),
  file_type text default '',
  storage_path text default '',
  public_url text default '',
  created_at timestamptz not null default now()
);

alter table public.notes
add column if not exists note_type text not null default 'text';

alter table public.notes
add column if not exists file_type text default '';

alter table public.notes
add column if not exists storage_path text default '';

alter table public.notes
add column if not exists public_url text default '';

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  description text default '',
  media_type text not null check (media_type in ('image', 'video', 'link')),
  file_type text default '',
  storage_path text default '',
  public_url text not null,
  created_at timestamptz not null default now()
);

alter table public.memories
add column if not exists description text default '';

alter table public.memories
alter column storage_path drop not null;

alter table public.memories
alter column storage_path set default '';

alter table public.memories
drop constraint if exists memories_media_type_check;

alter table public.memories
add constraint memories_media_type_check check (media_type in ('image', 'video', 'link'));

alter table public.games enable row level security;
alter table public.notes enable row level security;
alter table public.memories enable row level security;

drop policy if exists "public read games" on public.games;
drop policy if exists "public insert games" on public.games;
drop policy if exists "public update games" on public.games;
drop policy if exists "public delete games" on public.games;
drop policy if exists "owner read games" on public.games;
drop policy if exists "owner insert games" on public.games;
drop policy if exists "owner update games" on public.games;
drop policy if exists "owner delete games" on public.games;

drop policy if exists "public read notes" on public.notes;
drop policy if exists "public insert notes" on public.notes;
drop policy if exists "public delete notes" on public.notes;
drop policy if exists "owner read notes" on public.notes;
drop policy if exists "owner insert notes" on public.notes;
drop policy if exists "owner update notes" on public.notes;
drop policy if exists "owner delete notes" on public.notes;

drop policy if exists "public read memories" on public.memories;
drop policy if exists "public insert memories" on public.memories;
drop policy if exists "public delete memories" on public.memories;
drop policy if exists "owner read memories" on public.memories;
drop policy if exists "owner insert memories" on public.memories;
drop policy if exists "owner update memories" on public.memories;
drop policy if exists "owner delete memories" on public.memories;

create policy "owner read games"
on public.games for select
using (auth.uid() = user_id);

create policy "owner insert games"
on public.games for insert
with check (auth.uid() = user_id);

create policy "owner update games"
on public.games for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "owner delete games"
on public.games for delete
using (auth.uid() = user_id);

create policy "owner read notes"
on public.notes for select
using (
  exists (
    select 1 from public.games
    where games.id = notes.game_id
    and games.user_id = auth.uid()
  )
);

create policy "owner insert notes"
on public.notes for insert
with check (
  exists (
    select 1 from public.games
    where games.id = notes.game_id
    and games.user_id = auth.uid()
  )
);

create policy "owner delete notes"
on public.notes for delete
using (
  exists (
    select 1 from public.games
    where games.id = notes.game_id
    and games.user_id = auth.uid()
  )
);

create policy "owner update notes"
on public.notes for update
using (
  exists (
    select 1 from public.games
    where games.id = notes.game_id
    and games.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.games
    where games.id = notes.game_id
    and games.user_id = auth.uid()
  )
);

create policy "owner read memories"
on public.memories for select
using (
  exists (
    select 1 from public.games
    where games.id = memories.game_id
    and games.user_id = auth.uid()
  )
);

create policy "owner insert memories"
on public.memories for insert
with check (
  exists (
    select 1 from public.games
    where games.id = memories.game_id
    and games.user_id = auth.uid()
  )
);

create policy "owner delete memories"
on public.memories for delete
using (
  exists (
    select 1 from public.games
    where games.id = memories.game_id
    and games.user_id = auth.uid()
  )
);

create policy "owner update memories"
on public.memories for update
using (
  exists (
    select 1 from public.games
    where games.id = memories.game_id
    and games.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.games
    where games.id = memories.game_id
    and games.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('game-media', 'game-media', true)
on conflict (id) do update set public = true;

drop policy if exists "public read game media" on storage.objects;
drop policy if exists "public upload game media" on storage.objects;
drop policy if exists "public delete game media" on storage.objects;
drop policy if exists "authenticated read game media" on storage.objects;
drop policy if exists "owner upload game media" on storage.objects;
drop policy if exists "owner delete game media" on storage.objects;

create policy "authenticated read game media"
on storage.objects for select
using (bucket_id = 'game-media');

create policy "owner upload game media"
on storage.objects for insert
with check (
  bucket_id = 'game-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "owner delete game media"
on storage.objects for delete
using (
  bucket_id = 'game-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 如果你已經有舊資料，登入版啟用後舊資料會因為沒有 user_id 而暫時看不到。
-- 可到 Supabase 的 Authentication > Users 複製自己的 user id，再執行：
-- update public.games set user_id = '你的 user id' where user_id is null;
