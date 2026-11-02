// scripts/strict-coverage.mjs - gate A15 strict mode.
// EVERY citation and EVERY dollar / percent / day figure in (a) rendered pages (public/**), (b) generator-fed data
// (frames/*.json) and (c) ANY source file (scripts/data/**) must map to a DATED log entry (status VERIFIED /
// CORRECTED carrying verified_on). No match -> FAIL. Figures are matched on their own (not only when they sit in a
// cited sentence) and are state-scoped: a Texas figure logged only for Arizona does not cover a Texas page.
// Citations are matched globally (same extractor as the lock), but must carry a dated, still-valid entry.
import fs from 'fs';
import { citations } from '../api/_cites.js';
import { figures } from './figures.mjs';
import { sentences, inLog } from './data/pending.js';
import { DATE_RE, monthsBetween } from './verified-log.mjs';

const FORMS = [
  ['GA', /O\.C\.G\.A\.|\bGa\.\s|Georgia/], ['PA', /\bP\.\s*S\.|Pa\.\s*C\.\s*S\.|\bPa\.\s|Municipalities Planning|Pennsylvania/],
  ['IL', /ILCS|\bIll\.\s|Illinois/], ['OH', /\bR\.\s*C\.\s|\bOhio\b/], ['TX', /\bTex\.|Texas/],
  ['FL', /\bFla\.|Florida/], ['NC', /\bN\.C\.|160D|North Carolina/], ['AZ', /A\.R\.S\.|Ariz/],
  ['NY', /\bN\.Y\.|\bNYC\b|Town Law|Village Law|General City Law|General Municipal Law|NYCRR|New York/],
  ['CA', /\bCal\.|Gov(?:ernment|\.)\s*Code|Cal\. ?Civ|Public Resources|Code of Civil Procedure|California/],
];
export const STATE_DIRS = { arizona: 'AZ', california: 'CA', florida: 'FL', georgia: 'GA', illinois: 'IL', 'new-york': 'NY', 'north-carolina': 'NC', ohio: 'OH', pennsylvania: 'PA', texas: 'TX' };
const ABBRS = Object.values(STATE_DIRS);
const stateOfText = t => { const h = FORMS.filter(([, re]) => re.test(t)).map(([a]) => a); return h.length === 1 ? h[0] : null; };
const OKSTATUS = /^(VERIFIED|CORRECTED|DOUBLE-VERIFIED)/i;

