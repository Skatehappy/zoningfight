// src/lib/criteria.js — T5 criteria repeating group -> prompt scaffold.
//
// THE CORE CONSTRAINT: the app supplies NO ordinance criteria. Each row is
// user-entered: (a) the criterion as written in their ordinance, (b) how their
// proposal satisfies it. The generator maps each row to a numbered argument
// section IN ORDER. Blank (b) -> visible bracketed placeholder, never fabricated.
//
// Recited criteria are wrapped in ⟦ ⟧ markers so the no-fabrication lint
// (api/_lint.js) can verify every recited criterion is one the user typed. The
// markers are stripped from the delivered letter.

export const CRITERION_CAP = 400;
export const EVIDENCE_CAP = 1200;
export const MAX_ROWS = 8;
export const MIN_ROWS = 1;
export const BLANK_PLACEHOLDER = '[Applicant to supply evidence for this criterion]';

// Normalize a raw criteria array into non-empty rows (criterion text required).
export function cleanCriteria(rows) {
  return (rows || [])
    .map(r => ({
      criterion: String(r?.criterion || '').trim(),
      evidence: String(r?.evidence || '').trim(),
    }))
    .filter(r => r.criterion.length > 0)
    .slice(0, MAX_ROWS);
}

// Build the CRITERIA block for the user prompt. Each criterion is presented
// with its ⟦ ⟧ markers already applied so the model reproduces them verbatim.
export function buildCriteriaBlock(rows) {
  const clean = cleanCriteria(rows);
  if (!clean.length) return { block: '', criteria: [] };
  const lines = clean.map((r, i) => {
    const evidence = r.evidence ? r.evidence : BLANK_PLACEHOLDER;
    return `CRITERION ${i + 1} (recite verbatim inside the markers, do not alter): ⟦${r.criterion}⟧\n` +
           `HOW THE PROPOSAL SATISFIES IT: ${evidence}`;
  });
  return { block: lines.join('\n\n'), criteria: clean };
}
