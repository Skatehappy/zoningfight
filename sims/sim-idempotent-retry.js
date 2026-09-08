// sim-idempotent-retry.js
// The SAME nonce retrying returns the SAME token and does NOT increment
// attempt_count (a network blip mid-reserve must not burn a retry).
import { makeStore } from './_store.mjs';
import { ok, eq, pass } from './_assert.mjs';

const store = makeStore();
await store.seed('ZF-IDEM-001');

const a = await store.reserve('ZF-IDEM-001', 'nonce-same');
eq(a.result, 'OK', 'first reserve succeeds');

const b = await store.reserve('ZF-IDEM-001', 'nonce-same');
eq(b.result, 'OK', 'retry with same nonce succeeds');
eq(b.reservation_token, a.reservation_token, 'same nonce returns the same token');

const c = await store.reserve('ZF-IDEM-001', 'nonce-same');
eq(c.reservation_token, a.reservation_token, 'a third retry is still the same token');

if (store._get) {
  const row = store._get('ZF-IDEM-001');
  eq(row.attempt_count, 0, 'idempotent retries did not increment attempt_count');
}

pass('sim-idempotent-retry');
