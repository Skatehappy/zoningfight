// isCheckCall contract: the client's access check string must equal the server's, and the check
// must verify the license, make NO model call and NO usage mark (otherwise a real-code check burns
// the code / spends Anthropic money). Retrofit, gate A14.
import assert from 'assert'; import fs from 'fs';
process.env.PAYHIP_API_KEY = 'stub'; process.env.ANTHROPIC_API_KEY = 'stub'; delete process.env.G4_TEST_CODE_SECRET;
let anthropic = 0, marks = 0, valid = true;
globalThis.fetch = async url => {
  const u = String(url);
  if (u.includes('license/usage')) { marks++; return { status: 200, ok: true, json: async () => ({}) }; }
  if (u.includes('payhip.com')) return { status: valid ? 200 : 404, ok: valid, json: async () => ({ data: valid ? { enabled: true, product_link: 'Z3JNl' } : null }) };
  anthropic++; return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'x' }] }) };
};
const server = fs.readFileSync('api/generate.js', 'utf8'), client = fs.readFileSync('src/App.jsx', 'utf8');
const sv = server.match(/systemPrompt === '([^']+)'/)[1], cl = client.match(/systemPrompt: "([^"]+)", userPrompt: "check"/)[1];
assert.equal(cl, sv, 'client access-check string must equal the server isCheckCall string');
const { default: gen } = await import('../api/generate.js');
const call = async body => { const o = { status: 0, json: null }; await gen({ method: 'POST', body }, { setHeader() {}, status(s) { o.status = s; return this; }, json(j) { o.json = j; return this; }, end() { return this; } }); return o; };
for (let i = 0; i < 3; i++) { const r = await call({ accessCode: 'REAL', systemPrompt: cl, userPrompt: 'check' }); assert.equal(r.status, 200); assert.equal(r.json.text, 'VALID'); }
assert.equal(anthropic, 0); assert.equal(marks, 0);
valid = false; const r2 = await call({ accessCode: 'FAKE', systemPrompt: cl, userPrompt: 'check' });
assert.equal(r2.status, 401); assert.equal(anthropic, 0);
console.log('isCheckCall.test: PASS');
