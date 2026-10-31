-- Run once in the Supabase SQL editor. No student can read these tables directly.
create table if not exists public.vault_content (id text primary key, data jsonb not null);
create table if not exists public.vault_progress (id uuid primary key references auth.users(id) on delete cascade, data jsonb not null, updated_at timestamptz not null default now());
alter table public.vault_content enable row level security;
alter table public.vault_progress enable row level security;
-- No RLS policies: all application operations use the server-only service role.
revoke all on public.vault_content from anon, authenticated;
revoke all on public.vault_progress from anon, authenticated;
create or replace function public.save_vault_progress(participant_id uuid, expected jsonb, replacement jsonb)
returns boolean language plpgsql security invoker set search_path = public as $$
declare current_data jsonb;
begin
  -- Per-participant transaction lock handles both first insert and subsequent updates.
  perform pg_advisory_xact_lock(hashtextextended(participant_id::text, 0));
  select data into current_data from vault_progress where id = participant_id for update;
  if found then
    if current_data is distinct from expected then return false; end if;
    update vault_progress set data = replacement, updated_at = now() where id = participant_id;
  else
    insert into vault_progress (id, data) values (participant_id, replacement);
  end if;
  return true;
end;
$$;
revoke all on function public.save_vault_progress(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_vault_progress(uuid,jsonb,jsonb) to service_role;
