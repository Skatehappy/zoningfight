// A11: auth gate. api/generate.js and api/checklist.js must NEVER reach api.anthropic.com
// without a passed Payhip verification (or a G4T test code when G4_TEST_CODE_SECRET is set).
// Stubbed fetch only: no real Payhip / Anthropic call, no real code.
import assert from 'assert';
process.env.PAYHIP_API_KEY = 'stub'; process.env.ANTHROPIC_API_KEY = 'stub';
delete process.env.G4_TEST_CODE_SECRET;
let payhipMode = 'valid', anthropic = 0, payhip = 0, usageMarks = 0;
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.includes('payhip.com/api/v1/license/usage')) { usageMarks++; return { status: 200, ok: true, json: async () => ({}) }; }
  if (u.includes('payhip.com')) {
    payhip++;
    if (payhipMode === 'down') throw new Error('network down');
    if (payhipMode === 'non-ok') return { status: 500, ok: false, json: async () => ({}) };
    if (payhipMode === 'bad-json') return { status: 200, ok: true, json: async () => { throw new Error('bad json'); } };
    if (payhipMode === 'invalid') return { status: 200, ok: true, json: async () => ({ data: null }) };
    if (payhipMode === 'disabled') return { status: 200, ok: true, json: async () => ({ data: { enabled: false, product_link: 'Z3JNl' } }) };
    if (payhipMode === 'wrong-product') return { status: 200, ok: true, json: async () => ({ data: { enabled: true, product_link: 'OTHER' } }) };
    return { status: 200, ok: true, json: async () => ({ data: { enabled: true, product_link: 'Z3JNl' } }) };
  }
  if (u.includes('api.anthropic.com')) {
    anthropic++;
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: '["a"]' }], stop_reason: 'end_turn' }) };
  }
  throw new Error('unexpected fetch ' + u);
};
const gen = (await import('../api/generate.js')).default;
const chk = (await import('../api/checklist.js')).default;
const call = async (handler, body) => {
  const out = { status: 0, json: null };
  const res = { setHeader() {}, status(s) { out.status = s; return this; }, json(j) { out.json = j; return this; }, end() { return this; } };
  await handler({ method: 'POST', body }, res); return out;
};
const handlers = { generate: gen, checklist: chk };
const CASES = [
  ['no code', undefined, 'valid', [401]],
  ['blank code', '   ', 'valid', [401]],
  ['fake code (Payhip says invalid)', 'FAKE-CODE-0000', 'invalid', [401]],
  ['disabled license', 'DISABLED', 'disabled', [401]],
  ['license for another product', 'OTHERPROD', 'wrong-product', [401]],
  ['Payhip non-200', 'ANYCODE', 'non-ok', [401, 503]],
  ['Payhip down', 'ANYCODE', 'down', [503]],
  ['Payhip bad JSON', 'ANYCODE', 'bad-json', [503]],
  ['G4T code with secret unset', 'G4T-abcdefghijklmnop', 'invalid', [401]],
  ['former hard-coded bypass keys', 'SMOKE-TEST-2026-BAO', 'invalid', [401]],
];
for (const [name, h] of Object.entries(handlers)) {
  for (const [label, code, mode, statuses] of CASES) {
    payhipMode = mode; anthropic = 0; usageMarks = 0;
    const r = await call(h, { accessCode: code, systemPrompt: 'x', userPrompt: 'x', address: 'a', state: 'Georgia' });
    assert(statuses.includes(r.status), `${name}: ${label} -> ${r.status}, expected ${statuses}`);
    assert.equal(anthropic, 0, `${name}: ${label} reached Anthropic`);
    assert.equal(usageMarks, 0, `${name}: ${label} marked usage`);
  }
}
// Positive control: a verified license DOES work, and the gate check ("Reply: VALID") makes no model call and never marks usage.
payhipMode = 'valid'; anthropic = 0; usageMarks = 0;
let r = await call(chk, { accessCode: 'REAL', address: 'a', state: 'Georgia' });
assert.equal(r.status, 200); assert.equal(anthropic, 1, 'checklist with a valid license calls the model once');
anthropic = 0;
for (let i = 0; i < 3; i++) {
  r = await call(gen, { accessCode: 'REAL', systemPrompt: 'Reply: VALID', userPrompt: 'check' });
  assert.equal(r.status, 200);
}
assert.equal(anthropic, 0, 'access check (x3) makes no model call'); assert.equal(usageMarks, 0, 'access check (x3) does not mark usage');
console.log('auth-gate mock test: ' + (CASES.length * 2) + ' denial cases + positive controls passed');
