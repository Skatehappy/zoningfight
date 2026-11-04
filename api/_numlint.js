// api/_numlint.js — numeric-claims check for generated text (dollar / percent / day figures).
// A sentence whose figures contradict (or have no source behind) the verified state data is a
// miss: the generator regenerates once, then the sentence is stripped. Rules live in
// api/_stale-claims.js (built from VERIFICATION_LOG-SEO-CONTENT.md CORRECTED/REMOVED rows plus
// the no-source classes: filing fees, small-claims limits, penalty ranges, unverified deadlines).
// Figures the user typed in their own request are always allowed. Pure, no I/O.
//
// Spelled-out figures ("thirty (30) days", "thirty-six days", "ten percent", "five hundred dollars",
// "30 (thirty) days", "500 dollars") are normalised to their digit form BEFORE the stale rules and the
// user-figure comparison run, so the same verified/unverified decision applies however the figure is
// written. Only day / percent / dollar figures are handled. Month and year windows are deliberately NOT
// checked: neither the stale rules nor the verified sets (api/_verified-citations.json,
// VERIFICATION_LOG-SEO-CONTENT.md) carry any month/year figure, so there is nothing to compare against and
// extending the check would strip legitimate prose ("within six months") with no verified basis.
import { stale } from './_stale-claims.js';
import { sentencesOf } from './_citelint.js';

const UNITS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const WORD = '(?:' + [...Object.keys(UNITS), 'hundred', 'thousand'].join('|') + ')';
const PHRASE = String.raw`${WORD}(?:(?:[-\s]|\s+and\s+)${WORD})*`;
const UNIT = '(?:days?|percent|per cent|dollars?)';
const NUM = String.raw`\$?\d[\d,]*(?:\.\d+)?`;

// "one hundred twenty-five" -> 125; null when the phrase is not a well-formed number.
export function wordsToNumber(phrase) {
  const toks = String(phrase).toLowerCase().split(/[-\s]+/).filter(t => t && t !== 'and');
  let total = 0, cur = 0;
  for (const t of toks) {
    if (t === 'hundred') cur = (cur || 1) * 100;
    else if (t === 'thousand') { total += (cur || 1) * 1000; cur = 0; }
    else if (t in UNITS) cur += UNITS[t];
    else return null;
  }
  return total + cur;
}

const render = (n, unit) => /^day/i.test(unit) ? `${n} days` : /^d/i.test(unit) ? `$${n}` : `${n}%`;
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// Rewrites spelled-out / doubled day, percent and dollar figures to one canonical digit form.
export function normalizeFigures(text) {
  let t = String(text);
  // "thirty (30) days" / "five hundred dollars ($500)" / "ten percent (10%)"
  t = t.replace(new RegExp(String.raw`\b(${PHRASE})\s*\(\s*(${NUM})\s*(?:%|percent|days?|dollars?)?\s*\)[- ]?(${UNIT}|%)?`, 'gi'), (m, w, d, u) => {
    const n = wordsToNumber(w); if (n === null) return m;
    const unit = u || (/%/.test(m) ? 'percent' : /\$/.test(d) ? 'dollars' : null); if (!unit) return m;
    return render(fmt(n), unit);
  });
  // "30 (thirty) days"
  t = t.replace(new RegExp(String.raw`(${NUM})\s*\(\s*(${PHRASE})\s*\)[- ]?(${UNIT})`, 'gi'), (m, d, w, u) => wordsToNumber(w) === null ? m : render(fmt(d.replace(/[$,]/g, '')), u));
  // "thirty days", "thirty-six day", "ten percent", "five hundred dollars"
  t = t.replace(new RegExp(String.raw`\b(${PHRASE})[- ](${UNIT})\b`, 'gi'), (m, w, u) => { const n = wordsToNumber(w); return n === null ? m : render(fmt(n), u); });
  // "500 dollars", "10 percent", "30-day"
  t = t.replace(new RegExp(String.raw`(\d[\d,]*(?:\.\d+)?)[- ]?(dollars?|per cent|percent)\b`, 'gi'), (m, d, u) => render(d, u));
  // "five hundred dollars ($500)" becomes "$500 ($500)" above: drop the repeated parenthetical
  t = t.replace(/(\$?(\d[\d,]*(?:\.\d+)?)(?:%| days)?)\s*\(\s*\$?(\d[\d,]*(?:\.\d+)?)\s*(?:%|percent|days?|dollars?)?\s*\)/gi, (m, a, n1, n2) => n1.replace(/,/g, '') === n2.replace(/,/g, '') ? a : m);
  return t;
}

const FIG = /\$\s?[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?\s*(?:%|percent|[- ]days?\b)/gi;
const canon = f => {
  const s = f.replace(/[\s,]/g, '').toLowerCase();
  if (s.startsWith('$')) return s;
  const n = s.match(/[\d.]+/)[0];
  return /^\d[\d.]*(%|percent)$/.test(s) ? n + '%' : n + 'd';
};
const figs = t => new Set((normalizeFigures(t).match(FIG) || []).map(canon));

export function lintNumbers(text, abbr, userText = '') {
  const own = figs(userText);
  const isBad = s => { const n = normalizeFigures(s); return stale(n, abbr) && (figs(n).size === 0 || [...figs(n)].some(f => !own.has(f))); };
  const bad = [];
  const lines = String(text).split('\n').map(line => {
    const ss = sentencesOf(line);
    if (!ss.some(isBad)) return line;
    for (const s of ss) if (isBad(s)) bad.push(s.trim().slice(0, 80));
    return ss.filter(s => !isBad(s)).join('').trimEnd();
  });
  if (!bad.length) return { ok: true, bad: [], stripped: text };
  const orig = String(text).split('\n');
  return { ok: false, bad, stripped: lines.filter((l, i) => l !== '' || orig[i] === '').join('\n') };
}
