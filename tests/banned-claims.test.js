// Mock tests for Gate A16 (scripts/check-banned-claims.mjs): banned phrases fail, disclaimers pass.
import assert from 'node:assert';
import { findBanned } from '../scripts/check-banned-claims.mjs';
for (const s of ['Attorney-Quality letters', 'attorney quality drafts', 'a lawyer-quality letter', 'Lawyer Grade', 'attorney-grade output',
  'attorney-written', 'attorney-drafted', 'talk to a real lawyer', 'Get legal advice in minutes', 'We give legal advice for $19'])
  assert(findBanned(s).length > 0, 'should flag: ' + s);
for (const s of ['This is not legal advice.', 'Letters are AI-generated and do not constitute legal advice.', 'ZoningFight does not give legal advice',
  'It isn’t legal advice.', "This page is general information and isn't legal advice.", 'Consult a licensed attorney.', 'A well-organized letter citing your state law.'])
  assert.deepStrictEqual(findBanned(s), [], 'should pass: ' + s);
console.log('banned-claims mock tests pass');
