// sim-no-fabrication.js
// A criterion string absent from the user's input (recited inside ⟦ ⟧ markers)
// is caught and failed. A letter reciting only user-entered criteria passes.
import { lintLetter } from '../api/_lint.js';
import { ok, eq, pass } from './_assert.mjs';

const userCriteria = [
  { criterion: 'The use is compatible with surrounding uses', evidence: 'Adjacent parcels are similarly zoned.' },
  { criterion: 'Adequate ingress and egress is provided', evidence: 'Two curb cuts on the arterial.' },
];

// Fabricated: a criterion the user never typed, recited inside markers.
const fabricated =
  'Dear Board,\n\n1. ⟦The use is compatible with surrounding uses⟧ — satisfied.\n' +
  '2. ⟦The applicant has owned the property for at least ten years⟧ — satisfied.\n';
const bad = lintLetter(fabricated, { criteria: userCriteria });
eq(bad.ok, false, 'a fabricated criterion is caught');
eq(bad.reason, 'fabricated_criterion', 'the reason is fabricated_criterion');

// Faithful: only the user's criteria appear inside markers.
const faithful =
  'Dear Board,\n\n1. ⟦The use is compatible with surrounding uses⟧ — satisfied.\n' +
  '2. ⟦Adequate ingress and egress is provided⟧ — satisfied.\n';
const good = lintLetter(faithful, { criteria: userCriteria });
eq(good.ok, true, 'reciting only user criteria passes');
ok(!good.cleanText.includes('⟦') && !good.cleanText.includes('⟧'), 'markers are stripped from the delivered letter');

pass('sim-no-fabrication');
