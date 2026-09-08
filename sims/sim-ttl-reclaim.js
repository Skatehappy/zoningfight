// sim-ttl-reclaim.js
// A reservation aged past 15 minutes is reclaimable by a NEW nonce, and the
// reclamation increments attempt_count. An unexpired reservation is not.
import { makeStore, TTL_MINUTES } from './_store.mjs';
import { ok, eq, pass } from './_assert.mjs';

const store = makeStore();
await store.seed('ZF-TTL-001');

const first = await store.reserve('ZF-TTL-001', 'nonce-old');
eq(first.result, 'OK', 'first reserve succeeds');

// Different nonce while unexpired -> CODE_IN_USE.
const blocked = await store.reserve('ZF-TTL-001', 'nonce-new');
eq(blocked.result, 'CODE_IN_USE', `unexpired reservation blocks a new nonce (< ${TTL_MINUTES} min)`);

// Age it past the TTL, then a new nonce reclaims it.
await store._ageReservation('ZF-TTL-001', (TTL_MINUTES + 1) * 60 * 1000);
const reclaimed = await store.reserve('ZF-TTL-001', 'nonce-new');
eq(reclaimed.result, 'OK', 'aged reservation is reclaimable by a new nonce');
ok(reclaimed.reservation_token !== first.reservation_token, 'reclamation issues a new token');

if (store._get) {
  const row = store._get('ZF-TTL-001');
  eq(row.attempt_count, 1, 'reclamation incremented attempt_count');
}

pass('sim-ttl-reclaim');
