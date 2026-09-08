// sim-double-spend.js
// 20 concurrent reserves on one code -> exactly 1 success, 19 CODE_IN_USE.
import { makeStore } from './_store.mjs';
import { ok, eq, pass } from './_assert.mjs';

const store = makeStore();
await store.seed('ZF-RACE-001');

// Fire 20 reservations, each with a DIFFERENT nonce (distinct browsers racing).
const attempts = await Promise.all(
  Array.from({ length: 20 }, (_, i) => store.reserve('ZF-RACE-001', `nonce-${i}`))
);

const okCount = attempts.filter(a => a.result === 'OK').length;
const inUse = attempts.filter(a => a.result === 'CODE_IN_USE').length;

eq(okCount, 1, 'exactly one reservation succeeds');
eq(inUse, 19, 'the other nineteen get CODE_IN_USE');
ok(attempts.every(a => a.result === 'OK' || a.result === 'CODE_IN_USE'),
   'no attempt returns any other result');

pass('sim-double-spend');
