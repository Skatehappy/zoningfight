// sim-hardship-lint.js
// All five forbidden phrases are caught (case-insensitive) for a special
// exception. Hardship language surrenders the Florida burden shift.
import { lintLetter, FORBIDDEN_DEFAULT } from '../api/_lint.js';
import { ok, eq, pass } from './_assert.mjs';

eq(FORBIDDEN_DEFAULT.length, 5, 'there are five forbidden phrases');

for (const phrase of FORBIDDEN_DEFAULT) {
  // embed with altered case to prove case-insensitivity
  const letter = `Dear Board, The applicant faces ${phrase.toUpperCase()} on this parcel and requests relief.`;
  const r = lintLetter(letter, { enforceForbidden: true, criteria: [] });
  eq(r.ok, false, `"${phrase}" is caught`);
  ok(r.reason.startsWith('forbidden_phrase:'), `"${phrase}" reports a forbidden_phrase reason`);
}

// A clean letter passes.
const clean = lintLetter('Dear Board, the application satisfies each enumerated criterion.', { enforceForbidden: true, criteria: [] });
eq(clean.ok, true, 'a letter with no forbidden phrase passes');

pass('sim-hardship-lint');
