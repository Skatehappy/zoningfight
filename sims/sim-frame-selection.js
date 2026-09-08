// sim-frame-selection.js
// (FL, special_exception) -> FL frame; (WY, special_exception) -> GENERIC, logged.
import { REGISTRY } from './_frames.mjs';
import { selectFrame } from '../frames/select.mjs';
import { ok, eq, pass } from './_assert.mjs';

const fl = selectFrame(REGISTRY, 'Florida', 'special_exception');
eq(fl.fallback, false, '(FL, special_exception) is not a fallback');
eq(fl.frame.state, 'FL', '(FL, special_exception) selects the FL frame');
eq(fl.frame.burden, 'prima_facie_shifting', 'FL special-exception frame carries the burden-shift');

const flAbbr = selectFrame(REGISTRY, 'FL', 'special_exception');
eq(flAbbr.frame.state, 'FL', 'state abbreviation "FL" also selects the FL frame');

const wy = selectFrame(REGISTRY, 'WY', 'special_exception');
eq(wy.fallback, true, '(WY, special_exception) falls back');
eq(wy.frame.state, 'GENERIC', '(WY, special_exception) selects GENERIC');
if (wy.fallback) console.log(`  [DECISIONS backfill] GENERIC fallback hit: ${wy.key}`);

// Opposing posture shares the requesting frame's doctrine.
const flOppSE = selectFrame(REGISTRY, 'FL', 'opposing_special_exception');
eq(flOppSE.frame.state, 'FL', 'opposing-special-exception uses the FL special-exception doctrine');

pass('sim-frame-selection');
