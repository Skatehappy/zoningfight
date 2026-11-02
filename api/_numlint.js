// api/_numlint.js — numeric-claims check for generated text (dollar / percent / day figures).
// A sentence whose figures contradict (or have no source behind) the verified state data is a
// miss: the generator regenerates once, then the sentence is stripped. Rules live in
// api/_stale-claims.js (built from VERIFICATION_LOG-SEO-CONTENT.md CORRECTED/REMOVED rows plus
// the no-source classes: filing fees, small-claims limits, penalty ranges, unverified deadlines).
// Figures the user typed in their own request are always allowed. Pure, no I/O.
import { stale } from './_stale-claims.js';
import { sentencesOf } from './_citelint.js';

const FIG = /\$\s?[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?\s*(?:%|percent|[- ]days?\b)/gi;
const figs = t => new Set((String(t).match(FIG) || []).map(f => f.replace(/[\s,]/g, '').toLowerCase()));

export function lintNumbers(text, abbr, userText = '') {
  const own = figs(userText);
  const isBad = s => stale(s, abbr) && (figs(s).size === 0 || [...figs(s)].some(f => !own.has(f)));
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
