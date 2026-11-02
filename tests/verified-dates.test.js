// Gate A15 mock tests: fresh passes, 10-month warns, 13-month fails, missing date fails, rendered/lock citation maps.
import assert from 'assert';
import { parseEntries, keyDates, check, monthsBetween } from '../scripts/verified-log.mjs';

const log = d => [
  '## Test (PA)', '', '| Item | Status | Detail | Source | verified_on |', '|---|---|---|---|---|',
  `| 53 P.S. § 10910.2 | VERIFIED | Variance findings | Official | ${d ? 'verified_on: ' + d + ' ' : ''}|`,
  `- **Primary statute:** MPC Act 247 verified_on: 2026-01-05`,
].join('\n');
const run = (d, now) => { const e = parseEntries(log(d)); return check({ entries: e, used: [{ where: 'public/pa/x/index.html', key: 'S:10910.2' }, { where: 'lock:PA', key: 'S:10910.2' }], dates: keyDates(e), now: new Date(now) }); };

let r = run('2026-10-01', '2026-11-01');                       // fresh
assert.equal(r.errors.length, 0); assert.equal(r.warnings.length, 0);
r = run('2025-12-20', '2026-11-01');                           // ~10.0+ months: warn
assert.equal(r.errors.length, 0, 'warn is not fatal'); assert(r.warnings.length >= 1, '10-month warns'); assert(/10\.\d months/.test(r.warnings[0]));
r = run('2025-09-15', '2026-11-01');                           // ~13.5 months: fail, both rendered page and lock named
assert(r.errors.some(e => /public\/pa/.test(e)) && r.errors.some(e => /lock:PA/.test(e)), '13-month fails: ' + r.errors);
r = run(null, '2026-11-01');                                   // missing date on a row
assert(r.errors.some(e => /no verified_on/.test(e)), 'missing date fails');
assert.equal(parseEntries(log('2026-10-01')).length, 2, 'header and separator rows are not entries');
assert(monthsBetween('2025-11-01', '2026-11-01') > 11.9 && monthsBetween('2025-11-01', '2026-11-01') < 12.1);
// future dates rejected
assert(run('2027-01-01', '2026-11-01').errors.some(e => /future/.test(e)));
console.log('verified-dates.test: PASS');
