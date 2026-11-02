-- Memorii tehnice & SSI – schema Supabase
-- Rulați o singură dată în Supabase: SQL Editor > New query > lipiți tot > Run.

create table if not exists public.memorii_docs (
  ws         text        not null,            -- codul echipei (minimum 20 de caractere)
  col        text        not null,            -- colecția: projects, sources
  id         text        not null,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (ws, col, id)
);

create index if not exists memorii_docs_ws_col on public.memorii_docs (ws, col);

alter table public.memorii_docs enable row level security;

-- Fiecare echipă vede și modifică doar rândurile cu codul ei (trimis de aplicație în antetul x-ws).
drop policy if exists memorii_ws_access on public.memorii_docs;
create policy memorii_ws_access on public.memorii_docs
  for all
  to anon, authenticated
  using (
    length(ws) >= 20
    and ws = coalesce(current_setting('request.headers', true)::json ->> 'x-ws', '')
  )
  with check (
    length(ws) >= 20
    and ws = coalesce(current_setting('request.headers', true)::json ->> 'x-ws', '')
  );

grant select, insert, update, delete on public.memorii_docs to anon, authenticated;
