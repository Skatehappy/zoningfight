// Mock test for S6 + S7: stubbed fetch only — no Payhip call, no Anthropic call, no real code.
import assert from 'assert';
process.env.PAYHIP_API_KEY = 'stub'; process.env.ANTHROPIC_API_KEY = 'stub';
const calls = { payhip: 0, anthropic: 0, systems: [] };
let script = [];
globalThis.fetch = async (url, opts = {}) => {
  if (String(url).includes('payhip.com')) { calls.payhip++; return { status: 200, ok: true, json: async () => ({ data: { enabled: true, product_link: 'Z3JNl' } }) }; }
  calls.anthropic++; calls.systems.push(JSON.parse(opts.body).system || '');
  const text = script.shift() ?? 'Dear Board,\n\nThis is a clean letter.';
  return { ok: true, json: async () => ({ content: [{ type: 'text', text }], stop_reason: 'end_turn' }) };
};
const { default: handler } = await import('../api/generate.js');
const { _resetTestBudget, TEST_DAILY_MODEL_CALLS } = await import('../api/_g4t.js');
const call = async body => {
  const out = { status: 0, json: null }, res = { setHeader() {}, status(s) { out.status = s; return this; }, json(j) { out.json = j; return this; }, end() { return this; } };
  await handler({ method: 'POST', body }, res); return out;
};
const base = { accessCode: 'REALCODE', systemPrompt: 'You are a zoning attorney.', userPrompt: 'Write a letter. STATE: Pennsylvania. Board rule: Section 4.2 of our ordinance.', state: 'Pennsylvania', letterType: 'variance' };
const FAKE = 'Under Fakeland v. Nowhere, 999 Pa. 1 (2099), the board erred.';
const GOOD = 'Under 53 P.S. § 10910.2 the board must find unnecessary hardship.';

// 1. fake citation in BOTH responses -> regenerated once, then sentence stripped
script = [`Dear Board,\n\n${GOOD} ${FAKE} We request a hearing.`, `Dear Board,\n\n${GOOD} ${FAKE} We request a hearing.`];
let r = await call(base);
assert.equal(r.status, 200); assert.equal(calls.anthropic, 2, 'regenerated exactly once');
assert(!/Fakeland/.test(r.json.text), 'fake case stripped'); assert(/10910\.2/.test(r.json.text), 'verified cite kept'); assert(/request a hearing/.test(r.json.text));
assert(/CITATION RULES/.test(calls.systems[0]) && /10910\.2/.test(calls.systems[0]), 'verified list injected server-side');
assert(/Do NOT cite any of the following/.test(calls.systems[1]) && /Fakeland/.test(calls.systems[1]), 'regen instruction names the miss');

// 2. fake in first, clean on regeneration -> delivered unchanged, 2 model calls
calls.anthropic = 0; script = [`Dear Board,\n\n${FAKE}`, `Dear Board,\n\n${GOOD}`];
r = await call(base); assert.equal(calls.anthropic, 2); assert(/10910\.2/.test(r.json.text) && !/Fakeland/.test(r.json.text));

// 3. fake statute number (not a case), user-typed Section 4.2 allowed
calls.anthropic = 0; script = ['Dear Board,\n\nSee 53 P.S. § 99999.9 for the rule. Section 4.2 of the ordinance controls.', 'Dear Board,\n\nSee 53 P.S. § 99999.9 for the rule. Section 4.2 of the ordinance controls.'];
r = await call(base); assert(!/99999/.test(r.json.text) && /Section 4\.2/.test(r.json.text), 'fake statute stripped; user-typed cite kept');

// 4. G4T: inert without env; works with env; skips Payhip; capped
calls.payhip = 0; delete process.env.G4_TEST_CODE_SECRET; script = [];
r = await call({ ...base, accessCode: 'G4T-abcdefghijklmnop' }); assert.equal(r.status, 200); assert.equal(calls.payhip, 1, 'without the env var G4T- goes through normal Payhip verification');
process.env.G4_TEST_CODE_SECRET = 'abcdefghijklmnop'; calls.payhip = 0; _resetTestBudget();
r = await call({ ...base, accessCode: 'G4T-abcdefghijklmnop' }); assert.equal(r.status, 200); assert.equal(calls.payhip, 0, 'test code skips Payhip');
r = await call({ accessCode: 'G4T-abcdefghijklmnop', markUsed: true }); assert.equal(r.status, 200); assert.equal(calls.payhip, 0, 'test code skips usage mark');
r = await call({ ...base, accessCode: 'G4T-wrongwrongwrong0' }); assert.equal(calls.payhip, 1, 'wrong G4T- value falls to Payhip');
calls.payhip = 0; _resetTestBudget(); let last;
for (let i = 0; i < TEST_DAILY_MODEL_CALLS + 1; i++) last = await call({ ...base, accessCode: 'G4T-abcdefghijklmnop' });
assert.equal(last.status, 429, 'cap enforced');
console.log('citation-lock + G4T mock tests PASS');
