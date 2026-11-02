// Payhip contract test (stubbed fetch, no network): verify URL/header/product, fail-closed on every
// non-valid outcome, and the delivery-confirmed usage mark (PUT /license/usage) fires once and only
// after { markUsed:true }. Retrofit, gate A14.
import assert from 'assert';
process.env.PAYHIP_API_KEY = 'stub-payhip'; process.env.ANTHROPIC_API_KEY = 'stub-anthropic'; delete process.env.G4_TEST_CODE_SECRET;
const calls = []; let mode = 'valid';
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url); calls.push({ u, opts });
  if (u.includes('payhip.com/api/v1/license/usage')) return { status: 200, ok: true, json: async () => ({}) };
  if (u.includes('payhip.com/api/v1/license/verify')) {
    if (mode === 'down') throw new Error('down');
    if (mode === 'invalid') return { status: 200, ok: true, json: async () => ({ data: null }) };
    return { status: 200, ok: true, json: async () => ({ data: { enabled: true, product_link: 'Z3JNl' } }) };
  }
  if (u.includes('api.anthropic.com')) return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'Dear Board,\n\nA clean letter.' }], stop_reason: 'end_turn' }) };
  throw new Error('unexpected ' + u);
};
const { default: gen } = await import('../api/generate.js');
const call = async body => { const o = { status: 0, json: null }; await gen({ method: 'POST', body }, { setHeader() {}, status(s) { o.status = s; return this; }, json(j) { o.json = j; return this; }, end() { return this; } }); return o; };
const n = f => calls.filter(c => c.u.includes(f)).length;

let r = await call({ accessCode: 'ABC DEF', systemPrompt: 's', userPrompt: 'u', state: 'Georgia' });
assert.equal(r.status, 200);
const v = calls.find(c => c.u.includes('license/verify'));
assert(v.u.includes('product_link=Z3JNl') && v.u.includes('license_key=ABC%20DEF'), 'verify uses product_link + url-encoded key');
assert.equal(v.opts.headers['payhip-api-key'], 'stub-payhip', 'payhip key sent to payhip only');
assert(calls.filter(c => !c.u.includes('payhip.com')).every(c => c.u.startsWith('https://api.anthropic.com/')), 'no key sent anywhere else');
assert.equal(n('license/usage'), 0, 'generation attempt does not consume the code');
calls.length = 0;
r = await call({ accessCode: 'ABC', markUsed: true });
assert.equal(r.status, 200); assert.equal(n('license/usage'), 1, 'markUsed marks exactly once'); assert.equal(n('anthropic'), 0);
const put = calls.find(c => c.u.includes('license/usage'));
assert.equal(put.opts.method, 'PUT'); assert(put.opts.body.includes('product_link=Z3JNl') && put.opts.body.includes('license_key=ABC'));
for (const m of ['invalid', 'down']) { mode = m; calls.length = 0; r = await call({ accessCode: 'X', markUsed: true }); assert([401, 503].includes(r.status), m); assert.equal(n('license/usage'), 0, 'invalid/down never marks usage'); assert.equal(n('anthropic'), 0); }
console.log('payhip-mock.test: PASS');
