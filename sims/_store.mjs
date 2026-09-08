// sims/_store.mjs
// Backing store for the redemption sims.
//
// If SUPABASE_URL + SUPABASE_SERVICE_KEY are set, the sims run against that
// (staging) Supabase project by calling the real RPCs from schema.sql. That is
// the authoritative target per the directive.
//
// Otherwise they run against an in-process node:sqlite database that mirrors
// the schema.sql RPC logic EXACTLY (same 6-branch reserve resolution, same
// 15-minute TTL, same commit/release state guards). This lets Gate 1 run green
// headless on any machine with no cloud credentials. The substitution is logged
// loudly (never skipped silently) — final validation against staging Supabase
// is a Gate 3 / Rob step.
//
// Requires: node >= 22, run with `node --experimental-sqlite`.

import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

const TTL_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// node:sqlite backend — a faithful port of schema.sql's plpgsql RPCs.
// ---------------------------------------------------------------------------
function makeSqliteStore() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    create table zf_codes (
      id text primary key,
      code text not null unique,
      status text not null default 'unused',
      reserved_at integer,
      reservation_token text,
      client_nonce text,
      consumed_at integer,
      attempt_count integer not null default 0
    );
    create table zf_deliveries (
      id text primary key,
      code_id text not null,
      reservation_token text not null,
      delivered_at integer not null,
      application_type text,
      jurisdiction_state text
    );
  `);

  const api = {
    backend: 'node:sqlite',

    seed(code) {
      db.prepare(`insert into zf_codes (id, code) values (?, ?)
                  on conflict(code) do nothing`).run(randomUUID(), code);
    },

    // test-only: backdate a reservation so the TTL path can be exercised
    _ageReservation(code, ms) {
      db.prepare(`update zf_codes set reserved_at = ? where code = ?`)
        .run(Date.now() - ms, code);
    },

    _get(code) {
      return db.prepare(`select * from zf_codes where code = ?`).get(code);
    },

    reserve(code, nonce) {
      const row = db.prepare(`select * from zf_codes where code = ?`).get(code);
      if (!row) return { result: 'CODE_INVALID' };
      if (row.status === 'consumed') return { result: 'CODE_CONSUMED' };
      if (row.status === 'reserved') {
        // (3) idempotent retry — same nonce, same token, no attempt++
        if ((row.client_nonce ?? null) === (nonce ?? null)) {
          return { result: 'OK', reservation_token: row.reservation_token };
        }
        // (4) lazy TTL reclamation
        if (row.reserved_at < Date.now() - TTL_MS) {
          const token = randomUUID();
          db.prepare(`update zf_codes set status='reserved', reserved_at=?,
                        reservation_token=?, client_nonce=?,
                        attempt_count=attempt_count+1 where id=?`)
            .run(Date.now(), token, nonce, row.id);
          return { result: 'OK', reservation_token: token };
        }
        // (5) in use elsewhere
        return { result: 'CODE_IN_USE' };
      }
      // (6) unused -> reserve
      const token = randomUUID();
      db.prepare(`update zf_codes set status='reserved', reserved_at=?,
                    reservation_token=?, client_nonce=? where id=?`)
        .run(Date.now(), token, nonce, row.id);
      return { result: 'OK', reservation_token: token };
    },

    commit(token, applicationType = null, jurisdictionState = null) {
      const row = db.prepare(`select * from zf_codes where reservation_token = ?`).get(token);
      if (!row || row.status !== 'reserved') return { result: 'COMMIT_INVALID_STATE' };
      db.prepare(`update zf_codes set status='consumed', consumed_at=?,
                    reservation_token=null, client_nonce=null where id=?`)
        .run(Date.now(), row.id);
      db.prepare(`insert into zf_deliveries
                    (id, code_id, reservation_token, delivered_at, application_type, jurisdiction_state)
                  values (?, ?, ?, ?, ?, ?)`)
        .run(randomUUID(), row.id, token, Date.now(), applicationType, jurisdictionState);
      return { result: 'OK' };
    },

    release(token) {
      const row = db.prepare(`select * from zf_codes where reservation_token = ?`).get(token);
      if (!row || row.status !== 'reserved') return { result: 'RELEASE_INVALID_STATE' };
      db.prepare(`update zf_codes set status='unused', reservation_token=null,
                    client_nonce=null, reserved_at=null,
                    attempt_count=attempt_count+1 where id=?`)
        .run(row.id);
      return { result: 'OK' };
    },
  };
  return api;
}

// ---------------------------------------------------------------------------
// Supabase backend — calls the real RPCs from schema.sql.
// ---------------------------------------------------------------------------
function makeSupabaseStore(url, key) {
  const rpc = async (fn, args) => {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`${fn} -> HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  };
  return {
    backend: 'supabase',
    async seed(code) {
      // seeding requires service key + a direct insert; RLS is bypassed by the
      // service role. Best-effort; ignore conflict.
      await fetch(`${url}/rest/v1/zf_codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: 'resolution=ignore-duplicates',
        },
        body: JSON.stringify({ code }),
      });
    },
    async _ageReservation(code, ms) {
      const iso = new Date(Date.now() - ms).toISOString();
      await fetch(`${url}/rest/v1/zf_codes?code=eq.${encodeURIComponent(code)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ reserved_at: iso }),
      });
    },
    reserve: (code, nonce) => rpc('zf_reserve_code', { p_code: code, p_client_nonce: nonce }),
    commit: (token, at = null, st = null) =>
      rpc('zf_commit_code', { p_reservation_token: token, p_application_type: at, p_jurisdiction_state: st }),
    release: (token) => rpc('zf_release_code', { p_reservation_token: token }),
  };
}

export function makeStore() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (url && key) {
    console.log('[store] backend=supabase (staging) via SUPABASE_URL');
    return makeSupabaseStore(url, key);
  }
  console.log('[store] NOTE: SUPABASE_URL/SUPABASE_SERVICE_KEY not set — running against node:sqlite mirror of schema.sql. Final validation against staging Supabase is a Gate-3 step.');
  return makeSqliteStore();
}

export const TTL_MINUTES = 15;
