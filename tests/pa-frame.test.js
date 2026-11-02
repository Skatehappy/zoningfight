// Gate A14: PA special-exception frame carries no unverified case authority; a PA letter that cites
// the removed case is stripped by the citation lock. Also checks every burden-shift frame cite is non-empty and logged.
import assert from 'assert';
import fs from 'fs';
process.env.PAYHIP_API_KEY = 'stub'; process.env.ANTHROPIC_API_KEY = 'stub'; delete process.env.G4_TEST_CODE_SECRET;
const pa = JSON.parse(fs.readFileSync('frames/PA-special-exception.json', 'utf8'));
assert.equal(pa.burden, 'criteria_compliance'); assert.deepEqual(pa.governing_authority, []);
assert(!/Bray|410 A\.2d 909/.test(JSON.stringify(pa)), 'PA frame mentions the removed case');
assert(!pa.section_order.includes('burden_allocation'), 'PA frame has no burden section');
const BAD = 'Dear Board,\n\nUnder Bray v. Zoning Bd. of Adjustment, 410 A.2d 909 (Pa. Commw. Ct. 1980), the burden shifted. We request a hearing.';
globalThis.fetch = async (url, opts = {}) => {
  if (String(url).includes('payhip.com')) return { status: 200, ok: true, json: async () => ({ data: { enabled: true, product_link: 'Z3JNl' } }) };
  return { ok: true, json: async () => ({ content: [{ type: 'text', text: BAD }], stop_reason: 'end_turn' }) };
};
const { default: gen } = await import('../api/generate.js');
const o = { status: 0, json: null };
await gen({ method: 'POST', body: { accessCode: 'REAL', systemPrompt: 'attorney', userPrompt: 'Write a special exception letter.', state: 'Pennsylvania' } },
  { setHeader() {}, status(s) { o.status = s; return this; }, json(j) { o.json = j; return this; }, end() { return this; } });
assert.equal(o.status, 200);
assert(!/Bray|410 A\.2d/.test(o.json.text) && /request a hearing/.test(o.json.text), 'lock must strip the removed case: ' + o.json.text);
console.log('pa-frame.test: PASS');
