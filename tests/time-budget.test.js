// Time budget: no /api request may run past the platform limit, whatever the model does.
// Virtual clock + mocked slow Anthropic fetch (no real waiting). Node generate: worst case <= 50s; checklist model time <= 20s.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.PAYHIP_API_KEY = 'x'; process.env.ANTHROPIC_API_KEY = 'x'; delete process.env.G4_TEST_CODE_SECRET;
const { default: generate, HARD_MS, RETRY_BEFORE_MS } = await import('../api/generate.js');
const { default: checklist, CHECKLIST_MODEL_MS } = await import('../api/checklist.js');
const { TYPES } = await import('../api/_checklist-fallbacks.js');

const realFetch = globalThis.fetch, realNow = Date.now, realTimeout = AbortSignal.timeout;
let clock = 0, calls = 0;
const GOOD = 'Dear Board,\n\nWe request a special exception under the criteria listed in our application.\n\nSincerely,\nOwner';
const BAD_CITE = 'Dear Board,\n\nThe Board must act under O.C.G.A. § 99-99-99 immediately. We request relief.\n\nSincerely,\nOwner';
// plan: [{ ms, stop?, text? }, ...] one entry per model call; the last repeats
function install(plan) {
  clock = 1_000_000; calls = 0;
  Date.now = () => clock;
  AbortSignal.timeout = ms => ({ _ms: ms, aborted: false });
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/license/verify')) return new Response(JSON.stringify({ data: { enabled: true, product_link: 'Z3JNl' } }), { status: 200 });
    if (u.includes('/license/usage')) return new Response('{}', { status: 200 });
    const p = plan[Math.min(calls++, plan.length - 1)];
    const limit = init.signal?._ms ?? Infinity;
    if (p.ms > limit) { clock += limit; const e = new Error('timeout'); e.name = 'TimeoutError'; throw e; }
    clock += p.ms;
    return new Response(JSON.stringify({ stop_reason: p.stop || 'end_turn', content: [{ type: 'text', text: p.text ?? GOOD }] }), { status: 200 });
  };
}
test.afterEach(() => { globalThis.fetch = realFetch; Date.now = realNow; AbortSignal.timeout = realTimeout; });

function invoke(handler, body) {
  return new Promise(resolve => {
    const t0 = clock, out = { code: 200 };
    const done = () => { out.elapsed = clock - t0; resolve(out); };
    const res = { setHeader() {}, status(c) { out.code = c; return this; }, json(o) { out.body = o; done(); return this; }, end() { done(); return this; } };
    handler({ method: 'POST', body, headers: {} }, res);
  });
}
const SE_CRIT = [{ criterion: 'The use is compatible with the neighborhood', evidence: 'Same use on 3 adjacent lots' }];
const LETTERS = [
  ['Request a Special Exception', { criteria: SE_CRIT, enforceForbidden: true }],
  ['Oppose a Special Exception', { criteria: SE_CRIT, enforceForbidden: true }],
  ['Area/Setback Variance', {}], ['Use Variance', {}], ['Dimensional Variance', {}], ['Building Permit Denial', {}],
  ['Cease and Desist / Stop Work Order', {}], ['Non-Conforming Use Dispute', {}], ['Conditional Use Permit Denial', {}],
  ['Zoning Code Interpretation Dispute', {}], ['Sign Permit Denial', {}], ['Code Enforcement / Neighbor Complaint', {}],
  ['Other', {}], ['Opposing a granted variance', {}],
];
const gen = (kind, extra) => invoke(generate, {
  accessCode: 'ZF-MOCK-0001', state: 'Georgia', systemPrompt: kind === 'review' ? '' : 'sys', userPrompt: kind === 'review' ? '' : 'user',
  reviewMode: kind === 'review', draftLetter: kind === 'review' ? GOOD : '', ...extra,
});

test('budget constants leave headroom under the 60s Node limit', () => {
  assert.ok(HARD_MS <= 50_000 && RETRY_BEFORE_MS < HARD_MS && CHECKLIST_MODEL_MS <= 20_000);
});

