// Extended citation lock (gate A14): subsection-level match, numeric-claims check, checklist lock.
import assert from 'assert';
process.env.PAYHIP_API_KEY = 'stub'; process.env.ANTHROPIC_API_KEY = 'stub'; delete process.env.G4_TEST_CODE_SECRET;
let script = [], systems = [];
globalThis.fetch = async (url, opts = {}) => {
  if (String(url).includes('payhip.com')) return { status: 200, ok: true, json: async () => ({ data: { enabled: true, product_link: 'Z3JNl' } }) };
  const b = JSON.parse(opts.body); systems.push(b.system || '');
  return { ok: true, json: async () => ({ content: [{ type: 'text', text: script.shift() ?? 'Dear Board,\n\nClean.' }], stop_reason: 'end_turn' }) };
};
const { default: gen } = await import('../api/generate.js');
const { default: chk } = await import('../api/checklist.js');
const call = async (h, body) => { const o = { status: 0, json: null }; await h({ method: 'POST', body }, { setHeader() {}, status(s) { o.status = s; return this; }, json(j) { o.json = j; return this; }, end() { return this; } }); return o; };
const az = { accessCode: 'REAL', systemPrompt: 'attorney', userPrompt: 'Write a letter.', state: 'Arizona' };

// 1. subsection: 9-462.06(K) is logged; (Z) is not -> regenerated, then stripped
script = ['Dear Board,\n\nA special action lies under A.R.S. § 9-462.06(K). Another rule appears in A.R.S. § 9-462.06(Z).', 'Dear Board,\n\nA special action lies under A.R.S. § 9-462.06(K). Another rule appears in A.R.S. § 9-462.06(Z).'];
let r = await call(gen, az);
assert(/9-462\.06\(K\)/.test(r.json.text) && !/\(Z\)/.test(r.json.text), 'unverified subsection stripped, verified subsection kept');
assert(/Cite a subsection/.test(systems[0]), 'prompt tells the model about subsection rule');
// 2. section-only cite stays allowed
script = ['Dear Board,\n\nSee A.R.S. § 9-462.06 generally.']; r = await call(gen, az); assert(/9-462\.06/.test(r.json.text));
// 3. numeric: contradicted AZ board deadline + invented fee + small-claims cap are stripped; regenerated first
const NUM = 'Dear Board,\n\nYou must appeal to the Board of Adjustment within 30 days. The filing fee is $349 in superior court. Small claims court is capped at $3,500. We request a hearing.';
systems = []; script = [NUM, NUM]; r = await call(gen, az);
assert(!/30 days|\$349|\$3,500/.test(r.json.text) && /request a hearing/.test(r.json.text), 'contradicted/unsourced figures stripped: ' + r.json.text);
assert(/Do NOT use any of the following/.test(systems[1]), 'regeneration instruction names the figures');
// 4. a figure the user typed is allowed
systems = []; script = ['Dear Board,\n\nThe filing fee is $349 as stated.']; r = await call(gen, { ...az, userPrompt: 'Filing fee paid: $349' });
assert(/\$349/.test(r.json.text), 'user-supplied figure kept');
// 5. checklist: items with unverified cites / figures dropped; clean items kept; prompt carries rules
script = [JSON.stringify(['Completed application form', 'Pay the $349 filing fee', 'Cite A.R.S. § 99-999.9 in the cover note', 'Photographs of the property', 'Survey or plot plan'])];
systems = []; r = await call(chk, { accessCode: 'REAL', address: '1 Main St', state: 'Arizona', varianceType: 'Area variance', letterExcerpt: '' });
assert.equal(r.status, 200); assert.deepEqual(r.json.checklist, ['Completed application form', 'Photographs of the property', 'Survey or plot plan']);
assert(/CITATION RULES/.test(systems[0]) && /FIGURE RULES/.test(systems[0]), 'checklist prompt carries citation + figure rules');
console.log('citelock-extended.test: PASS');
