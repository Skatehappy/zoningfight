// sim-fl-sections.js
// The FL special-exception letter structure contains burden-allocation,
// both-prongs, and record-preservation sections (tested against the frame-driven
// prompt, headless — no model call).
import { REGISTRY } from './_frames.mjs';
import { selectFrame } from '../frames/select.mjs';
import { buildFramePrompt } from '../src/lib/prompt.js';
import { ok, pass } from './_assert.mjs';

const { frame } = selectFrame(REGISTRY, 'FL', 'special_exception');

// section_order structural assertions
for (const s of ['burden_allocation', 'both_prongs', 'record_preservation']) {
  ok(frame.section_order.includes(s), `FL frame section_order includes ${s}`);
}

const { system } = buildFramePrompt(frame, {
  applicationType: 'special_exception',
  posture: 'requesting',
  formData: { state: 'FL', terminology: 'Special Exception', decidingBody: 'Board of County Commissioners' },
  criteriaRows: [{ criterion: 'The use is compatible with surrounding uses', evidence: 'Adjacent parcels are similarly zoned.' }],
});

ok(/Burden Allocation/i.test(system), 'built prompt contains the Burden Allocation section');
ok(/Both Prongs/i.test(system), 'built prompt contains the Both Prongs section');
ok(/Record Preservation/i.test(system), 'built prompt contains the Record Preservation section');
ok(/Irvine v\. Duval/i.test(system), 'built prompt cites Irvine for the burden shift');
ok(/burden has shifted/i.test(system), 'built prompt states the burden has shifted');

pass('sim-fl-sections');