test('every letter type x request kind x model behaviour stays within 50s (generate)', async () => {
  const delays = [5_000, 20_000, 23_000, 45_000, 90_000];
  let n = 0, maxElapsed = 0;
  for (const [type, extra] of LETTERS) for (const kind of ['draft', 'review', 'assertive']) {
    for (const d1 of delays) for (const d2 of delays) for (const trunc1 of [false, true]) for (const miss of [false, true]) {
      install([{ ms: d1, stop: trunc1 ? 'max_tokens' : 'end_turn', text: miss ? BAD_CITE : GOOD }, { ms: d2, text: miss ? BAD_CITE : GOOD }, { ms: d2, text: GOOD }]);
      const r = await gen(kind, { letterType: type, ...extra });
      n++; maxElapsed = Math.max(maxElapsed, r.elapsed);
      assert.ok(r.elapsed <= 50_000, `${type}/${kind} d1=${d1} d2=${d2} trunc=${trunc1} miss=${miss}: ${r.elapsed}ms`);
      assert.ok(r.code === 200 || r.code === 502 || r.code === 422, `status ${r.code}`);
      if (r.code === 200) assert.doesNotMatch(r.body.text, /99-99-99/, 'an unverified citation is never delivered');
    }
  }
  assert.ok(n > 4000 && maxElapsed <= 50_000);
});

test('slow first reply (47s) is delivered: one call, no retry, no regeneration', async () => {
  install([{ ms: 47_000 }]);
  const r = await gen('review', { letterType: 'Request a Special Exception', criteria: SE_CRIT });
  assert.equal(r.code, 200); assert.equal(calls, 1);
});

test('review whose first reply is truncated late does not start the retry', async () => {
  install([{ ms: 30_000, stop: 'max_tokens', text: 'cut' }, { ms: 10_000 }]);
  const r = await gen('review', { letterType: 'Request a Special Exception', criteria: SE_CRIT });
  assert.equal(r.code, 502); assert.equal(calls, 1); assert.ok(r.elapsed <= 30_000);
  assert.equal(r.body.text, undefined);
});

test('early truncation still retries once with the higher limit', async () => {
  install([{ ms: 8_000, stop: 'max_tokens', text: 'cut' }, { ms: 15_000 }]);
  const r = await gen('review', { letterType: 'Request a Special Exception', criteria: SE_CRIT });
  assert.equal(r.code, 200); assert.equal(calls, 2); assert.equal(r.body.text, GOOD);
});

test('late citation miss skips the regeneration and returns the stripped text; early miss regenerates', async () => {
  install([{ ms: 30_000, text: BAD_CITE }, { ms: 5_000 }]);
  let r = await gen('draft', { letterType: 'Use Variance' });
  assert.equal(r.code, 200); assert.equal(calls, 1); assert.doesNotMatch(r.body.text, /99-99-99/);
  install([{ ms: 8_000, text: BAD_CITE }, { ms: 9_000 }]);
  r = await gen('draft', { letterType: 'Use Variance' });
  assert.equal(r.code, 200); assert.equal(calls, 2); assert.equal(r.body.text, GOOD);
});

test('hung model: request answers 502 at the deadline, not a platform 504', async () => {
  install([{ ms: 600_000 }]);
  const r = await gen('review', { letterType: 'Request a Special Exception', criteria: SE_CRIT });
  assert.equal(r.code, 502); assert.equal(r.body.detail, 'timeout'); assert.equal(r.elapsed, HARD_MS);
});

const cl = (type, extra) => invoke(checklist, { accessCode: 'ZF-MOCK-0001', address: '1 Main St', state: 'Georgia', varianceType: type, letterExcerpt: 'x', direction: 'requesting', ...extra });
test('checklist: model time never exceeds 20s for any letter type; falls back to the type list', async () => {
  const items = JSON.stringify(Array.from({ length: 8 }, (_, i) => `Step ${i + 1}: keep dated records`));
  for (const type of Object.keys(TYPES)) for (const d1 of [3_000, 9_000, 19_000, 25_000, 90_000]) for (const d2 of [3_000, 19_000, 90_000]) for (const trunc of [false, true]) {
    install([{ ms: d1, stop: trunc ? 'max_tokens' : 'end_turn', text: items }, { ms: d2, text: items }]);
    const r = await cl(type);
    assert.ok(r.elapsed <= CHECKLIST_MODEL_MS, `${type} d1=${d1} d2=${d2} trunc=${trunc}: ${r.elapsed}`);
    assert.equal(r.code, 200); assert.ok(r.body.checklist.length >= 6);
  }
});
