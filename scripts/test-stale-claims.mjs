// Gate A13: no stale/unverifiable claim survives in sources (generated JSON, state-data.json)
// or in rendered pages (public/**). Rules: scripts/data/stale-claims.js.
import fs from 'fs'; import path from 'path';
import { sentences } from './data/pending.js';
import { stale } from './data/stale-claims.js';
const ABBR = { arizona: 'AZ', california: 'CA', florida: 'FL', georgia: 'GA', illinois: 'IL', 'new-york': 'NY', 'north-carolina': 'NC', ohio: 'OH', pennsylvania: 'PA', texas: 'TX' };
const bad = [];
const walk = (v, ab, where) => {
  if (typeof v === 'string') { for (const s of sentences(v)) if (stale(s, ab)) bad.push(where + ': ' + s.trim().slice(0, 90)); }
  else if (Array.isArray(v)) v.forEach(x => walk(x, ab, where));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, ab, where + '.' + k);
};
for (const d of fs.readdirSync('scripts/data/generated'))
  for (const f of fs.readdirSync(path.join('scripts/data/generated', d)))
    walk(JSON.parse(fs.readFileSync(path.join('scripts/data/generated', d, f), 'utf8')), ABBR[d], d + '/' + f);
const sd = JSON.parse(fs.readFileSync('scripts/data/state-data.json', 'utf8'));
for (const ab of Object.keys(sd)) walk(sd[ab], ab, 'state-data.' + ab);
let pages = 0;
for (const d of fs.readdirSync('public')) {
  if (!ABBR[d]) continue;
  const stack = [path.join('public', d)];
  while (stack.length) {
    const p = stack.pop();
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const q = path.join(p, e.name);
      if (e.isDirectory()) stack.push(q);
      else if (e.name === 'index.html') {
        pages++;
        const html = fs.readFileSync(q, 'utf8');
        const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
        for (const line of body.split('\n')) if (line.trim().length > 20) for (const s of sentences(line)) if (stale(s, ABBR[d])) bad.push(q + ': ' + s.trim().slice(0, 90));
      }
    }
  }
}
if (bad.length) { console.error('STALE CLAIMS (' + bad.length + '):\n' + bad.slice(0, 25).join('\n')); process.exit(1); }
console.log('stale-claims: ' + pages + ' rendered pages + all sources clean');
