// api/_citelint.js — citation lock for the letter generator (S7). Pure, no I/O.
//
// Rule: a letter may cite only (a) authorities logged VERIFIED/CORRECTED for the user's state
// (api/_verified-citations.json, built from the VERIFICATION_LOGs) or (b) citations the user
// typed in their own request. Anything else is a miss: regenerate once without it, else strip
// the sentence. The same extractor as the build-time hold-back (api/_cites.js) is used.
import { citations } from './_cites.js';

const ABBR = {
  alabama: 'AL', arizona: 'AZ', california: 'CA', florida: 'FL', georgia: 'GA', illinois: 'IL',
  'new york': 'NY', 'north carolina': 'NC', ohio: 'OH', pennsylvania: 'PA', texas: 'TX',
};
export const stateAbbr = s => {
  const v = String(s || '').trim();
  if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();
  return ABBR[v.toLowerCase()] || null;
};

// Verified authorities for a state: { keys:Set, list:[display strings] }
export function verifiedFor(db, state) {
  const ab = stateAbbr(state);
  const rows = [...(db.any || []), ...((ab && db.states?.[ab]) || [])];
  const subs = new Map();   // key -> Set of logged subsection suffixes ("(k)", "(d)(1)")
  for (const r of rows) for (const x of r.sub || []) (subs.get(r.k) ?? subs.set(r.k, new Set()).get(r.k)).add(x);
  return { abbr: ab, keys: new Set(rows.map(r => r.k)), subs, list: [...new Set(rows.map(r => r.s))] };
}

// System-prompt block appended server-side (the client cannot remove it).
export function citationRules(v) {
  if (!v.list.length) {
    return '\n\nCITATION RULES: Do not cite any statute, regulation, ordinance number or case by name or number unless the user supplied it in their request. Describe the legal principle generally instead.';
  }
  return '\n\nCITATION RULES (mandatory): You may cite ONLY the verified authorities listed below, plus any citation the user typed in their own request. Cite a subsection (for example (k)) only if it is shown in the list; otherwise cite the section alone. Cite nothing else — no other statute, regulation, ordinance section or case, even if you believe it is correct. If you need support the list does not give, describe the principle in plain words without a citation.\nVerified authorities:\n- ' + v.list.join('\n- ');
}

export function sentencesOf(line) {
  const out = []; let start = 0;
  const re = /[.!?]["')\]]?\s+(?=[A-Z"(§])/g; let m;
  while ((m = re.exec(line))) {
    const word = line.slice(start, m.index + 1).split(/[\s—–/(]+/).pop();
    if (/\..*\.$/.test(word) || /^\(?([A-Z][a-z]{0,4}|[a-z]{1,3}|[A-Z](\.[A-Z])*|§+|\d+[A-Za-z]?)\.$/.test(word)) continue;
    out.push(line.slice(start, m.index + m[0].length)); start = m.index + m[0].length;
  }
  out.push(line.slice(start));
  return out;
}

// Full citations including subsection: "§ 9-462.06(K)" -> { k:'S:9-462.06', sub:'(k)', str }
export function fullCites(text) {
  const out = [];
  for (const m of String(text).matchAll(/(?:§+|Section|Sec\.)\s*(\d[\w.\-]*?)((?:\([A-Za-z0-9]{1,3}\))+)(?![\w(])/g)) {
    const first = [...citations('§ ' + m[1])][0];
    if (first) out.push({ k: first[0], sub: m[2].toLowerCase(), str: m[0] });
  }
  return out;
}
// A subsection cite is verified when the log carries that exact subsection, a parent of it, or a child of it.
const subOk = (sub, logged) => !!logged && [...logged].some(l => l === sub || sub.startsWith(l) || l.startsWith(sub));

/**
 * @param {string} text         letter text
 * @param {Set<string>} allowed verified keys for the state
 * @param {string} userText     the user's own request text; citations in it are allowed
 * @returns {{ok:boolean, bad:string[], stripped:string}}  bad = offending citations as written
 */
export function lintCitations(text, allowed, userText = '', subs = null) {
  const own = new Set([...citations(userText)].map(([k]) => k));
  const ownFull = new Set(fullCites(userText).map(f => f.k + f.sub));
  const isBad = k => !allowed.has(k) && !own.has(k);
  // subsection-level: the section may be verified while the cited subsection is not
  const badSubs = subs ? fullCites(text).filter(f => !isBad(f.k) && !own.has(f.k) && !ownFull.has(f.k + f.sub) && !subOk(f.sub, subs.get(f.k))) : [];
  const hasBadSub = line => badSubs.some(f => line.includes(f.str));
  const bad = [...[...citations(text)].filter(([k]) => isBad(k)).map(([, s]) => s), ...badSubs.map(f => f.str)];
  if (!bad.length) return { ok: true, bad: [], stripped: text };
  const lines = String(text).split('\n').map(line => {
    if (![...citations(line)].some(([k]) => isBad(k)) && !hasBadSub(line)) return line;
    return sentencesOf(line).filter(s => ![...citations(s)].some(([k]) => isBad(k)) && !hasBadSub(s)).join('').trimEnd();
  });
  const stripped = lines.filter((l, i) => l !== '' || String(text).split('\n')[i] === '').join('\n');
  return { ok: false, bad, stripped };
}
