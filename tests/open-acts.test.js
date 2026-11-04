// Public records act vs open meetings act, for every supported state: the verified set offers the records act for a records
// request, the meetings act only for meetings issues, and the lint flags a records-request sentence citing the meetings act.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

process.env.PAYHIP_API_KEY = 'x'; process.env.ANTHROPIC_API_KEY = 'x'; delete process.env.G4_TEST_CODE_SECRET;
const { OPEN_ACTS, openActsRule, lintRecordsMeetings } = await import('../api/_open-acts.js');
const { verifiedFor, citationRules } = await import('../api/_citelint.js');
const { citations } = await import('../api/_cites.js');
const { default: generate } = await import('../api/generate.js');
const VERIFIED = JSON.parse(fs.readFileSync('api/_verified-citations.json', 'utf8'));
const STATE_DATA = JSON.parse(fs.readFileSync('scripts/data/state-data.json', 'utf8'));
const STATES = Object.keys(STATE_DATA.states || STATE_DATA);
const NAME = { CA: 'California', TX: 'Texas', FL: 'Florida', NY: 'New York', IL: 'Illinois', PA: 'Pennsylvania', OH: 'Ohio', GA: 'Georgia', NC: 'North Carolina', AZ: 'Arizona' };

test('every supported state has a records act and a distinct meetings act, both in its verified set', () => {
  assert.equal(STATES.length, 10);
  for (const ab of STATES) {
    const a = OPEN_ACTS[ab]; assert.ok(a, ab);
    const v = verifiedFor(VERIFIED, NAME[ab]);
    for (const k of [...a.records.keys, ...a.meetings.keys]) assert.ok(v.keys.has(k), `${ab}: ${k} not in verified set`);
    for (const k of a.records.keys) assert.ok(!a.meetings.keys.includes(k), `${ab}: ${k} shared`);
    assert.notEqual(a.records.cite, a.meetings.cite);
    // each cite string reduces to its own keys under the repo extractor
    const rk = [...citations(a.records.cite)].map(([k]) => k), mk = [...citations(a.meetings.cite)].map(([k]) => k);
    assert.ok(a.records.keys.some(k => rk.includes(k)), `${ab}: records cite yields none of its keys`);
    assert.ok(a.meetings.keys.some(k => mk.includes(k)), `${ab}: meetings cite yields none of its keys`);
    assert.ok(!mk.some(k => a.records.keys.includes(k)) && !rk.some(k => a.meetings.keys.includes(k)), `${ab}: cites overlap`);
  }
});

test('Georgia: Open Records Act 50-18-70/71 is verified and logged with the three-business-day figure; 50-14-1 stays meetings-only', () => {
  const ga = verifiedFor(VERIFIED, 'Georgia');
  assert.ok(ga.keys.has('S:50-18-70') && ga.keys.has('S:50-18-71') && ga.keys.has('S:50-14-1'));
  assert.deepEqual(OPEN_ACTS.GA.records.keys, ['S:50-18-70', 'S:50-18-71']);
  assert.deepEqual(OPEN_ACTS.GA.meetings.keys, ['S:50-14-1']);
  const log = fs.readFileSync('VERIFICATION_LOG-SEO-CONTENT.md', 'utf8');
  const row = log.split(/\r?\n/).find(l => l.startsWith('| O.C.G.A. § 50-18-71 |'));
  assert.ok(row && /three business days/.test(row) && /Official: https:\/\/www\.legis\.ga\.gov/.test(row) && /verified_on: 2026-11-04/.test(row));
});

