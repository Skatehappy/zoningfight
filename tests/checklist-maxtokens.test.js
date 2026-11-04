// Checklist + generate: truncation handling and per-letter-type content (mocked Anthropic + Payhip; no network).
//  - stop_reason "max_tokens" is never parsed: retried once with a higher limit, then fallback / 502
//  - every letter type gets the model's items on success and its own fallback on forced failure
//  - fallback items carry no digits, no citations, no other-type or other-domain wording
//  - the citation/figure lock keeps type-appropriate verified-content items
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.PAYHIP_API_KEY = 'x'; process.env.ANTHROPIC_API_KEY = 'x'; delete process.env.G4_TEST_CODE_SECRET;
const CODE = 'ZF-MOCK-0001';  // a real-buyer code; Payhip is mocked below
const { default: checklist } = await import('../api/checklist.js');
const { default: generate } = await import('../api/generate.js');
const { TYPES, fallbackFor } = await import('../api/_checklist-fallbacks.js');
const { lintCitations, verifiedFor } = await import('../api/_citelint.js');
const { lintNumbers } = await import('../api/_numlint.js');
const { default: VERIFIED } = await import('../api/_verified-citations.json', { with: { type: 'json' } });

const TYPE_NAMES = Object.keys(TYPES);
const STATES = ['AL', 'AZ', 'CA', 'FL', 'GA', 'IL', 'NY', 'NC', 'OH', 'PA', 'TX'];
const realFetch = globalThis.fetch;
let calls, usage = 0;
function mockModel(replies) {
  calls = []; usage = 0;
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/license/verify')) return new Response(JSON.stringify({ data: { enabled: true, product_link: 'Z3JNl' } }), { status: 200 });
    if (u.includes('/license/usage')) { usage++; return new Response('{}', { status: 200 }); }
    assert.ok(u.includes('api.anthropic.com'), 'unexpected fetch: ' + u);
    const body = JSON.parse(init.body); calls.push(body);
    const r = replies[Math.min(calls.length - 1, replies.length - 1)];
    if (r.http) return new Response('boom', { status: r.http });
    return new Response(JSON.stringify({ stop_reason: r.stop || 'end_turn', content: [{ type: 'text', text: r.text }] }), { status: 200 });
  };
}
test.afterEach(() => { globalThis.fetch = realFetch; });

function invoke(handler, body) {
  return new Promise(resolve => {
    const out = { code: 200 };
    const res = { setHeader() {}, status(c) { out.code = c; return this; }, json(o) { out.body = o; resolve(out); return this; }, end() { resolve(out); return this; } };
    handler({ method: 'POST', body, headers: {} }, res);
  });
}
const callChecklist = async (varianceType, extra = {}) => {
  const r = await invoke(checklist, { accessCode: CODE, address: '1 Main St', state: 'Georgia', varianceType, letterExcerpt: 'excerpt', direction: 'requesting', ...extra });
  return { status: r.code, ...r.body };
};
const modelItems = type => Array.from({ length: 8 }, (_, i) => `Model step ${i + 1} for ${type}: keep dated records and send copies by certified mail`);

// Words that belong to one kind of matter only; they must not appear in any other type's fallback.
const EXCLUSIVE = [
  [/\bsigns?\b/i, ['Sign Permit Denial']],
  [/stop[- ]work|cease and desist/i, ['Cease and Desist / Stop Work Order']],
  [/non-conforming|grandfather/i, ['Non-Conforming Use Dispute']],
  [/conditional use/i, ['Conditional Use Permit Denial']],
  [/special exception/i, ['Request a Special Exception', 'Oppose a Special Exception']],
  [/setback/i, ['Area/Setback Variance']],
  [/interpret/i, ['Zoning Code Interpretation Dispute']],
  [/code enforcement|enforcement office/i, ['Code Enforcement / Neighbor Complaint']],
  [/objection|oppos/i, ['Opposing a granted variance', 'Oppose a Special Exception']],
  [/permit denial|denied building permit/i, ['Building Permit Denial']],
];
const OTHER_DOMAIN = /\b(deposit|tenants?|landlords?|lease|rent|eviction|habitability)\b/i;

