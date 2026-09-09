// scripts/acceptance-test.mjs — §8 sampled acceptance tests against the live model.
// Samples 10 jurisdictions across the alphabet (incl. all 4 shift states) and, per
// special_exception frame: (1) filled criteria -> 0 hardship terms; (2) blank criteria
// -> bracketed placeholder, no invented criteria, no leftover markers.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildFramePrompt } from '../src/lib/prompt.js';

const here = dirname(fileURLToPath(import.meta.url));
const framesDir = join(here, '..', 'frames');
const ENDPOINT = 'https://zoningfight.com/api/generate';
const SMOKE = 'SMOKE-TEST-2026-BAO';
const HARDSHIP = ['hardship', 'practical difficulty', 'exceptional difficulty', 'undue hardship', 'unnecessary hardship'];
const SAMPLE = ['AL', 'CO', 'GA', 'IL', 'MD', 'NC', 'NY', 'PA', 'TX', 'WY']; // spread A–W; MD/NC/NY/PA = shift

const filled = [
  { criterion: 'The proposed use is compatible with surrounding uses', evidence: 'Adjacent parcels are similarly zoned; hours are limited.' },
  { criterion: 'Adequate ingress and egress is provided', evidence: 'Two curb cuts on the arterial; under 20 trips/day.' },
];

async function call(system, user, extra) {
  const res = await fetch(ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode: SMOKE, systemPrompt: system, userPrompt: user, ...extra }),
  });
  const b = await res.json().catch(() => ({}));
  return { status: res.status, text: b.text || '', error: b.error };
}

const results = [];
for (const abbr of SAMPLE) {
  const frame = JSON.parse(readFileSync(join(framesDir, `${abbr}-special-exception.json`), 'utf8'));
  const form = { state: abbr, terminology: frame.terminology_default, decidingBody: 'Board of Adjustment', propertyAddress: '123 Oak St', regulationSections: 'Section 4.2' };

  const b1 = buildFramePrompt(frame, { formData: form, criteriaRows: filled, applicationType: 'special_exception', posture: 'requesting' });
  const r1 = await call(b1.system, b1.user, { criteria: b1.criteria, forbiddenPhrases: b1.forbiddenPhrases, enforceForbidden: b1.enforceForbidden });
  const hardship = HARDSHIP.filter(p => r1.text.toLowerCase().includes(p));

  const b2 = buildFramePrompt(frame, { formData: form, criteriaRows: [], applicationType: 'special_exception', posture: 'requesting' });
  const r2 = await call(b2.system, b2.user, { criteria: b2.criteria, forbiddenPhrases: b2.forbiddenPhrases, enforceForbidden: b2.enforceForbidden });
  const markers = [...r2.text.matchAll(/⟦([^⟧]*)⟧/g)].map(m => m[1]).filter(s => s.trim()).length;
  const placeholder = /\[[^\]]*(applicant|criteri|supply|insert|ordinance)[^\]]*\]/i.test(r2.text);

  const pass1 = r1.status === 200 && hardship.length === 0;
  const pass2 = r2.status === 200 && markers === 0 && placeholder;
  results.push({ abbr, burden: frame.burden, t1: pass1, hardship, t1status: r1.status, t2: pass2, markers, placeholder, t2status: r2.status });
  console.log(`${abbr} [${frame.burden}]  T1(no-hardship)=${pass1 ? 'PASS' : 'FAIL ' + JSON.stringify(hardship) + ' http' + r1.status}  T2(no-fabrication)=${pass2 ? 'PASS' : 'FAIL markers=' + markers + ' ph=' + placeholder + ' http' + r2.status}`);
}

const fails = results.filter(r => !r.t1 || !r.t2);
console.log('\n' + '='.repeat(54));
console.log(`ACCEPTANCE: ${results.length * 2 - fails.reduce((n, r) => n + (r.t1 ? 0 : 1) + (r.t2 ? 0 : 1), 0)}/${results.length * 2} checks passed across ${results.length} jurisdictions`);
console.log(fails.length ? 'RESULT: FAIL — ' + fails.map(f => f.abbr).join(', ') : 'RESULT: ALL GREEN');
