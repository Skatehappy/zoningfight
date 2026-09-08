-- =====================================================================
-- ZoningFight — atomic code redemption schema (T1)
-- =====================================================================
-- RUN THIS MANUALLY IN THE SUPABASE SQL EDITOR (SQL -> New query -> paste
-- -> Run). It is idempotent: safe to re-run. Same convention as the
-- BoardroomHQ atomic-vote RPC — tables and RPCs live together in one file,
-- there are no separate migration files.
--
-- WHY THIS EXISTS: codes were previously consumed on the generation ATTEMPT
-- (Payhip usage was marked mid-flow). A failed generation destroyed a paid
-- code, which turned an outage into a double charge with zero letters
-- delivered. This schema makes redemption atomic:
--     validate -> reserve -> generate -> deliver -> commit
-- The code is COMMITTED only after the letter has rendered to the client.
-- Any earlier failure RELEASES the reservation. A 15-minute TTL guarantees
-- an abandoned reservation self-heals with no cron dependency.
--
-- SECURITY MODEL: RLS denies all direct table access. The client (anon key)
-- can only reach the SECURITY DEFINER RPCs below. It never reads or writes
-- the tables directly.
--
-- SEEDING CODES: insert the codes you sell, e.g.
--     insert into zf_codes (code) values ('ZF-ABC123') on conflict do nothing;
-- The single existing Payhip customer's code should be seeded here by hand so
-- their license continues to work (governing tiebreaker: preserve the
-- customer's license code).
-- =====================================================================

-- ---------- extensions ------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------- codes table ----------------------------------------------
create table if not exists zf_codes (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,
  status             text not null default 'unused'
                       check (status in ('unused','reserved','consumed')),
  reserved_at        timestamptz,
  reservation_token  uuid,
  client_nonce       text,
  consumed_at        timestamptz,
  attempt_count      int not null default 0,
  created_at         timestamptz not null default now()
);

-- ---- Additive backfill for a pre-existing codes table ---------------
-- If an older zf_codes table already existed with different columns, add the
-- T1 columns without dropping anything. Each ADD is guarded so a re-run is a
-- no-op. If any of these columns already exists with an INCOMPATIBLE type,
-- the contingency rule is: add a *_v2 column, migrate, never drop — handle
-- that by hand; the guarded ADDs below only create the column when ABSENT.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_name='zf_codes' and column_name='status') then
    alter table zf_codes add column status text not null default 'unused'
      check (status in ('unused','reserved','consumed'));
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_name='zf_codes' and column_name='reserved_at') then
    alter table zf_codes add column reserved_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_name='zf_codes' and column_name='reservation_token') then
    alter table zf_codes add column reservation_token uuid;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_name='zf_codes' and column_name='client_nonce') then
    alter table zf_codes add column client_nonce text;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_name='zf_codes' and column_name='consumed_at') then
    alter table zf_codes add column consumed_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_name='zf_codes' and column_name='attempt_count') then
    alter table zf_codes add column attempt_count int not null default 0;
  end if;

  -- Backfill legacy "used" semantics. Only runs if a legacy boolean/flag
  -- column named "used" exists. Rows flagged used -> consumed; all others
  -- already default to unused. Never drops the legacy column.
  if exists (select 1 from information_schema.columns
             where table_name='zf_codes' and column_name='used') then
    execute $mig$
      update zf_codes
         set status = 'consumed',
             consumed_at = coalesce(consumed_at, now())
       where used is true and status = 'unused'
    $mig$;
  end if;
end $$;

-- ---------- delivery ledger ------------------------------------------
-- One row per delivered letter. Inserted in the SAME transaction as commit.
-- No letter content and no PII beyond the jurisdiction state.
create table if not exists zf_deliveries (
  id                 uuid primary key default gen_random_uuid(),
  code_id            uuid not null references zf_codes(id),
  reservation_token  uuid not null,
  delivered_at       timestamptz not null default now(),
  application_type   text,
  jurisdiction_state text
);

-- ---------- Row Level Security ---------------------------------------
-- Deny-by-default. No policies are created, so with RLS enabled the anon and
-- authenticated roles cannot select/insert/update/delete these tables. Only
-- the SECURITY DEFINER functions below (which run as the table owner) can.
alter table zf_codes      enable row level security;
alter table zf_deliveries enable row level security;

-- =====================================================================
-- RPCs — the only surface the client touches
-- =====================================================================

