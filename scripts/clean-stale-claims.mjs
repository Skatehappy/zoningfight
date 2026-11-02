// Rewrites scripts/data/generated/** and state-data.json, removing sentences matching the
// stale-claims denylist and applying the verified deadline overrides. Idempotent.
import fs from 'fs'; import path from 'path';
import { sentences } from './data/pending.js';
import { stale, DEADLINES } from './data/stale-claims.js';
const ABBR = { arizona: 'AZ', california: 'CA', florida: 'FL', georgia: 'GA', illinois: 'IL', 'new-york': 'NY', 'north-carolina': 'NC', ohio: 'OH', pennsylvania: 'PA', texas: 'TX' };
let removed = 0; const log = [];
const dropItem = (x, ab) => x === '' || (x && typeof x === 'object' && !Array.isArray(x) && 'q' in x && (!x.a || stale(x.q, ab)));
function clean(v, ab, where) {
  if (typeof v === 'string') {
    const ss = sentences(v); const keep = ss.filter(s => !stale(s, ab));
    if (keep.length === ss.length) return v;
    removed += ss.length - keep.length; log.push(where);
    return keep.join('').trim();
  }
  if (Array.isArray(v)) return v.map(x => clean(x, ab, where)).filter(x => !dropItem(x, ab));
  if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) { const c = clean(x, ab, where + '.' + k); if (c !== '') o[k] = c; } return o; }
  return v;
}
const dry = process.argv.includes('--dry');
for (const dir of fs.readdirSync('scripts/data/generated')) {
  const ab = ABBR[dir];
  for (const f of fs.readdirSync(path.join('scripts/data/generated', dir))) {
    const p = path.join('scripts/data/generated', dir, f); const topic = f.replace('.json', '');
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const had = j.deadline; delete j.deadline;
    let c = clean(j, ab, dir + '/' + topic);
    const ov = DEADLINES[ab] && topic in DEADLINES[ab] ? DEADLINES[ab][topic] : undefined;
    const d = ov !== undefined ? ov : (had && !stale(had, ab) ? had : null);
    if (d) c = { ...c, deadline: d }; else if (had) { removed++; log.push(dir + '/' + topic + '.deadline'); }
    if (!dry) fs.writeFileSync(p, JSON.stringify(c, null, 2) + '\n');
  }
}
const sd = JSON.parse(fs.readFileSync('scripts/data/state-data.json', 'utf8'));
for (const ab of Object.keys(sd)) sd[ab] = clean(sd[ab], ab, 'state-data.' + ab);
if (!dry) fs.writeFileSync('scripts/data/state-data.json', JSON.stringify(sd, null, 2) + '\n');
console.log('removed', removed, 'in', new Set(log).size, 'fields');
