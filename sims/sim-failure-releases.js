// sim-failure-releases.js
// A forced error after reserve -> release returns the code to 'unused' and
// increments attempt_count. The code is then reservable again.
import { makeStore } from './_store.mjs';
import { ok, eq, pass } from './_assert.mjs';

const store = makeStore();
await store.seed('ZF-FAIL-001');

const r = await store.reserve('ZF-FAIL-001', 'nonce-a');
eq(r.result, 'OK', 'initial reserve succeeds');

// Simulate a generation failure -> explicit release.
const rel = await store.release(r.reservation_token);
eq(rel.result, 'OK', 'release succeeds');

if (store._get) {
  const row = store._get('ZF-FAIL-001');
  eq(row.status, 'unused', 'code returns to unused after release');
  eq(row.attempt_count, 1, 'attempt_count incremented to 1');
}

// Reservable again by anyone.
const r2 = await store.reserve('ZF-FAIL-001', 'nonce-b');
eq(r2.result, 'OK', 'code is reservable again after release');

pass('sim-failure-releases');
