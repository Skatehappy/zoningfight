// sim-input-caps.js
// Oversized input is rejected client-side and ZERO reservations are created
// (validation runs before zf_reserve_code).
import { checkPayload, CAPS } from '../src/lib/validate.js';
import { ok, eq, pass } from './_assert.mjs';

// A mock of the App submit path: validate, then only reserve if valid.
let reserveCalls = 0;
async function submit(entries) {
  const v = checkPayload(entries);
  if (!v.ok) return v;          // never reaches reserve
  reserveCalls += 1;            // stand-in for zf_reserve_code
  return { ok: true };
}

const oversized = [
  { label: 'Regulation Section Numbers', value: 'x'.repeat(CAPS.regulationSections + 50), limit: CAPS.regulationSections },
];
const r1 = await submit(oversized);
eq(r1.ok, false, 'oversized field is rejected');
eq(r1.code, 'INPUT_TOO_LONG', 'rejection code is INPUT_TOO_LONG');
eq(r1.label, 'Regulation Section Numbers', 'the offending field is named');
eq(reserveCalls, 0, 'ZERO reservations created on invalid input');

// A valid payload reserves exactly once.
const okPayload = [
  { label: 'Regulation Section Numbers', value: 'Section 4.2.1; Article VI', limit: CAPS.regulationSections },
  { label: 'Additional Information', value: 'Short note.', limit: CAPS.additionalInfo },
];
const r2 = await submit(okPayload);
eq(r2.ok, true, 'valid payload passes validation');
eq(reserveCalls, 1, 'a valid payload reserves exactly once');

pass('sim-input-caps');
