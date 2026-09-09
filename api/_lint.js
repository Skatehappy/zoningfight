// api/_lint.js — post-generation lints (T5). Shared by api/generate.js and the
// Gate-1 sims. Pure, no I/O.
//
// TWO enforcement rails, both HARD:
//
// 1. Forbidden phrases — for Special Exception / Opposing a Special Exception
//    (frame.forbidden_phrases). Hardship language in a Florida special
//    exception surrenders the Irvine burden shift. Substantive defect.
//
// 2. No fabrication — the generator emits NO ordinance text the user did not
//    type. The generator wraps every recited criterion in the markers ⟦ … ⟧
//    (and the frame prompt forbids putting anything else between them). This
//    lint extracts every ⟦…⟧ span and asserts each normalizes to a
//    user-entered criterion. An unmatched span is a fabricated criterion.
//    Markers are stripped from the delivered letter (the buyer never sees them).

export const FORBIDDEN_DEFAULT = [
  'unnecessary hardship',
  'practical difficulty',
  'hardship unique to',
  'undue hardship',
  'exceptional difficulty',
];

// Normalize for comparison: lowercase, collapse whitespace, drop punctuation.
export function normalizeCriterion(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[‘’“”]/g, '')  // smart quotes
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function userCriteriaSet(criteria) {
  const set = new Set();
  for (const c of criteria || []) {
    const raw = typeof c === 'string' ? c : (c && c.criterion);
    const n = normalizeCriterion(raw);
    if (n) set.add(n);
  }
  return set;
}

// Is `n` contained in, or containing, any user criterion? (tolerates the model
// quoting a criterion with a trailing clause trimmed or an added period).
function matchesUser(n, set) {
  if (set.has(n)) return true;
  for (const u of set) {
    if (u.length >= 12 && (u.includes(n) || n.includes(u))) return true;
  }
  return false;
}

/**
 * @param {string} text  raw model output (may contain ⟦…⟧ markers)
 * @param {object} opts
 * @param {Array}  opts.criteria         user-entered criteria rows
 * @param {Array}  opts.forbiddenPhrases phrases to reject (from the frame)
 * @param {boolean} opts.enforceForbidden fall back to FORBIDDEN_DEFAULT
 * @returns {{ok:true, cleanText:string} | {ok:false, reason:string}}
 */
export function lintLetter(text, opts = {}) {
  const { criteria = [], forbiddenPhrases = null, enforceForbidden = false } = opts;
  const src = String(text || '');

  // --- rail 1: forbidden phrases -----------------------------------------
  const forbidden =
    forbiddenPhrases && forbiddenPhrases.length
      ? forbiddenPhrases
      : enforceForbidden
      ? FORBIDDEN_DEFAULT
      : [];
  const low = src.toLowerCase();
  for (const p of forbidden) {
    if (low.includes(String(p).toLowerCase())) {
      return { ok: false, reason: `forbidden_phrase:${p}` };
    }
  }

  // --- rail 2: no fabrication --------------------------------------------
  const set = userCriteriaSet(criteria);
  const spans = [...src.matchAll(/⟦([^⟧]*)⟧/g)].map(m => m[1]);
  for (const span of spans) {
    if (!span.trim()) continue;                    // empty marker
    if (/^\s*\[[^\]]*\]\s*$/.test(span)) continue; // bracketed placeholder, not a criterion
    const n = normalizeCriterion(span);
    if (!n) continue;
    if (!matchesUser(n, set)) {
      return { ok: false, reason: 'fabricated_criterion' };
    }
  }

  // strip markers for delivery
  const cleanText = src.replace(/[⟦⟧]/g, '');
  return { ok: true, cleanText };
}
