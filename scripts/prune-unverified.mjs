// Removes, from the SOURCE files (scripts/data/generated/**, scripts/data/state-data.json), every sentence that carries a
// citation or a dollar/percent/day figure with no dated log entry (see scripts/strict-coverage.mjs). Idempotent.
//   node scripts/prune-unverified.mjs --dry     list what would go
//   node scripts/prune-unverified.mjs           rewrite the sources
import fs from 'fs'; import path from 'path';
import { sentences } from './data/pending.js';
import { mapper, realRecords, unmappedIn, STATE_DIRS } from './strict-coverage.mjs';

const m = mapper(realRecords()), dry = process.argv.includes('--dry');
let removed = 0; const files = new Set(), why = new Map();
const bad = (s, st, where) => { const u = unmappedIn(s, st, m); if (u.length) { for (const x of u) why.set(x.kind + ' ' + x.key, (why.get(x.kind + ' ' + x.key) || 0) + 1); } return u.length > 0; };
const dropItem = x => x === '' || (x && typeof x === 'object' && !Array.isArray(x) && 'q' in x && !x.a);
function clean(v, st, where) {
  if (typeof v === 'string') {
    const ss = sentences(v), keep = ss.filter(s => !bad(s, st, where));
    if (keep.length === ss.length) return v;
    removed += ss.length - keep.length; files.add(where.split('#')[0]);
    return keep.join('').trim();
  }
  if (Array.isArray(v)) return v.map(x => clean(x, st, where)).filter(x => !dropItem(x));
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) { const c = clean(x, st, where); if (c !== '' && !(Array.isArray(c) && c.length === 0 && Array.isArray(x) && x.length)) o[k] = c; }
    return o;
  }
  return v;
}
for (const d of fs.readdirSync('scripts/data/generated')) for (const f of fs.readdirSync(path.join('scripts/data/generated', d))) {
  const p = path.join('scripts/data/generated', d, f), j = JSON.parse(fs.readFileSync(p, 'utf8')), c = clean(j, STATE_DIRS[d], p);
  if (!dry && JSON.stringify(c) !== JSON.stringify(j)) fs.writeFileSync(p, JSON.stringify(c, null, 2) + '\n');
}
const sdp = 'scripts/data/state-data.json', sd = JSON.parse(fs.readFileSync(sdp, 'utf8'));
for (const ab of Object.keys(sd)) sd[ab] = clean(sd[ab], ab, sdp + '#' + ab);
if (!dry) fs.writeFileSync(sdp, JSON.stringify(sd, null, 2) + '\n');
console.log(`${dry ? 'would remove' : 'removed'} ${removed} sentences in ${files.size} files`);
for (const [k, n] of [...why].sort((a, b) => b[1] - a[1]).slice(0, 80)) console.log('  ', n, k);
