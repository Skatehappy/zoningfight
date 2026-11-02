// Build api/_verified-citations.json from the VERIFICATION_LOG files (S7 citation lock).
// Only VERIFIED / CORRECTED rows count (REMOVED rows and anything unlogged are excluded), so a
// citation reaches the generator prompt and the post-generation allow-list only after it was
// logged as verified. Output: { any: [{k,s}], states: { PA: [{k,s}], ... } } where k = normalized
// key (same extractor as scripts/data/pending.js) and s = the citation exactly as logged.
// Scoping is best-effort: state from the section heading "(XX)" or from the citation's own form
// (O.C.G.A. -> GA ...); a row with neither goes to "any" and is offered to every state.
import fs from 'fs';
import { citations } from '../api/_cites.js';

const FILES = ['VERIFICATION_LOG.md', 'VERIFICATION_LOG-SEO-CONTENT.md'].filter(f => fs.existsSync(f));
const FORMS = [
  ['GA', /O\.C\.G\.A\.|\bGa\.\s/], ['PA', /\bP\.\s*S\.|Pa\.\s*C\.\s*S\.|\bPa\.\s|Municipalities Planning/],
  ['IL', /ILCS|\bIll\.\s/], ['OH', /\bR\.\s*C\.\s|\bOhio\b/], ['TX', /\bTex\.|Texas/],
  ['FL', /\bFla\.|Florida/], ['NC', /\bN\.C\.|160D/], ['AZ', /A\.R\.S\.|Ariz/],
  ['NY', /\bN\.Y\.|\bNYC\b|Town Law|Village Law|General City Law|General Municipal Law|NYCRR|New York/],
  ['CA', /\bCal\.|Gov(?:ernment|\.)\s*Code|Cal\. ?Civ|Public Resources|Code of Civil Procedure|California/],
];
const stateOf = (text, heading) => {
  const h = heading.match(/\(([A-Z]{2})\)/);
  if (h && !/Batch|Earning pages/.test(heading)) return h[1];
  const hits = FORMS.filter(([, re]) => re.test(text)).map(([a]) => a);
  return hits.length === 1 ? hits[0] : null;
};

const out = { any: new Map(), states: {} };
const SUBS = new Map();   // "st|k" -> Set of logged subsection suffixes, e.g. "(k)", "(d)(1)"
const add = (st, k, s) => {
  const m = st ? (out.states[st] ??= new Map()) : out.any;
  if (!m.has(k)) m.set(k, s);
};
function addText(text, heading, display, fullRow) {
  const st = stateOf(text, heading);
  for (const [k] of citations(text)) add(st, k, display);
  // full citations incl. subsection ("§ 9-462.06(K)") logged anywhere in the row
  for (const m of String(fullRow || text).matchAll(/(?:§+|Section|Sec\.)\s*(\d[\w.\-]*?)((?:\([A-Za-z0-9]{1,3}\))+)/g)) {
    const [k] = [...citations('§ ' + m[1])][0] || [];
    if (!k) continue;
    const key = (st || '*') + '|' + k;
    (SUBS.get(key) ?? SUBS.set(key, new Set()).get(key)).add(m[2].toLowerCase());
  }
}

for (const f of FILES) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  let heading = '', oldStyle = null;
  for (const line of lines) {
    if (/^#{2,3}\s/.test(line)) { heading = line; oldStyle = null; }
    if (/^\|/.test(line)) {
      const cols = line.split('|').slice(1, -1).map(c => c.trim());
      if (cols.length < 2 || !/^(VERIFIED|CORRECTED)/i.test(cols[1])) continue;   // header, separator, REMOVED rows
      addText(cols[0], heading, cols[0], cols.join(' '));
    } else if (/^### \d{4}-\d\d-\d\d — /.test(line)) {                            // old-style entry; counts only if its Verdict is VERIFIED
      oldStyle = { title: line.replace(/^### \d{4}-\d\d-\d\d — /, ''), ok: false };
      oldStyle.pending = true;
    } else if (oldStyle && /^- \*\*Verdict:\*\*\s*(VERIFIED|CORRECTED)/i.test(line)) {
      if (/Law|Code|U.S.C|Statutes|CGS|sv.s/.test(oldStyle.title)) addText(oldStyle.title, oldStyle.title, oldStyle.title);   // skips bare local-ordinance sections (§2.1)
      oldStyle = null;
    } else if (/\((?:[A-Z]{2})\)\s*$/.test(heading) && /^## /.test(heading) && /^\s*-\s/.test(line)) {
      // 2026-07-22 per-state source sections: every bullet is backed by a dated live source URL
      addText(line, heading, line.replace(/^\s*-\s*(\*\*[^*]+\*\*)?\s*/, '').slice(0, 120));
    }
  }
}
const ser = (m, st) => [...m].map(([k, s]) => { const sub = [...new Set([...(SUBS.get((st || '*') + '|' + k) || []), ...(SUBS.get('*|' + k) || [])])].sort(); return sub.length ? { k, s: s.slice(0, 160), sub } : { k, s: s.slice(0, 160) }; });
const json = { generated: new Date().toISOString().slice(0, 10), any: ser(out.any, null), states: Object.fromEntries(Object.entries(out.states).map(([a, m]) => [a, ser(m, a)])) };
fs.writeFileSync('api/_verified-citations.json', JSON.stringify(json, null, 1) + '\n');
console.log('verified citations: any=' + json.any.length + ' ' + Object.entries(json.states).map(([a, v]) => a + '=' + v.length).join(' '));
