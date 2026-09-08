// sim-generic-no-burden-shift.js
// A GENERIC-frame letter asserts NO burden shift (applicant carries throughout).
import { REGISTRY } from './_frames.mjs';
import { selectFrame } from '../frames/select.mjs';
import { buildFramePrompt } from '../src/lib/prompt.js';
import { ok, eq, pass } from './_assert.mjs';

const sel = selectFrame(REGISTRY, 'WY', 'special_exception');
eq(sel.frame.state, 'GENERIC', 'WY special-exception uses GENERIC');
eq(sel.frame.burden, 'applicant_carries', 'GENERIC burden is applicant_carries');
ok(!sel.frame.section_order.includes('burden_allocation'), 'GENERIC has no burden_allocation section');
ok(!sel.frame.section_order.includes('both_prongs'), 'GENERIC has no both_prongs section');
eq((sel.frame.governing_authority || []).length, 0, 'GENERIC asserts no case authority');

const { system } = buildFramePrompt(sel.frame, {
  applicationType: 'special_exception',
  formData: { state: 'WY', terminology: 'Special Exception', decidingBody: 'Board of Adjustment' },
  criteriaRows: [{ criterion: 'The use will not be detrimental to the neighborhood', evidence: 'No added traffic.' }],
});

ok(/Do NOT assert any burden shift/i.test(system), 'GENERIC prompt forbids asserting a burden shift');
ok(/applicant carries the burden throughout/i.test(system), 'GENERIC prompt states the applicant carries the burden');
ok(!/burden has shifted/i.test(system), 'GENERIC prompt never states the burden shifted');

pass('sim-generic-no-burden-shift');
