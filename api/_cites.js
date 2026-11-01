// api/_cites.js — shared citation extractor (statutes, regs, cases) used by the build-time
// hold-back (scripts/data/pending.js) AND the generator citation lock (api/generate.js).
// Pure, no I/O. A citation is reduced to a normalized key (S:<section>, C:<case first word>,
// CH:/ART:/TITLE:) so the same sentence is judged identically at build time and run time.

export const core = x => (x.match(/\d[\d.\-–/:]*[A-Za-z]?(?:[.\-]\d+)*/) || [''])[0].replace(/[–]/g, '-').replace(/[.\-/:]+$/, '');
const CASE_SKIP = new Set(['in', 'under', 'yes', 'see', 'the', 'inc', 'llc', 'co', 'corp', 'if', 'and', 'when', 'as', 'per', 'cf', 'also', 'after', 'because', 'following', 'landmark', 'court', 'case', 'courts', 'decision', 'ruling', 'holding']);
export function citations(text) {
  const keys = new Map(); // key -> sample
  const canon = k => {
    if (!k || !k.startsWith('S:')) return k;
    let v = k.slice(2).replace(/^(PA|FED)\d+-(?=\d)/, '');            // "40 P.S. § 1171.5" / "29 U.S.C. § 1132" → section only
    if (/^\d+\.\d+[A-Za-z]?-\d+\.\d+/.test(v)) v = v.split('-')[0];       // ranges "991.2141-991.2193" → first section
    return 'S:' + v;
  };
  const add = (k, s) => { k = canon(k); if (k && !keys.has(k)) keys.set(k, s.trim().slice(0, 60)); };
  const pats = [
    [/§§?\s*(\d[\w.\-–:/]*)/g, m => 'S:' + core(m[1])],
    [/\b(\d+)\s*ILCS\s*([\d/.\-]+)/g, m => 'S:' + m[1] + 'ILCS' + core(m[2])],
    [/\b(\d+)\s*(?:Pa\.\s*C\.\s*S\.|P\.\s*S\.)\s*(?:§+\s*)?(\d[\d.\-]*)?/g, m => 'S:PA' + m[1] + (m[2] ? '-' + core(m[2]) : '')],
    [/\b(?:R\.\s*C\.|ORC)\s*(?:§\s*)?(\d{3,4}\.\d+)/g, m => 'S:' + m[1]],
    [/\b(?:Fla\.\s*Stat\.|Tex\.\s*[A-Z][a-z]+\.?\s*Code|Insurance Law|Ins\.\s*Law|Code)\s+(?:§+\s*)?(\d[\d.\-]*\d)/g, m => 'S:' + core(m[1])],
    [/\bSection\s+(\d[\d.\-]*\d[A-Za-z]?)/g, m => 'S:' + core(m[1])],
    [/\b(?:Chapter|Ch\.)\s+(\d+[A-Z]?)\b/g, m => 'CH:' + m[1]],
    [/\b(?:Article|Art\.)\s+(\d+[A-Z-]*)\b/g, m => 'ART:' + m[1]],
    [/\b(?:Title)\s+(\d+[A-Z]?)\b/g, m => 'TITLE:' + m[1]],
    [/\b(\d+)\s*(?:U\.\s*S\.\s*C\.|USC|C\.\s*F\.\s*R\.|CFR)\s*(?:§+\s*)?(\d[\d.\-]*)?/g, m => 'S:FED' + m[1] + '-' + core(m[2] || '')],
    [/\b((?:[A-Z][A-Za-z'&.\-]*\s+){0,3}[A-Z][A-Za-z'&\-]*)\.?\s+v\.\s+([A-Z][A-Za-z'&\-]+)/g, m => {
      const pl = m[1].split(/\s+/).map(w => w.replace(/[.,]/g, '')).filter(w => w && !CASE_SKIP.has(w.toLowerCase()));
      const name = (pl[0] || m[2]).toLowerCase(); return name.length > 2 ? 'C:' + name : null;
    }],
  ];
  for (const [re, fn] of pats) for (const m of text.matchAll(re)) { const k = fn(m); if (k && !/^S:$|^S:FED\d+-$/.test(k) && k.length > 3) add(k, m[0]); }
  return keys;
}
