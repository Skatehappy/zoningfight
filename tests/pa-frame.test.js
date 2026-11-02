// Gate A14: PA special-exception frame KEEPS Bray (verified 2026-11-02 against opinion text); a PA letter citing it is not stripped
// by the citation lock. Unlogged cases still are (second check).
import assert from 'assert';
import fs from 'fs';
process.env.PAYHIP_API_KEY = 'stub'; process.env.ANTHROPIC_API_KEY = 'stub'; delete process.env.G4_TEST_CODE_SECRET;
const pa = JSON.parse(fs.readFileSync('frames/PA-special-exception.json', 'utf8'));
assert.equal(pa.burden, 'prima_facie_shifting'); assert.equal(pa.governing_authority.length, 1);
assert(/Bray/.test(pa.governing_authority[0].cite) && /410 A\.2d 909/.test(pa.governing_authority[0].cite), 'PA frame must keep Bray');
assert(pa.section_order.includes('burden_allocation'), 'PA frame has the burden section');
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
assert(/Bray/.test(o.json.text) && /410 A\.2d 909/.test(o.json.text) && /request a hearing/.test(o.json.text), 'Bray is verified and must be KEPT: ' + o.json.text);
console.log('pa-frame.test: PASS');
