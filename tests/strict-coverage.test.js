// Gate A15 strict mock tests: unmapped citation fails, unmapped figure fails, mapped passes, figures are state-scoped,
// figures outside a cited sentence are still checked, REMOVED/undated entries do not count, stale (>12mo) fails.
import assert from 'assert';
import { logRecords, checkCoverage } from '../scripts/strict-coverage.mjs';
import { figures } from '../scripts/figures.mjs';

const log = [
  '## Texas (TX)', '', '| Item | Status | Detail | Source | verified_on |', '|---|---|---|---|---|',
  "| Tex. Loc. Gov't Code § 211.011(b) | VERIFIED | Petition within 10 days after the decision is filed; 75 percent vote. | Official | verified_on: 2026-10-01 |",
  "| Tex. Loc. Gov't Code § 211.999 | REMOVED | Could not confirm 45 days. | - | verified_on: 2026-10-01 |",
  "| Tex. Loc. Gov't Code § 211.888 | VERIFIED | Undated row, 99 days. | Official |",
].join('\r\n');
const records = logRecords(log);
const run = (text, state = 'TX', now = '2026-11-02') => checkCoverage({ items: [{ where: 'public/x/index.html', state, text }], records, now: new Date(now) }).errors;

assert.deepEqual([...figures('within thirty days; 10 to 15 calendar days; the 20th day; $1,250 and 7.5% fee')].map(x => x[0]).sort(),
  ['$1250', '10 day', '15 day', '20 day', '30 day', '7.5%']);
assert.equal(run("Tex. Loc. Gov't Code § 211.011(b) applies. File within 10 days. A 75 percent vote is needed.").length, 0, 'mapped passes');
assert(run('See Tex. Loc. Gov\'t Code § 211.555 for details.').some(e => /citation/.test(e)), 'unmapped citation fails');
assert(run('Tex. Loc. Gov\'t Code § 211.011(b). The fine is $500 per day.').some(e => /figure.*\$500/.test(e)), 'unmapped dollar figure fails');
assert(run('You usually have 14 days to respond to the notice.').some(e => /figure.*14 day/.test(e)), 'figure in an UNCITED sentence still fails');
assert(run('A 20% protest applies.').some(e => /20%/.test(e)), 'unmapped percent fails');
assert(run('Respond within 45 days.').length === 1, 'figure only in a REMOVED row does not count');
assert(run('Respond within 99 days.').length === 1, 'undated row does not count');
assert(run('File within 10 days.', 'AZ').length === 1, 'a Texas figure does not cover an Arizona page');
assert(run('File within 10 days.', null).length === 0, 'state-less item may use any state entry');
assert(run('File within 10 days.', 'TX', '2027-11-02').some(e => /months ago/.test(e)), 'older than 12 months fails');
console.log('strict-coverage.test: PASS');
