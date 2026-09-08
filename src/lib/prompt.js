// src/lib/prompt.js — frame-driven prompt builder (T5). Pure; used by the App
// and by the Gate-1 sims (so section structure is testable without calling the
// model).
//
// The generator may argue, structure, and cite STATE authority (carried in the
// frame). It may NOT supply local ordinance content — that comes only from the
// user's criteria rows, which are wrapped in ⟦ ⟧ markers and checked by the
// no-fabrication lint.

import { buildCriteriaBlock } from './criteria.js';
import { forbiddenFor, isSpecialExceptionType, baseType } from '../../frames/select.mjs';

function fieldsBlock(f = {}) {
  const line = (label, v) => `${label}: ${v && String(v).trim() ? v : 'not provided'}`;
  return [
    line('DECIDING BODY (address the letter here)', f.decidingBody),
    line('PROPERTY / PARCEL', f.propertyAddress),
    line('MUNICIPALITY', f.municipality || f.town),
    line('STATE', f.state),
    line('ZONING DISTRICT', f.zoningDistrict),
    line('LOCAL TERM FOR THE RELIEF', f.terminology),
    line('REGULATION SECTION NUMBERS (user-provided; do not invent)', f.regulationSections),
    line('ADDITIONAL INFORMATION', f.additionalInfo),
  ].join('\n');
}

export function buildFramePrompt(frame, opts = {}) {
  const { formData = {}, criteriaRows = [], applicationType = '', posture = 'requesting', tone = 'standard' } = opts;
  const { block: criteriaBlock, criteria } = buildCriteriaBlock(criteriaRows);
  const forbidden = forbiddenFor(frame, applicationType);
  const enforceForbidden = isSpecialExceptionType(applicationType);
  const opposing = posture === 'opposing';

  const sectionLines = (frame.section_order || []).map((key, i) => {
    const s = (frame.sections && frame.sections[key]) || { title: key, instruction: '' };
    return `${i + 1}. ${s.title} — ${s.instruction}`;
  });

  const authorityLines = (frame.governing_authority || [])
    .map(a => `- ${a.cite}: ${a.proposition}`);

  const header = opposing
    ? `You are an expert Florida land use attorney writing on behalf of a party OPPOSING a ${formData.terminology || 'special exception'} sought by another applicant. Argue that the application does NOT satisfy the standards and that competent substantial evidence in the record shows it is adverse to the public interest.`
    : `You are an expert land use attorney writing a persuasive application letter for a ${formData.terminology || 'land use'} matter.`;

  const system = [
    header,
    '',
    'Write the letter using EXACTLY these sections, in this order:',
    ...sectionLines,
    '',
    authorityLines.length ? 'You MAY rely on this state-level controlling authority (do not invent other citations):' : 'Do NOT assert any burden shift; the applicant carries the burden throughout. Cite no case authority you are not certain of.',
    ...authorityLines,
    '',
    'ABSOLUTE RULES:',
    '- Reproduce each user-supplied criterion VERBATIM inside its ⟦ ⟧ markers. Put nothing else between the markers. Never invent, add, or paraphrase a criterion the user did not type.',
    '- Where a criterion has no user evidence, keep the bracketed placeholder; never fabricate evidence.',
    forbidden.length ? `- NEVER use any of these phrases (they are legally wrong here): ${forbidden.map(p => `"${p}"`).join(', ')}.` : '',
    '- Formal letter, [DATE] placeholder, via certified mail. 550-800 words. Output ONLY the letter, no preamble.',
  ].filter(Boolean).join('\n');

  const toneNote = tone === 'assertive'
    ? 'Write a MORE ASSERTIVE version — stronger framing and more forceful argument, different wording from the standard version.'
    : 'Write a STANDARD, professional version.';

  const user = [
    toneNote,
    '',
    fieldsBlock(formData),
    '',
    criteriaBlock ? `CRITERIA FROM THE USER'S ORDINANCE (argue each in order):\n${criteriaBlock}`
                  : 'CRITERIA: (none provided — insert a visible bracketed placeholder inviting the applicant to add the ordinance criteria).',
  ].join('\n');

  return {
    system,
    user,
    criteria,
    forbiddenPhrases: forbidden,
    enforceForbidden,
    baseType: baseType(applicationType),
  };
}
