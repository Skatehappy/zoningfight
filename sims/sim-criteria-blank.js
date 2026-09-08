// sim-criteria-blank.js
// A blank evidence response renders a bracketed placeholder — never fabricated
// text — and still passes the no-fabrication lint.
import { buildCriteriaBlock, BLANK_PLACEHOLDER } from '../src/lib/criteria.js';
import { lintLetter } from '../api/_lint.js';
import { ok, eq, pass } from './_assert.mjs';

const rows = [
  { criterion: 'The use is consistent with the comprehensive plan', evidence: '' }, // blank (b)
];
const { block, criteria } = buildCriteriaBlock(rows);

ok(block.includes(BLANK_PLACEHOLDER), 'blank evidence yields a visible bracketed placeholder');
ok(block.includes('⟦The use is consistent with the comprehensive plan⟧'), 'the user criterion is wrapped in markers verbatim');
eq(criteria.length, 1, 'the row is retained (criterion is non-empty)');

// A letter reciting the marked criterion + placeholder must pass (no fabrication).
const letter = `Dear Board,\n1. ⟦The use is consistent with the comprehensive plan⟧ — ${BLANK_PLACEHOLDER}.\n`;
const r = lintLetter(letter, { criteria });
eq(r.ok, true, 'placeholder + faithful criterion passes the lint');

pass('sim-criteria-blank');
