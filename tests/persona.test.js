// "No attorney voice": letters are written and signed by the user. Lint patterns, generate-time regeneration / 502,
// checklist item filter, prompts carry the user-signs rule and contain no banned phrase, static content is clean.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

process.env.PAYHIP_API_KEY = 'x'; process.env.ANTHROPIC_API_KEY = 'x'; delete process.env.G4_TEST_CODE_SECRET;
const { findPersona, USER_SIGNS_RULE, PERSONA_PATTERNS } = await import('../api/_persona.js');
const { default: generate } = await import('../api/generate.js');
const { default: checklist } = await import('../api/checklist.js');
const { buildFramePrompt } = await import('../src/lib/prompt.js');

const BANNED = [
  'Attorney for the Owner', 'attorney for the owner', 'ATTORNEY FOR THE OWNER', 'Attorney  for the Owner', 'Attorney\nfor the Owner', 'Attorney for the Owner',
  'Respectfully,\nCounsel for the Owner', 'counsel for the applicant', 'John Smith, Esq.', 'John Smith, ESQ', 'John Smith Esquire',
  'on behalf of my client', 'ON  BEHALF OF MY CLIENT', 'on behalf of\nmy client', 'on behalf of our clients',
  'This firm represents the owner', 'this  firm represents', 'my client', 'our client', 'Attorney at Law', 'attorney-at-law', 'Law Office of Smith',
  'Sincerely,\nThe Attorney for the Owner', 'He said “Attorney for” the Owner',
];
const LEGIT = [
  'You may wish to consult an attorney.', 'You may wish to consult an attorney for advice on the appeal.', 'consult counsel for advice',
  'an attorney’s fees may be recoverable under 42 U.S.C. § 1988', "attorney's fees where the statute provides", 'recover attorney fees under A.R.S. 12-348',
  'Consider a consult with a local land use attorney if the board does not respond', 'contact a zoning attorney for help', 'The county attorney for the Board will respond',
  'I am the owner of the property and I request a variance.', 'Sincerely,\n[Your Name]', 'Esquimalt Road',
];

test('every banned phrase and its case/spacing/curly-quote variants is detected', () => {
  for (const t of BANNED) assert.ok(findPersona(t).length > 0, `not detected: ${JSON.stringify(t)}`);
  assert.equal(PERSONA_PATTERNS.length >= 9, true);
});

test('legitimate text is not flagged', () => {
  for (const t of LEGIT) assert.deepEqual(findPersona(t), [], `false positive: ${JSON.stringify(t)}`);
});

function invoke(handler, body) {
  return new Promise(resolve => {
    const out = { code: 200 };
    const res = { setHeader() {}, status(c) { out.code = c; return this; }, json(o) { out.body = o; resolve(out); return this; }, end() { resolve(out); return this; } };
    handler({ method: 'POST', body, headers: {} }, res);
  });
}
const CLEAN = 'Dear Board,\n\nI request that the denial be reversed.\n\nSincerely,\n[Your Name]';
const realFetch = globalThis.fetch;
let seen = [], usageCalls = 0;
function mock(replies) {
  seen = []; usageCalls = 0;
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/license/verify')) return new Response(JSON.stringify({ data: { enabled: true, product_link: 'Z3JNl' } }), { status: 200 });
    if (u.includes('/license/usage')) { usageCalls++; return new Response('{}', { status: 200 }); }
    const body = JSON.parse(init.body); seen.push(body);
    const text = replies[Math.min(seen.length - 1, replies.length - 1)];
    return new Response(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text }] }), { status: 200 });
  };
}
test.afterEach(() => { globalThis.fetch = realFetch; });
const req = (extra = {}) => ({ accessCode: 'ZF-MOCK-0001', state: 'Georgia', systemPrompt: 'sys', userPrompt: 'user', letterType: 'Building Permit Denial', ...extra });

test('model emits "Attorney for the Owner" then a clean letter: clean letter returned after one regeneration naming the phrase', async () => {
  mock(['Dear Board,\n\nPlease reverse.\n\nSincerely,\nAttorney for the Owner', CLEAN]);
  const r = await invoke(generate, req());
  assert.equal(r.code, 200); assert.equal(r.body.text, CLEAN);
  assert.equal(seen.length, 2);
  assert.match(seen[1].system, /Attorney for/); assert.match(seen[1].system, /rejected/);
  assert.equal(usageCalls, 0);
});

test('model emits it twice: HTTP 502, offending text never returned, code not marked used', async () => {
  const BAD = 'Dear Board,\n\nThis firm represents the owner.\n\nSincerely,\nAttorney for the Owner';
  mock([BAD, BAD]);
  const r = await invoke(generate, req());
  assert.equal(r.code, 502);
  assert.equal(r.body.text, undefined);
  assert.doesNotMatch(JSON.stringify(r.body), /represents the owner/);
  assert.equal(usageCalls, 0);
});

