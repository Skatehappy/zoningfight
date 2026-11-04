// Gate A16: no banned marketing claim ("attorney-quality" etc., or "legal advice" outside a not-legal-advice
// disclaimer) in public pages, page templates, JSON-LD, the app UI source or the generated content data.
// Exports findBanned(text) for tests; run directly to scan the repo (exit 1 on any hit).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BANNED = [
  /attorney[\s-]+quality/i, /lawyer[\s-]+quality/i, /attorney[\s-]+grade/i, /lawyer[\s-]+grade/i,
  /attorney[\s-]+written/i, /attorney[\s-]+drafted/i, /real\s+lawyer/i,
];
const LEGAL_ADVICE = /legal\s+advice/gi;
const NEGATOR = /\b(not|no|never|without|nor|neither)\b|n['’]t\b|\bdoes\s+not\b/i;

export function findBanned(text) {
  const hits = [];
  for (const re of BANNED) { const m = text.match(re); if (m) hits.push(m[0]); }
  for (const m of text.matchAll(LEGAL_ADVICE)) {
    // disclaimer exception: a negator in the same sentence (back to the previous sentence break, forward to the next)
    const before = text.slice(Math.max(0, m.index - 120), m.index).split(/[.!?;\n]\s|[\n<>]/).pop();
    const after = text.slice(m.index, m.index + 60).split(/[.!?;\n<>]/)[0];
    if (!NEGATOR.test(before + ' ' + after)) hits.push('legal advice (not in a disclaimer): ' + (before + after).trim().slice(-80));
  }
  return hits;
}

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
function* walk(p) {
  if (!fs.existsSync(p)) return;
  const st = fs.statSync(p);
  if (st.isFile()) { yield p; return; }
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    yield* walk(path.join(p, e.name));
  }
}
export function scanRepo() {
  const targets = ['public', 'scripts/templates', 'scripts/data', 'src', 'index.html', 'landing.html', 'api/checklist.js'];
  const bad = []; let n = 0;
  for (const t of targets) for (const f of walk(path.join(ROOT, t))) {
    if (!/\.(html|js|jsx|json|mjs|xml|txt)$/.test(f)) continue;
    n++;
    const txt = fs.readFileSync(f, 'utf8');
    for (const h of findBanned(txt)) bad.push(path.relative(ROOT, f) + ': ' + h);
    // every public page must carry the not-legal-advice disclaimer
    if (/[\/]public[\/].*.html$/.test(f) && !/(not|n['’]t)s+(constitutes+)?legals+advice/i.test(txt)) bad.push(path.relative(ROOT, f) + ': missing not-legal-advice disclaimer');
  }
  return { bad, n };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { bad, n } = scanRepo();
  if (bad.length) { console.error('A16 FAIL - banned marketing claim(s):\n  ' + bad.join('\n  ')); process.exit(1); }
  console.log(`A16 banned-claims clean (${n} files scanned)`);
}