test('the app covers every letter type the UI offers', () => {
  const expected = ['Area/Setback Variance', 'Use Variance', 'Dimensional Variance', 'Building Permit Denial', 'Cease and Desist / Stop Work Order', 'Non-Conforming Use Dispute', 'Conditional Use Permit Denial', 'Zoning Code Interpretation Dispute', 'Sign Permit Denial', 'Code Enforcement / Neighbor Complaint', 'Other', 'Opposing a granted variance', 'Request a Special Exception', 'Oppose a Special Exception'];
  assert.deepEqual([...TYPE_NAMES].sort(), [...expected].sort());
});

for (const type of TYPE_NAMES) {
  test(`checklist model path returns the model's items: ${type}`, async () => {
    mockModel([{ text: JSON.stringify(modelItems(type)) }]);
    const r = await callChecklist(type, { direction: /Oppos/.test(type) ? 'opposing' : 'requesting' });
    assert.equal(r.status, 200);
    assert.deepEqual(r.checklist, modelItems(type));
    assert.equal(r._diag, undefined, 'real buyers never see diagnostics');
    assert.ok(calls[0].messages[0].content.includes(TYPES[type].focus), 'prompt is built from this type focus');
    assert.equal(calls[0].max_tokens, 2000);
  });

  test(`forced model failure returns this type's own fallback (HTTP 200): ${type}`, async () => {
    mockModel([{ http: 500 }]);
    const r = await callChecklist(type);
    assert.equal(r.status, 200);
    assert.deepEqual(r.checklist, fallbackFor(type));
    assert.ok(r.checklist.length >= 6);
  });

  test(`fallback is verified-content-only and type-pure: ${type}`, () => {
    const items = fallbackFor(type);
    const text = items.join('\n');
    assert.ok(!/\d/.test(text), 'no digits at all');
    assert.doesNotMatch(text, OTHER_DOMAIN, 'no tenant/deposit wording');
    for (const ab of STATES) {
      const v = verifiedFor(VERIFIED, ab);
      for (const it of items) {
        assert.ok(lintCitations(it, v.keys, '', v.subs).ok, `no citation (${ab}): ${it}`);
        assert.ok(lintNumbers(it, v.abbr, '').ok, `no figure (${ab}): ${it}`);
      }
    }
    for (const [re, owners] of EXCLUSIVE) if (!owners.includes(type)) assert.doesNotMatch(text, re, `${type} fallback contains another type's wording ${re}`);
  });

  test(`citation/figure lock keeps type-appropriate verified content: ${type}`, async () => {
    const items = [`Get the ${type} application form and instructions from the town clerk`, 'Ask the clerk what the filing fee is and how to pay it', 'Request the complete record: application, staff report, minutes and findings of fact', 'Photograph the site from the street and rear', 'Calendar the appeal deadline once the clerk confirms it', 'Send the letter by certified mail, return receipt requested, and keep a copy'];
    for (const state of ['Georgia', 'Texas', 'Arizona', 'New York']) {
      mockModel([{ text: JSON.stringify(items) }]);
      const r = await callChecklist(type, { state });
      assert.deepEqual(r.checklist, items, `no valid item dropped for ${state}`);
    }
  });
}

test('lock still drops unverified citations and figures, then falls back below 3 survivors', async () => {
  const bad = ['File within 30 days per Ariz. Rev. Stat. § 9-462.06', 'Pay the $1,250 filing fee', 'See Zzyzx v. Nowhere, 999 U.S. 1', 'Confirm the schedule with the clerk'];
  mockModel([{ text: JSON.stringify(bad) }]);
  const r = await callChecklist('Use Variance', { state: 'Texas' });
  assert.deepEqual(r.checklist, fallbackFor('Use Variance'));
});

test('unknown or missing letter type gets the neutral list, no cross-type wording', async () => {
  mockModel([{ http: 500 }]);
  const r = await callChecklist(undefined);
  assert.equal(r.status, 200);
  assert.ok(r.checklist.length >= 6 && !/\d/.test(r.checklist.join(' ')));
  assert.doesNotMatch(r.checklist.join(' '), OTHER_DOMAIN);
  assert.doesNotMatch(r.checklist.join(' '), /\bsigns?\b|setback|variance|special exception/i);
});

test('checklist: unparseable reply falls back with HTTP 200', async () => {
  mockModel([{ text: 'Sure! Here is your list: 1) ...' }]);
  const r = await callChecklist('Sign Permit Denial');
  assert.equal(r.status, 200);
  assert.deepEqual(r.checklist, fallbackFor('Sign Permit Denial'));
});