test('prompt rule per state: records request -> records act; meetings act only for meetings issues', () => {
  for (const ab of STATES) {
    const a = OPEN_ACTS[ab], rule = openActsRule(ab);
    assert.ok(rule.includes(a.records.cite) && rule.includes(a.meetings.cite), ab);
    assert.ok(rule.indexOf(a.records.cite) < rule.indexOf(a.meetings.cite), `${ab}: records act must come first`);
    assert.match(rule, /request for records, documents or copies must rest on the state public-records act/);
    assert.match(rule, /open-meetings act only for open-meetings issues/);
    assert.match(rule, /never as the authority for a records request/);
    // the citation lock lists the records act's cite as an allowed authority for the state
    const lock = citationRules(verifiedFor(VERIFIED, NAME[ab]));
    for (const k of a.records.keys) assert.ok(verifiedFor(VERIFIED, NAME[ab]).keys.has(k));
    assert.ok(lock.length > 100);
  }
  assert.match(openActsRule(null), /public-records act/);
});

test('lint: a records-request sentence citing the meetings act is flagged; correct and meetings sentences are not', () => {
  for (const ab of STATES) {
    const a = OPEN_ACTS[ab];
    const wrong = `Please provide copies of all records relating to the denial, which I request under ${a.meetings.cite}.`;
    const right = `Please provide copies of all records relating to the denial, which I request under ${a.records.cite}.`;
    const meet = `The notice of the hearing did not comply with ${a.meetings.cite}.`;
    const meetRecords = `I also request the minutes of the board meeting, as ${a.meetings.cite} requires the meeting to be open.`;
    assert.equal(lintRecordsMeetings(wrong, ab).ok, false, `${ab}: wrong not flagged`);
    assert.equal(lintRecordsMeetings(right, ab).ok, true, `${ab}: right flagged`);
    assert.equal(lintRecordsMeetings(meet, ab).ok, true, `${ab}: meetings issue flagged`);
    assert.equal(lintRecordsMeetings(meetRecords, ab).ok, true, `${ab}: meeting-related sentence flagged`);
    const letter = `Dear Board,\n\n${wrong} Thank you for your attention.\n\n${meet}\n\nSincerely,\n[Your Name]`;
    const l = lintRecordsMeetings(letter, ab);
    const stripped = l.strip(letter);
    assert.ok(!stripped.includes('I request under') && stripped.includes('did not comply'), `${ab}: strip`);
    assert.equal(lintRecordsMeetings(stripped, ab).ok, true);
  }
  assert.equal(lintRecordsMeetings('Any text', 'ZZ').ok, true);
});

test('generate: Georgia letter whose records paragraph cites 50-14-1 is regenerated with the Open Records Act', async () => {
  const BAD = 'Dear Board,\n\nI request copies of all records related to the permit denial under the Open Meetings Act, O.C.G.A. § 50-14-1.\n\nSincerely,\n[Your Name]';
  const GOOD = 'Dear Board,\n\nI request copies of all records related to the permit denial under the Georgia Open Records Act, O.C.G.A. § 50-18-70 et seq.\n\nSincerely,\n[Your Name]';
  const realFetch = globalThis.fetch; let calls = 0, systems = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/license/verify')) return new Response(JSON.stringify({ data: { enabled: true, product_link: 'Z3JNl' } }), { status: 200 });
    systems.push(JSON.parse(init.body).system);
    return new Response(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: calls++ === 0 ? BAD : GOOD }] }), { status: 200 });
  };
  try {
    const out = await new Promise(resolve => {
      const o = { code: 200 };
      generate({ method: 'POST', body: { accessCode: 'ZF-MOCK-0001', state: 'Georgia', systemPrompt: 's', userPrompt: 'u', letterType: 'Building Permit Denial' }, headers: {} },
        { setHeader() {}, status(c) { o.code = c; return this; }, json(b) { o.body = b; resolve(o); return this; }, end() { resolve(o); return this; } });
    });
    assert.equal(out.code, 200); assert.equal(out.body.text, GOOD); assert.equal(calls, 2);
    assert.match(systems[0], /Georgia Open Records Act \(O\.C\.G\.A\. § 50-18-70 et seq\.\)/);
    assert.match(systems[1], /records request/);
  } finally { globalThis.fetch = realFetch; }
});
