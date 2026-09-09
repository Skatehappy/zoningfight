// scripts/gen-frames.mjs — generate state frame JSON from scripts/state-data.mjs.
// Usage: node scripts/gen-frames.mjs [ABBR ABBR ...]   (no args = all)
// Never writes FL (frozen) or GENERIC. Writes frames/{ABBR}-special-exception.json
// and frames/{ABBR}-variance.json for each record.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JURISDICTIONS, VERIFIED_ON } from './state-data.mjs';
import { buildSpecialException, buildVariance } from './frame-templates.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const framesDir = join(here, '..', 'frames');

const only = process.argv.slice(2).map(s => s.toUpperCase());
const recs = JURISDICTIONS.filter(r => r.abbr !== 'FL' && (only.length === 0 || only.includes(r.abbr)));

let written = 0;
for (const rec of recs) {
  const se = buildSpecialException(rec, VERIFIED_ON);
  const va = buildVariance(rec, VERIFIED_ON);
  writeFileSync(join(framesDir, `${rec.abbr}-special-exception.json`), JSON.stringify(se, null, 2) + '\n');
  writeFileSync(join(framesDir, `${rec.abbr}-variance.json`), JSON.stringify(va, null, 2) + '\n');
  written += 2;
  console.log(`  ${rec.abbr} (${rec.name}): se_burden=${se.burden} se_cites=${se.governing_authority.length} var_cites=${va.governing_authority.length}`);
}
console.log(`\nWrote ${written} frame files for ${recs.length} jurisdiction(s).`);