-- reserve: atomic. Uses SELECT ... FOR UPDATE to take a row lock, then
-- branches. The row lock (not a bare read-then-write) is what makes this
-- safe against the 20-concurrent-reserve race: attempts serialize on the
-- lock, the first wins the 'unused' branch, the rest see 'reserved'.
--
-- Resolution order (exactly as specified):
--   1. not found                                    -> CODE_INVALID
--   2. consumed                                      -> CODE_CONSUMED
--   3. reserved + matching nonce                     -> existing token (idempotent, no attempt++)
--   4. reserved + reserved_at older than 15 min      -> reclaim, new token, attempt++
--   5. reserved + unexpired + different nonce         -> CODE_IN_USE
--   6. unused                                        -> reserve
create or replace function zf_reserve_code(p_code text, p_client_nonce text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row   zf_codes;
  v_token uuid;
begin
  select * into v_row from zf_codes where code = p_code for update;

  if not found then
    return jsonb_build_object('result','CODE_INVALID');
  end if;

  if v_row.status = 'consumed' then
    return jsonb_build_object('result','CODE_CONSUMED');
  end if;

  if v_row.status = 'reserved' then
    -- (3) idempotent retry: same browser session reconnecting
    if v_row.client_nonce is not distinct from p_client_nonce then
      return jsonb_build_object('result','OK',
                                'reservation_token', v_row.reservation_token);
    end if;
    -- (4) lazy TTL reclamation — evaluated here, no cron
    if v_row.reserved_at < now() - interval '15 minutes' then
      v_token := gen_random_uuid();
      update zf_codes
         set status='reserved', reserved_at=now(),
             reservation_token=v_token, client_nonce=p_client_nonce,
             attempt_count = attempt_count + 1
       where id = v_row.id;
      return jsonb_build_object('result','OK','reservation_token',v_token);
    end if;
    -- (5) genuinely in use elsewhere
    return jsonb_build_object('result','CODE_IN_USE');
  end if;

  -- (6) unused -> reserve
  v_token := gen_random_uuid();
  update zf_codes
     set status='reserved', reserved_at=now(),
         reservation_token=v_token, client_nonce=p_client_nonce
   where id = v_row.id;
  return jsonb_build_object('result','OK','reservation_token',v_token);
end;
$$;

-- commit: reserved -> consumed, and record the delivery in the SAME
-- transaction. Only valid from 'reserved'; anything else returns
-- COMMIT_INVALID_STATE (and the caller logs it). The application_type and
-- jurisdiction_state are passed so the delivery row can be written atomically
-- with the state transition (extends the 1-arg signature in the spec to carry
-- the delivery metadata — logged in DECISIONS.md).
create or replace function zf_commit_code(
  p_reservation_token uuid,
  p_application_type  text default null,
  p_jurisdiction_state text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row zf_codes;
begin
  select * into v_row from zf_codes
   where reservation_token = p_reservation_token for update;

  if not found or v_row.status <> 'reserved' then
    return jsonb_build_object('result','COMMIT_INVALID_STATE');
  end if;

  update zf_codes
     set status='consumed', consumed_at=now(),
         reservation_token=null, client_nonce=null
   where id = v_row.id;

  insert into zf_deliveries
    (code_id, reservation_token, application_type, jurisdiction_state)
  values
    (v_row.id, p_reservation_token, p_application_type, p_jurisdiction_state);

  return jsonb_build_object('result','OK');
end;
$$;

-- release: reserved -> unused, increment attempt_count. Only from 'reserved'.
create or replace function zf_release_code(p_reservation_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row zf_codes;
begin
  select * into v_row from zf_codes
   where reservation_token = p_reservation_token for update;

  if not found or v_row.status <> 'reserved' then
    return jsonb_build_object('result','RELEASE_INVALID_STATE');
  end if;

  update zf_codes
     set status='unused', reservation_token=null, client_nonce=null,
         reserved_at=null, attempt_count = attempt_count + 1
   where id = v_row.id;

  return jsonb_build_object('result','OK');
end;
$$;

-- server-side reservation check (used by /api/generate to confirm a live
-- reservation before spending Anthropic tokens). Read-only, no state change.
create or replace function zf_verify_reservation(p_reservation_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row zf_codes;
begin
  select * into v_row from zf_codes
   where reservation_token = p_reservation_token;
  if not found or v_row.status <> 'reserved' then
    return jsonb_build_object('valid', false);
  end if;
  if v_row.reserved_at < now() - interval '15 minutes' then
    return jsonb_build_object('valid', false);
  end if;
  return jsonb_build_object('valid', true);
end;
$$;

-- peek: read-only gate check. Lets the "Unlock" screen tell the buyer whether
-- their code is recognized / already used WITHOUT taking a 15-minute lock.
-- Returns 'available' | 'consumed' | 'invalid'. Reveals only code validity.
create or replace function zf_peek_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row zf_codes;
begin
  select * into v_row from zf_codes where code = p_code;
  if not found then
    return jsonb_build_object('status','invalid');
  end if;
  if v_row.status = 'consumed' then
    return jsonb_build_object('status','consumed');
  end if;
  return jsonb_build_object('status','available');
end;
$$;

-- Expose RPCs to the anon/authenticated roles (execute only; the tables
-- themselves stay locked by RLS).
grant execute on function zf_peek_code(text)                       to anon, authenticated;
grant execute on function zf_reserve_code(text, text)              to anon, authenticated;
grant execute on function zf_commit_code(uuid, text, text)         to anon, authenticated;
grant execute on function zf_release_code(uuid)                    to anon, authenticated;
grant execute on function zf_verify_reservation(uuid)             to anon, authenticated;