test('applies to review mode too (draft, review and the assertive version all go through generate)', async () => {
  mock(['Sincerely,\nCounsel for Owner', CLEAN]);
  const r = await invoke(generate, req({ systemPrompt: '', userPrompt: '', reviewMode: true, draftLetter: CLEAN }));
  assert.equal(r.code, 200); assert.equal(r.body.text, CLEAN);
});

test('every letter type: the server system prompt carries the user-signs rule and no banned phrase', async () => {
  const TYPES = ['Area/Setback Variance', 'Use Variance', 'Dimensional Variance', 'Building Permit Denial', 'Cease and Desist / Stop Work Order', 'Non-Conforming Use Dispute', 'Conditional Use Permit Denial', 'Zoning Code Interpretation Dispute', 'Sign Permit Denial', 'Code Enforcement / Neighbor Complaint', 'Other', 'Opposing a granted variance', 'Request a Special Exception', 'Oppose a Special Exception'];
  for (const t of TYPES) for (const review of [false, true]) {
    mock([CLEAN]);
    await invoke(generate, req({ letterType: t, reviewMode: review, systemPrompt: review ? '' : 'sys', userPrompt: review ? '' : 'u', draftLetter: review ? CLEAN : '' }));
    assert.ok(seen[0].system.includes(USER_SIGNS_RULE), `${t}: rule missing`);
    assert.deepEqual(findPersona(seen[0].system), [], `${t}: banned phrase in system prompt`);
    assert.deepEqual(findPersona(JSON.stringify(seen[0].messages)), [], `${t}: banned phrase in messages`);
  }
});

test('client prompts (App.jsx) and frame prompts: user-signs rule present, no banned phrase, no attorney persona', () => {
  const app = fs.readFileSync('src/App.jsx', 'utf8');
  assert.match(app, /USER_SIGNS_RULE/);
  assert.match(app, /pickSystemPrompt = \(varianceType\) => `\$\{pickBasePrompt\(varianceType\)\}/);
  assert.deepEqual(findPersona(app), []);
  assert.doesNotMatch(app, /You are an expert [^.`"]*attorney/i);
  const frames = fs.readdirSync('frames').filter(f => f.endsWith('.json'));
  assert.ok(frames.length > 0);
  for (const f of frames) for (const posture of ['requesting', 'opposing']) {
    const frame = JSON.parse(fs.readFileSync('frames/' + f, 'utf8'));
    const p = buildFramePrompt(frame, { formData: { state: 'Georgia' }, criteriaRows: [], applicationType: 'Request a Special Exception', posture });
    assert.ok(p.system.includes(USER_SIGNS_RULE), `${f}/${posture}: rule missing`);
    assert.deepEqual(findPersona(p.system), [], `${f}/${posture}`);
    assert.doesNotMatch(p.system, /expert [^.]*attorney/i);
  }
});

test('static templates, rendered pages and sample content contain none of the banned phrases', () => {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (['node_modules', 'dist', '.git'].includes(e.name) ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
  const files = [...walk('public'), ...walk('scripts/templates'), ...walk('scripts/data'), ...walk('frames'), ...walk('src'), ...walk('hosts'), 'index.html', 'api/_checklist-fallbacks.js'].filter(f => /\.(html|js|mjs|jsx|json)$/.test(f));
  assert.ok(files.length > 50);
  for (const f of files) assert.deepEqual(findPersona(fs.readFileSync(f, 'utf8')), [], f);
});

test('checklist: an item with attorney voice is dropped; too few survivors -> type fallback', async () => {
  const items = JSON.stringify(['Send the letter by certified mail with return receipt', 'Sign as Attorney for the Owner', 'Keep a copy of everything you send', 'Photograph the property', 'This firm represents the owner in the filing', 'Ask the clerk about the filing process']);
  mock([items]);
  const out = await invoke(checklist, { accessCode: 'ZF-MOCK-0001', address: '1 Main St', state: 'Georgia', varianceType: 'Building Permit Denial' });
  assert.equal(out.code, 200);
  assert.equal(out.body.checklist.length, 4);
  assert.deepEqual(findPersona(out.body.checklist.join('\n')), []);
  mock([JSON.stringify(['Sign as Attorney for the Owner', 'Counsel for the owner files it', 'one ok step'])]);
  const out2 = await invoke(checklist, { accessCode: 'ZF-MOCK-0001', address: '1 Main St', state: 'Georgia', varianceType: 'Building Permit Denial' });
  assert.equal(out2.code, 200); assert.ok(out2.body.checklist.length >= 3);
  assert.deepEqual(findPersona(out2.body.checklist.join('\n')), []);
});
