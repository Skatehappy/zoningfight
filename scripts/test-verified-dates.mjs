// Gate A15: every VERIFICATION_LOG-SEO-CONTENT.md entry carries verified_on; no citation (or the figures in its
// sentence) that is RENDERED on a public page or FED TO A GENERATOR (api/_verified-citations.json lock data)
// maps to an entry verified more than 12 months before now (fail); >10 months = non-fatal WARN listing.
// "now" is injectable: GATE_NOW=YYYY-MM-DD env (tests use it).
import fs from 'fs';
import { LOG_FILE, parseEntries, keyDates, check, usedCitations } from './verified-log.mjs';

const now = process.env.GATE_NOW ? new Date(process.env.GATE_NOW + 'T12:00:00Z') : new Date();
const entries = parseEntries(fs.readFileSync(LOG_FILE, 'utf8'));
const dates = keyDates(entries);
const lock = JSON.parse(fs.readFileSync('api/_verified-citations.json', 'utf8'));
for (const r of [...lock.any, ...Object.values(lock.states).flat()]) if (r.v && (!dates.has(r.k) || dates.get(r.k) < r.v)) dates.set(r.k, r.v);
const { errors, warnings } = check({ entries, used: usedCitations(), dates, now });
for (const w of warnings.slice(0, 25)) console.log('WARN ' + w); if (warnings.length > 25) console.log('WARN ... and ' + (warnings.length - 25) + ' more');
console.log(`entries=${entries.length} warnings=${warnings.length} errors=${errors.length}`);
if (errors.length) { for (const e of errors.slice(0, 25)) console.error('FAIL ' + e); if (errors.length > 25) console.error('FAIL ... and ' + (errors.length - 25) + ' more'); process.exit(1); }
