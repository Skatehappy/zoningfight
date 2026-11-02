// Gate A15 strict: every citation and dollar/percent/day figure on a page, in a generator-fed frame or in ANY source file
// (scripts/data/**) maps to a dated log entry. Prints a one-line summary; exit 1 with the list on failure.
import { checkCoverage, realItems, realRecords } from './strict-coverage.mjs';
const items = realItems(), r = checkCoverage({ items, records: realRecords() });
for (const w of r.warnings.slice(0, 25)) console.log('WARN ' + w);
console.log(`strict coverage: ${items.length} files/pages scanned, errors=${r.errors.length}`);
if (r.errors.length) { for (const e of r.errors.slice(0, 40)) console.error('FAIL ' + e); if (r.errors.length > 40) console.error('FAIL ... and ' + (r.errors.length - 40) + ' more'); process.exit(1); }
