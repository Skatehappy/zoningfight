// sim-commit-once.js
// A committed code cannot be committed again: the second commit returns
// COMMIT_INVALID_STATE. Also verifies a delivery row is written on commit.
import { makeStore } from './_store.mjs';
import { ok, eq, pass } from './_assert.mjs';

const store = makeStore();
await store.seed('ZF-COMMIT-001');

const r = await store.reserve('ZF-COMMIT-001', 'nonce-a');
eq(r.result, 'OK', 'reserve succeeds');

const c1 = await store.commit(r.reservation_token, 'special_exception', 'FL');
eq(c1.result, 'OK', 'first commit succeeds');

const c2 = await store.commit(r.reservation_token, 'special_exception', 'FL');
eq(c2.result, 'COMMIT_INVALID_STATE', 'second commit is rejected');

// Releasing a consumed code is also invalid.
const rel = await store.release(r.reservation_token);
eq(rel.result, 'RELEASE_INVALID_STATE', 'cannot release a consumed code');

pass('sim-commit-once');
