// api/_g4t.js — Gate 4 test-code path (S6). Lets the owner run the real generator end to end
// without burning a Payhip code. INERT unless the Vercel env var G4_TEST_CODE_SECRET is set
// (no default, never in the repo). Code form: G4T-<value of G4_TEST_CODE_SECRET>.
// A test code skips the Payhip verify and the Payhip usage mark, and is capped per UTC day.
//
// Cap limitation: the counter is in module memory, so it is per warm serverless instance and
// resets on a cold start. It bounds a leaked secret to roughly CAP calls per instance per day,
// not globally. Rotate (change/remove) the env var to revoke instantly.
import { timingSafeEqual } from 'crypto';

export const TEST_DAILY_MODEL_CALLS = 40;   // ≈ 10 letters (gate check + draft + review + assertive version = 4 calls)
const MIN_SECRET = 16;
const state = { day: '', n: 0 };

export function isTestCode(code, env = process.env) {
  const secret = env.G4_TEST_CODE_SECRET;
  if (!secret || secret.length < MIN_SECRET) return false;
  const a = Buffer.from(String(code || '').trim());
  const b = Buffer.from('G4T-' + secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Reserve one model call. Returns { ok, used, cap }.
export function takeTestBudget(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  if (state.day !== day) { state.day = day; state.n = 0; }
  if (state.n >= TEST_DAILY_MODEL_CALLS) return { ok: false, used: state.n, cap: TEST_DAILY_MODEL_CALLS };
  state.n++;
  return { ok: true, used: state.n, cap: TEST_DAILY_MODEL_CALLS };
}
export const _resetTestBudget = () => { state.day = ''; state.n = 0; };
