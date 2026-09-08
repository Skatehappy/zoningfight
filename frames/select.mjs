// frames/select.mjs — pure frame-selection logic shared by the client
// (src/lib/frames.js) and the Gate-1 sims. No I/O; the caller passes a registry.
//
// The registry is keyed "AB:base_type", e.g. "FL:special_exception". The
// GENERIC frame is the fallback for any (state, type) not verified this pass.
//
// Opposing postures share the SAME body of doctrine as their requesting
// counterpart (opposing a special exception still turns on the Irvine burden
// allocation and the same hardship-language ban), so the frame LOOKUP strips
// the "opposing_" prefix. The requesting-vs-opposing argument posture is chosen
// separately by the prompt builder — it does not change which frame applies.

const STATE_ABBR = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA',
  'colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA',
  'hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA','kansas':'KS',
  'kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD','massachusetts':'MA',
  'michigan':'MI','minnesota':'MN','mississippi':'MS','missouri':'MO','montana':'MT',
  'nebraska':'NE','nevada':'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM',
  'new york':'NY','north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK',
  'oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC',
  'south dakota':'SD','tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT',
  'virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY',
};

export function stateAbbr(state) {
  const s = String(state || '').trim();
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  return STATE_ABBR[s.toLowerCase()] || s.toUpperCase();
}

export function baseType(applicationType) {
  return String(applicationType || '').toLowerCase().replace(/^opposing_/, '');
}

export function frameKey(state, applicationType) {
  return `${stateAbbr(state)}:${baseType(applicationType)}`;
}

/**
 * @param {object} registry  { "FL:special_exception": {...}, ..., GENERIC: {...} }
 * @returns {{ frame:object, fallback:boolean, key:string }}
 */
export function selectFrame(registry, state, applicationType) {
  const key = frameKey(state, applicationType);
  if (registry[key]) return { frame: registry[key], fallback: false, key };
  return { frame: registry.GENERIC, fallback: true, key };
}

// Which phrases to forbid for this application type. Special-exception and
// opposing-special-exception (types 2 & 4) forbid hardship language; use the
// frame's list when present, else the default set.
export const FORBIDDEN_DEFAULT = [
  'unnecessary hardship', 'practical difficulty', 'hardship unique to',
  'undue hardship', 'exceptional difficulty',
];

export function isSpecialExceptionType(applicationType) {
  return baseType(applicationType) === 'special_exception';
}

export function forbiddenFor(frame, applicationType) {
  if (frame && frame.forbidden_phrases && frame.forbidden_phrases.length) {
    return frame.forbidden_phrases;
  }
  return isSpecialExceptionType(applicationType) ? FORBIDDEN_DEFAULT : [];
}
