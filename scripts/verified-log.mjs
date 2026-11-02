// scripts/verified-log.mjs - machine-readable verified_on dates for VERIFICATION_LOG-SEO-CONTENT.md.
//
// FORMAT (one rule): every log ENTRY carries the token  verified_on: YYYY-MM-DD
//   - table entry  = any data row of a "| Item | Status | Detail | Source | verified_on |" table; the
//                    last cell is  verified_on: YYYY-MM-DD
//   - bullet entry = a "- **Primary statute:**" line or a "  - [tag] https://... (retrieved ...)" source
//                    line of a per-state section; the line ends with  verified_on: YYYY-MM-DD
// The date is the day the entry's status was last verified/changed. New entries get today's date:
//   node scripts/verified-log.mjs --stamp     (adds today's date to any entry that lacks one)
// Freshness policy (gate A15): fail > 12 months, warn > 10 months, relative to an injectable "now".
import fs from 'fs';
import { citations } from '../api/_cites.js';

export const LOG_FILE = 'VERIFICATION_LOG-SEO-CONTENT.md';
export const DATE_RE = /verified_on:\s*(\d{4}-\d\d-\d\d)\b/;
const isSep = l => /^\|\s*:?-{3,}/.test(l);
const isBullet = l => /^- \*\*Primary statute:\*\*/.test(l) || /^ {2}- \[[^\]]+\]\s+https?:\/\//.test(l);

// -> [{ line (1-based), kind, text, status, verified_on|null }]
export function parseEntries(text) {
  const lines = text.split(/\r?\n/), out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\|/.test(l)) {
      if (isSep(l) || (lines[i + 1] && isSep(lines[i + 1]))) continue;      // separator or header row
      const cols = l.split('|').slice(1, -1).map(c => c.trim());
      out.push({ line: i + 1, kind: 'row', text: cols[0], status: (cols[1] || '').split(/[\s(]/)[0].toUpperCase(), verified_on: (l.match(DATE_RE) || [])[1] || null });
    } else if (isBullet(l)) {
      out.push({ line: i + 1, kind: 'bullet', text: l.trim(), status: 'VERIFIED', verified_on: (l.match(DATE_RE) || [])[1] || null });
    }
  }
  return out;
}

// months between ISO dates (fractional, 30.4375-day months)
export const monthsBetween = (from, to) => (Date.parse(to) - Date.parse(from)) / 86400000 / 30.4375;
const iso = d => (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);

// citation key -> newest verified_on among VERIFIED/CORRECTED entries that logged it
export function keyDates(entries) {
  const m = new Map();
  for (const e of entries) {
    if (!/^(VERIFIED|CORRECTED)/.test(e.status) || !e.verified_on) continue;
    for (const [k] of citations(e.text)) if (!m.has(k) || m.get(k) < e.verified_on) m.set(k, e.verified_on);
  }
  return m;
}

// check({entries, used:[{where,key}], keyDates, now}) -> { errors:[], warnings:[] }
export function check({ entries, used = [], dates, now = new Date(), failMonths = 12, warnMonths = 10 }) {
  const today = iso(now), errors = [], warnings = [];
  for (const e of entries) {
    if (!e.verified_on) errors.push(`log line ${e.line}: entry has no verified_on (${e.text.slice(0, 60)})`);
    else if (!/^\d{4}-\d\d-\d\d$/.test(e.verified_on) || isNaN(Date.parse(e.verified_on))) errors.push(`log line ${e.line}: bad verified_on ${e.verified_on}`);
    else if (e.verified_on > today) errors.push(`log line ${e.line}: verified_on ${e.verified_on} is in the future`);
  }
  const seen = new Set();
  for (const u of used) {
    const d = dates.get(u.key), id = u.where + '|' + u.key;
    if (seen.has(id)) continue; seen.add(id);
    if (!d) continue;                                   // unlogged citations are A9/hold-back's job
    const mo = monthsBetween(d, today);
    if (mo > failMonths) errors.push(`${u.where}: ${u.key} last verified ${d} (${mo.toFixed(1)} months ago, limit ${failMonths})`);
    else if (mo > warnMonths) warnings.push(`${u.where}: ${u.key} last verified ${d} (${mo.toFixed(1)} months ago, warn at ${warnMonths})`);
  }
  return { errors, warnings };
}

// Citations (and the figures that share their sentence) in the lock data and the rendered pages.
export function usedCitations() {
  const used = [], lock = JSON.parse(fs.readFileSync('api/_verified-citations.json', 'utf8'));
  for (const r of lock.any) used.push({ where: 'lock:any', key: r.k });
  for (const [st, rows] of Object.entries(lock.states)) for (const r of rows) used.push({ where: 'lock:' + st, key: r.k });
  const walk = d => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = d + '/' + e.name;
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) {
      const t = fs.readFileSync(p, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ');
      for (const [key] of citations(t)) used.push({ where: p, key });
    } } };
  walk('public');
  return used;
}

if (process.argv[1] && process.argv[1].endsWith('verified-log.mjs') && process.argv.includes('--stamp')) {
  const today = iso(new Date());
  const txt = fs.readFileSync(LOG_FILE, 'utf8'), nl = txt.includes('\r\n') ? '\r\n' : '\n';
  const miss = new Map(parseEntries(txt).filter(e => !e.verified_on).map(e => [e.line, e]));
  const lines = txt.split(/\r?\n/).map((l, i) => !miss.has(i + 1) ? l : (miss.get(i + 1).kind === 'row' ? l.replace(/\|?\s*$/, ` verified_on: ${today} |`) : `${l} verified_on: ${today}`));
  fs.writeFileSync(LOG_FILE, lines.join(nl));
  console.log(`stamped ${miss.size} entries with ${today}`);
}
