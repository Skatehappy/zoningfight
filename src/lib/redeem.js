// src/lib/redeem.js — client redemption layer (T1).
//
// Flow the app must follow:
//   validate (client caps, T4) -> reserve -> generate -> deliver (render) -> commit
// commit fires AFTER the letter renders, not after the API returns. Any earlier
// failure calls release(). The 15-minute TTL in schema.sql is the real
// guarantee; release() is best-effort.
//
// The client only ever calls the SECURITY DEFINER RPCs (RLS locks the tables).
// Calls go over PostgREST with the anon key — no supabase-js dependency.

import { RedeemError } from './errors.js';

const URL_BASE = import.meta.env?.VITE_SUPABASE_URL || '';
const ANON = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Permanent smoke-test bypass: this key never touches Supabase or a real code.
export const SMOKE_TEST_KEY = 'SMOKE-TEST-2026-BAO';
const TEST_TOKEN = 'test-token-0000';
export const isTestKey = (code) =>
  String(code || '').trim().toUpperCase() === SMOKE_TEST_KEY;

export const supabaseConfigured = !!(URL_BASE && ANON);

async function rpc(fn, args) {
  if (!supabaseConfigured) {
    // No backend wired yet -> treat as a temporary problem, never a code burn.
    throw new RedeemError('TRANSIENT', 'redemption backend not configured');
  }
  let res;
  try {
    res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
      },
      body: JSON.stringify(args),
    });
  } catch {
    throw new RedeemError('TRANSIENT', `${fn} network error`);
  }
  if (!res.ok) throw new RedeemError('TRANSIENT', `${fn} HTTP ${res.status}`);
  return res.json();
}

// One nonce per browser session, reused across retries. Persisting the nonce is
// safe (it is NOT the license code). The license code is never persisted.
const NONCE_KEY = 'zf_nonce_v1';
export function getNonce() {
  try {
    let n = localStorage.getItem(NONCE_KEY);
    if (!n) {
      n = (crypto?.randomUUID?.() || `n-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(NONCE_KEY, n);
    }
    return n;
  } catch {
    return `n-${Date.now()}`;
  }
}
export function resetNonce() {
  try { localStorage.removeItem(NONCE_KEY); } catch {}
}

// Read-only gate check. Returns 'available' | 'consumed' | 'invalid'.
export async function peekCode(code) {
  if (isTestKey(code)) return 'available';
  const out = await rpc('zf_peek_code', { p_code: String(code).trim() });
  return out?.status || 'invalid';
}

// Reserve. Returns a reservation token or throws a RedeemError with the
// taxonomy code (CODE_INVALID | CODE_CONSUMED | CODE_IN_USE | TRANSIENT).
export async function reserveCode(code) {
  if (isTestKey(code)) return TEST_TOKEN;
  const out = await rpc('zf_reserve_code', {
    p_code: String(code).trim(),
    p_client_nonce: getNonce(),
  });
  if (out?.result === 'OK') return out.reservation_token;
  throw new RedeemError(out?.result || 'TRANSIENT');
}

// Commit AFTER the letter renders. Records the delivery in the same txn.
export async function commitCode(token, applicationType, jurisdictionState) {
  if (token === TEST_TOKEN) return true;
  const out = await rpc('zf_commit_code', {
    p_reservation_token: token,
    p_application_type: applicationType || null,
    p_jurisdiction_state: jurisdictionState || null,
  });
  // COMMIT_INVALID_STATE here means the letter still rendered — deliver it and
  // let the caller log COMMIT_ORPHAN. Never fail the delivery on a commit hiccup.
  return out?.result === 'OK';
}

// Release on any pre-render failure. Best-effort; swallow errors.
export async function releaseCode(token) {
  if (!token || token === TEST_TOKEN) return;
  try { await rpc('zf_release_code', { p_reservation_token: token }); } catch {}
}
