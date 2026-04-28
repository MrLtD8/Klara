-- ============================================================
-- FamiljeApp — Supabase schema
-- Kör detta i Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Familjer
create table if not exists families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

-- Profiler (en per auth-användare)
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text,
  family_id     uuid references families(id),
  created_at    timestamptz default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table families enable row level security;
alter table profiles enable row level security;

-- Användare kan bara se sin egen familj
create policy "families: se sin familj"
  on families for select
  using (
    id = (select family_id from profiles where id = auth.uid())
  );

-- Användare kan bara uppdatera sin familj
create policy "families: uppdatera sin familj"
  on families for update
  using (
    id = (select family_id from profiles where id = auth.uid())
  );

-- Användare kan bara se sin egen profil
create policy "profiles: se sin profil"
  on profiles for select
  using (id = auth.uid());

-- Användare kan uppdatera sin egen profil
create policy "profiles: uppdatera sin profil"
  on profiles for update
  using (id = auth.uid());

-- Ny profil kan skapas vid registrering (service role eller direkt insert)
create policy "profiles: skapa vid registrering"
  on profiles for insert
  with check (id = auth.uid());

-- ============================================================
-- Trigger: skapa tom profil automatiskt vid ny auth-användare
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
