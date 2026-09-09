// scripts/frame-templates.mjs — state-agnostic section templates + generator.
// Produces frames that match the frozen FL structure EXACTLY. FL itself is never
// generated here (it is frozen — see directive §2).
//
// Understatement rule (§0): default to no burden shift and zero citations. A
// special_exception frame only gets `prima_facie_shifting` when a verified
// appellate citation is supplied.

export const HARDSHIP_PHRASES = [
  'unnecessary hardship', 'practical difficulty', 'hardship unique to',
  'undue hardship', 'exceptional difficulty',
];

const SEC = {
  caption_request: {
    title: 'Caption and Request',
    instruction: 'Formal caption: deciding body as entered by the user, parcel/address, zoning district, and the request using the local term the user selected. One paragraph.',
  },
  authorization: {
    title: 'Authorization',
    instruction: "State that the requested use/relief is provided for in this district under the user's Regulation Section Numbers. Use only what the user provided; blank -> bracketed placeholder.",
  },
  criteria_compliance_neutral: {
    title: 'Criterion-by-Criterion Compliance',
    instruction: 'The applicant carries the burden throughout — make NO burden-shift assertion. One numbered subsection per user-entered criterion row, IN ORDER. Recite each criterion VERBATIM inside the criterion markers exactly as shown in the ABSOLUTE RULES (nothing else between them), then argue it is satisfied using the user\'s evidence. NEVER invent or paraphrase criterion text. Blank evidence -> visible bracketed placeholder, never fabricated.',
  },
  criteria_compliance_prima_facie: {
    title: 'Criterion-by-Criterion Compliance',
    instruction: 'This is the prima facie showing. One numbered subsection per user-entered criterion row, IN ORDER. Recite each criterion VERBATIM inside the criterion markers exactly as shown in the ABSOLUTE RULES (nothing else between them), then argue, using the user\'s evidence, that the criterion is met. NEVER invent, paraphrase into, or supply criterion text the user did not type. Blank evidence -> visible bracketed placeholder, never fabricated.',
  },
  signature_block: {
    title: 'Signature Block',
    instruction: 'Professional signature block for the applicant with a [DATE] placeholder.',
  },
  record_preservation: {
    title: 'Record Preservation',
    instruction: 'Request that this letter and its attachments be entered into the hearing record. These proceedings are quasi-judicial and reviewed on the record by certiorari; a denial unsupported by competent substantial record evidence is the applicant\'s remedy. One paragraph.',
  },
};

function burdenAllocationSection(cite) {
  return {
    title: 'Burden Allocation',
    instruction: `Having made the prima facie showing, cite ${cite} and state that, under that authority (see the governing authority proposition above), the burden has shifted — the application must be granted unless the opposition demonstrates, by competent substantial evidence in the record, that the standards are not met. State the shift only as far as that verified authority supports; do not overstate it.`,
  };
}

function hardshipShowingSection(cite) {
  const tail = cite
    ? `consistent with ${cite}`
    : 'consistent with the applicable state variance standard';
  return {
    title: 'Hardship Showing',
    instruction: `The applicant carries the burden throughout. Argue the legal hardship from the user's facts, showing it is exceptional and unique to this property and not self-created, ${tail}. Use only facts the user supplied.`,
  };
}

// Build a special_exception frame.
export function buildSpecialException(rec, verifiedOn) {
  const shift = rec.se_burden === 'prima_facie_shifting';
  const authority = shift ? (rec.se_authority || []) : [];
  const primaryCite = authority[0]?.cite || '';
  const sections = {
    caption_request: SEC.caption_request,
    authorization: SEC.authorization,
    criteria_compliance: shift ? SEC.criteria_compliance_prima_facie : SEC.criteria_compliance_neutral,
    signature_block: SEC.signature_block,
  };
  let section_order;
  if (shift) {
    // Generic shift structure. FL's frozen frame additionally has a FL-specific
    // "both_prongs" section (Irvine/Jesus Fellowship); that is NOT generalized to
    // other states, whose shift doctrine differs.
    sections.burden_allocation = burdenAllocationSection(primaryCite);
    sections.record_preservation = SEC.record_preservation;
    section_order = ['caption_request', 'authorization', 'criteria_compliance', 'burden_allocation', 'record_preservation', 'signature_block'];
  } else {
    section_order = ['caption_request', 'authorization', 'criteria_compliance', 'signature_block'];
  }
  return {
    state: rec.abbr,
    application_type: 'special_exception',
    terminology_default: rec.se_term,
    terminology_options: rec.se_options,
    burden: rec.se_burden,
    governing_authority: authority,
    section_order,
    sections,
    forbidden_phrases: HARDSHIP_PHRASES,
    record_preservation: !!shift,
    verified_on: verifiedOn,
    verified_via: 'WebSearch',
    validation_status: rec.se_status || 'verified',
  };
}

// Build a variance frame (always applicant_carries; hardship language is correct here).
export function buildVariance(rec, verifiedOn) {
  const authority = rec.var_authority || [];
  const primaryCite = authority[0]?.cite || '';
  return {
    state: rec.abbr,
    application_type: 'variance',
    terminology_default: 'Variance',
    terminology_options: ['Variance'],
    burden: 'applicant_carries',
    governing_authority: authority,
    section_order: ['caption_request', 'hardship_showing', 'criteria_compliance', 'record_preservation', 'signature_block'],
    sections: {
      caption_request: SEC.caption_request,
      hardship_showing: hardshipShowingSection(primaryCite),
      criteria_compliance: SEC.criteria_compliance_neutral,
      record_preservation: SEC.record_preservation,
      signature_block: SEC.signature_block,
    },
    forbidden_phrases: [],
    record_preservation: true,
    verified_on: verifiedOn,
    verified_via: 'WebSearch',
    validation_status: rec.var_status || 'verified',
  };
}