test('checklist: truncated reply is retried once with a higher limit and the partial is never parsed', async () => {
  const partial = '["PARTIAL-ONLY item one", "PARTIAL-ONLY item two", "PARTIAL-ONLY item three", "PARTIAL-ONLY item f';
  mockModel([{ stop: 'max_tokens', text: partial }, { text: JSON.stringify(modelItems('Sign Permit Denial')) }]);
  const r = await callChecklist('Sign Permit Denial');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].max_tokens, 2000); assert.equal(calls[1].max_tokens, 4000);
  assert.deepEqual(r.checklist, modelItems('Sign Permit Denial'));
  assert.ok(!JSON.stringify(r).includes('PARTIAL-ONLY'));
});

test('checklist: truncated twice falls back to the type list and never uses partial output', async () => {
  const partial = '["PARTIAL-ONLY one", "PARTIAL-ONLY two", "PARTIAL-ONLY three", "PARTIAL-ONLY four"]';  // even a parseable body is ignored when truncated
  mockModel([{ stop: 'max_tokens', text: partial }, { stop: 'max_tokens', text: partial }]);
  const r = await callChecklist('Sign Permit Denial');
  assert.equal(r.status, 200);
  assert.equal(calls.length, 2, 'exactly one retry');
  assert.deepEqual(r.checklist, fallbackFor('Sign Permit Denial'));
  assert.ok(!JSON.stringify(r).includes('PARTIAL-ONLY'));
});

// ---- generate
const callGenerate = async body => invoke(generate, { accessCode: CODE, state: 'Georgia', systemPrompt: 'sys', userPrompt: 'Write the letter.\nSTATE: Georgia', ...body });

test('generate: truncated letter is retried once with a higher limit, then the full letter is returned', async () => {
  const letter = 'Dear Board, I respectfully request that the variance be granted. ';
  mockModel([{ stop: 'max_tokens', text: 'HALF A LETTER' }, { text: letter }]);
  const r = await callGenerate({});
  assert.equal(r.code, 200);
  assert.equal(calls[0].max_tokens, 3000); assert.equal(calls[1].max_tokens, 6000);
  assert.equal(r.body.text.trim(), letter.trim());
  assert.ok(!JSON.stringify(r.body).includes('HALF A LETTER'));
});

test('generate: truncated twice returns 502, never the partial letter, and the code is not marked used', async () => {
  mockModel([{ stop: 'max_tokens', text: 'HALF A LETTER ' + 'x'.repeat(400) }]);
  const r = await callGenerate({});
  assert.equal(r.code, 502);
  assert.equal(calls.length, 2, 'exactly one retry');
  assert.ok(!JSON.stringify(r.body).includes('HALF A LETTER'));
  assert.match(r.body.error, /not been used/);
  assert.equal(usage, 0, 'the license is NOT marked used when the letter was truncated');
});

test('generate: review call is also protected from truncation', async () => {
  mockModel([{ stop: 'max_tokens', text: 'HALF REVIEW' }]);
  const r = await callGenerate({ reviewMode: true, draftLetter: 'Dear Board, a draft.' });
  assert.equal(r.code, 502);
  assert.ok(!JSON.stringify(r.body).includes('HALF REVIEW'));
  assert.equal(usage, 0);
});

test('_diag is returned only when the G4T test code was used', async () => {
  process.env.G4_TEST_CODE_SECRET = 'mock-secret-0123456789';
  try {
    mockModel([{ stop: 'max_tokens', text: '["P"]' }, { stop: 'max_tokens', text: '["P"]' }]);
    const r = await callChecklist('Use Variance', { accessCode: 'G4T-mock-secret-0123456789' });
    assert.equal(r.status, 200);
    assert.equal(r._diag.usedFallback, true); assert.equal(r._diag.failed, 'truncated'); assert.equal(r._diag.attempts, 2);
    assert.deepEqual(r.checklist, fallbackFor('Use Variance'));
    mockModel([{ text: JSON.stringify(['Pay the $1,250 filing fee', 'a', 'b', 'c']) }]);
    const r2 = await callChecklist('Use Variance', { accessCode: 'G4T-mock-secret-0123456789' });
    assert.ok(r2._diag.droppedItems.length >= 1 && r2._diag.droppedItems[0].nums.length >= 1);
    mockModel([{ http: 500 }]);
    const r3 = await callChecklist('Use Variance');   // real-buyer code, secret set
    assert.equal(r3._diag, undefined);
  } finally { delete process.env.G4_TEST_CODE_SECRET; }
});