// Log text(s) -> [{ state|null, date, text }] for dated, still-valid (not REMOVED / NOT RENDERED / SUPERSEDED) entries.
export function logRecords(seo, old = '') {
  const recs = [], lines = seo.split(/\r?\n/);
  let hState = null, lastDate = null;
  for (const l of lines) {
    if (/^#{2,3}\s/.test(l)) { const h = l.match(/\(([A-Z]{2})\)/); hState = h && ABBRS.includes(h[1]) ? h[1] : null; lastDate = null; continue; }
    const d = (l.match(DATE_RE) || [])[1];
    if (/^\|/.test(l)) {
      const cols = l.split('|').slice(1, -1).map(c => c.trim());
      if (cols.length < 3 || !OKSTATUS.test(cols[1]) || !d) continue;
      recs.push({ state: stateOfText(l) || hState, date: d, text: l });
    } else if (/^- \*\*Primary statute:\*\*|^ {2}- \[[^\]]+\]\s+https?:\/\//.test(l) && d) { lastDate = d; recs.push({ state: hState, date: d, text: l }); }
    else if (/^ {4}- /.test(l) && lastDate) recs.push({ state: hState, date: lastDate, text: l });   // sub-bullet inherits its source's date
  }
  // old-style blocks: "### YYYY-MM-DD - title" ... "- **Verdict:** VERIFIED|CORRECTED|DOUBLE-VERIFIED"
  for (const b of old.split(/\r?\n(?=### \d{4}-\d\d-\d\d)/)) {
    const m = b.match(/^### (\d{4}-\d\d-\d\d)/);
    if (m && /\*\*Verdict:\*\*\s*(DOUBLE-)?(VERIFIED|CORRECTED)/i.test(b)) recs.push({ state: stateOfText(b), date: m[1], text: b });
  }
  return recs;
}

// records -> { cdate(citationKey) , fdate(state|null, figureKey) }  (newest dated entry that covers it, or null)
export function mapper(records) {
  const ckeys = new Map(), fkeys = new Map();                  // citation key -> newest date; 'ST|figure' / '*|figure' -> newest date
  const bump = (m, k, d) => { if (!m.has(k) || m.get(k) < d) m.set(k, d); };
  const clean = records.map(r => ({ ...r, plain: r.text.replace(/verified_on:\s*\d{4}-\d\d-\d\d/g, '') }));
  for (const r of clean) for (const [k] of figures(r.text)) bump(fkeys, (r.state || '*') + '|' + k, r.date);
  // citation key -> newest date of any dated entry that logs it (same literal matcher the build-time hold-back uses)
  const cdate = k => { if (!ckeys.has(k)) { let best = null; for (const r of clean) if ((!best || r.date > best) && inLog(k, r.plain)) best = r.date; ckeys.set(k, best); } return ckeys.get(k); };
  const newest = (...ds) => ds.filter(Boolean).sort().pop();
  // state item: that state's entries or state-less entries; state-less item (landing page, shared data): any entry
  const fdate = (st, k) => st ? newest(fkeys.get(st + '|' + k), fkeys.get('*|' + k)) : newest(...[...fkeys].filter(([x]) => x.endsWith('|' + k)).map(([, v]) => v));
  return { cdate, fdate };
}
// per-sentence verdict used by the pruner: [{kind,key,raw}] of citations / figures with no dated entry
export function unmappedIn(sentence, state, m) {
  const out = [];
  for (const [k, raw] of citations(sentence)) if (!m.cdate(k)) out.push({ kind: 'citation', key: k, raw });
  for (const [k, raw] of figures(sentence)) if (!m.fdate(state, k)) out.push({ kind: 'figure', key: k, raw });
  return out;
}

// items: [{ where, state|null, text }] -> { errors:[], warnings:[] }
export function checkCoverage({ items, records, now = new Date(), failMonths = 12, warnMonths = 10 }) {
  const today = (now instanceof Date ? now : new Date(now)).toISOString().slice(0, 10), errors = [], warnings = [];
  const { cdate, fdate } = mapper(records);
  const seen = new Set();
  const judge = (kind, where, st, key, d, raw, ctx) => {
    const id = kind + '|' + where + '|' + key; if (seen.has(id)) return; seen.add(id);
    if (!d) { errors.push(`${where}: ${kind} "${raw}" (${key}) has no dated log entry${st ? ' for ' + st : ''} - "${ctx}"`); return; }
    const mo = monthsBetween(d, today);
    if (mo > failMonths) errors.push(`${where}: ${kind} ${key} last verified ${d} (${mo.toFixed(1)} months ago, limit ${failMonths})`);
    else if (mo > warnMonths) warnings.push(`${where}: ${kind} ${key} last verified ${d} (${mo.toFixed(1)} months ago, warn at ${warnMonths})`);
  };
  for (const it of items) {
    for (const s of sentences(it.text)) {
      for (const [k, raw] of citations(s)) judge('citation', it.where, it.state, k, cdate(k), raw, s.trim().slice(0, 80));
      for (const [k, raw] of figures(s)) judge('figure', it.where, it.state, k, fdate(it.state, k), raw, s.trim().slice(0, 80));
    }
  }
  return { errors, warnings };
}

// ---- real inputs ----
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === 'node_modules' ? [] : walk(d + '/' + e.name)) : [d + '/' + e.name]) : [];
const strings = (v, out = []) => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(x => strings(x, out)); else if (v && typeof v === 'object') Object.values(v).forEach(x => strings(x, out)); return out; };
const htmlText = h => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
const abbrOfDir = p => STATE_DIRS[p.split('/')[p.startsWith('public/') ? 1 : 3]] || null;

export function realItems() {
  const items = [];
  for (const f of walk('public').filter(f => f.endsWith('.html'))) items.push({ where: f, state: abbrOfDir(f), text: htmlText(fs.readFileSync(f, 'utf8')) });
  for (const f of walk('scripts/data')) {
    if (/\.json$/.test(f)) {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (f.endsWith('state-data.json')) for (const [ab, v] of Object.entries(j)) items.push({ where: f + '#' + ab, state: ab, text: strings(v).join('\n') });
      else items.push({ where: f, state: f.includes('/generated/') ? abbrOfDir(f) : null, text: strings(j).join('\n') });
    } else if (/\.m?js$/.test(f) && !/(pending|stale-claims)\.js$/.test(f)) items.push({ where: f, state: null, text: fs.readFileSync(f, 'utf8') });
  }
  for (const f of walk('frames').filter(f => f.endsWith('.json'))) items.push({ where: f, state: (f.match(/frames\/([A-Z]{2})-/) || [])[1] || null, text: strings(JSON.parse(fs.readFileSync(f, 'utf8'))).join('\n') });
  return items;
}
export function realRecords() {
  return logRecords(fs.readFileSync('VERIFICATION_LOG-SEO-CONTENT.md', 'utf8'), fs.existsSync('VERIFICATION_LOG.md') ? fs.readFileSync('VERIFICATION_LOG.md', 'utf8') : '');
}
