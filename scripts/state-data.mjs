// scripts/state-data.mjs — resolved per-jurisdiction data for the state-frame
// backfill. FL is frozen (not here). Records are appended one batch (10) at a time.
//
// Defaults, per the understatement rule (§0) and burden-shift skepticism (§5):
//   se_burden: 'criteria_compliance'  (special exceptions are conditionally-
//              permitted uses; NO burden shift unless a verified appellate cite)
//   variance:  always applicant_carries, hardship language permitted
//   citations: ZERO unless verified (existence + proposition). Zero is acceptable.
//
// A frame only becomes 'prima_facie_shifting' with a verified appellate citation.
// None found in batch 1 (matches expectation — only FL/Irvine is comparable).

export const VERIFIED_ON = '2026-09-09';

export const JURISDICTIONS = [
  // ---- Batch 1 (WebSearch-resolved 2026-09-09) ----
  { abbr: 'AL', name: 'Alabama',
    se_term: 'Special Exception', se_options: ['Special Exception', 'Special Use Permit'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'AK', name: 'Alaska',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Use Permit'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'AZ', name: 'Arizona',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Use Permit'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'AR', name: 'Arkansas',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'CA', name: 'California',
    se_term: 'Conditional Use', se_options: ['Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'CO', name: 'Colorado',
    se_term: 'Special Use', se_options: ['Special Use', 'Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'CT', name: 'Connecticut',
    se_term: 'Special Permit', se_options: ['Special Permit', 'Special Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'DE', name: 'Delaware',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Use Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'DC', name: 'District of Columbia',
    se_term: 'Special Exception', se_options: ['Special Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'GA', name: 'Georgia',
    se_term: 'Special Use Permit', se_options: ['Special Use Permit', 'Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  // ---- Batch 2 (WebSearch-resolved 2026-09-09) ----
  { abbr: 'HI', name: 'Hawaii',
    se_term: 'Special Use Permit', se_options: ['Special Use Permit', 'Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'ID', name: 'Idaho',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Use Permit'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'IL', name: 'Illinois',
    se_term: 'Special Use Permit', se_options: ['Special Use Permit', 'Special Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'IN', name: 'Indiana',
    se_term: 'Special Exception', se_options: ['Special Exception', 'Special Use', 'Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'IA', name: 'Iowa',
    se_term: 'Special Exception', se_options: ['Special Exception', 'Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'KS', name: 'Kansas',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Use Permit'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'KY', name: 'Kentucky',
    se_term: 'Conditional Use', se_options: ['Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'LA', name: 'Louisiana',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'ME', name: 'Maine',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'MD', name: 'Maryland',
    se_term: 'Special Exception', se_options: ['Special Exception', 'Conditional Use'],
    se_burden: 'prima_facie_shifting', se_status: 'verified',
    se_authority: [{
      cite: 'Schultz v. Pritts, 291 Md. 1 (1981)',
      proposition: 'A special exception use enjoys a presumption that it is in the interest of the general welfare and is valid; the applicant need not affirmatively prove benefit to the community — showing the proposed use would be conducted without real detriment to the neighborhood meets the applicant’s burden — and the exception may be denied only on facts showing adverse effects above and beyond those inherently associated with such use irrespective of its location within the zone.',
    }],
    var_authority: [], var_status: 'verified' },

  // ---- Batch 3 (WebSearch-resolved 2026-09-09) ----
  // Discretionary special-permit states (board may deny even if criteria met) are
  // set to applicant_carries, NOT criteria_compliance: MA, MO, MT.
  { abbr: 'MA', name: 'Massachusetts',
    se_term: 'Special Permit', se_options: ['Special Permit'],
    se_burden: 'applicant_carries', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'MI', name: 'Michigan',
    se_term: 'Special Land Use', se_options: ['Special Land Use', 'Special Use Permit'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'MN', name: 'Minnesota',
    se_term: 'Conditional Use', se_options: ['Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'MS', name: 'Mississippi',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'MO', name: 'Missouri',
    se_term: 'Special Use Permit', se_options: ['Special Use Permit', 'Conditional Use'],
    se_burden: 'applicant_carries', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'MT', name: 'Montana',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Use'],
    se_burden: 'applicant_carries', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'NE', name: 'Nebraska',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'NV', name: 'Nevada',
    se_term: 'Special Use Permit', se_options: ['Special Use Permit', 'Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'NH', name: 'New Hampshire',
    se_term: 'Special Exception', se_options: ['Special Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'NJ', name: 'New Jersey',
    se_term: 'Conditional Use', se_options: ['Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  // ---- Batch 4 (WebSearch-resolved 2026-09-09) — 3 verified burden shifts ----
  { abbr: 'NM', name: 'New Mexico',
    se_term: 'Conditional Use', se_options: ['Conditional Use', 'Special Use Permit'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'NY', name: 'New York',
    se_term: 'Special Use Permit', se_options: ['Special Use Permit', 'Special Permit'],
    se_burden: 'prima_facie_shifting', se_status: 'verified',
    se_authority: [{
      cite: 'Matter of North Shore Steak House v. Board of Appeals of Inc. Vil. of Thomaston, 30 N.Y.2d 238 (1972)',
      proposition: 'The inclusion of a use as a permitted special exception is a legislative finding that the use is in harmony with the general zoning plan and will not adversely affect the neighborhood; a strong presumption favors the use, and the applicant’s burden is significantly lighter than that for a variance — the use is contemplated by the ordinance subject only to conditions attached to minimize its impact.',
    }],
    var_authority: [], var_status: 'verified' },

  { abbr: 'NC', name: 'North Carolina',
    se_term: 'Special Use Permit', se_options: ['Special Use Permit', 'Conditional Use'],
    se_burden: 'prima_facie_shifting', se_status: 'verified',
    se_authority: [{
      cite: 'Humble Oil & Refining Co. v. Board of Aldermen of Chapel Hill, 284 N.C. 458, 202 S.E.2d 129 (1974)',
      proposition: 'When an applicant produces competent, material, and substantial evidence establishing the facts and conditions the ordinance requires for issuance, prima facie the applicant is entitled to the permit; the burden then shifts to the opponents to present competent, material, and substantial evidence to the contrary, and absent such evidence the applicant is entitled to the permit as a matter of law.',
    }],
    var_authority: [], var_status: 'verified' },

  { abbr: 'ND', name: 'North Dakota',
    se_term: 'Conditional Use', se_options: ['Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'OH', name: 'Ohio',
    se_term: 'Conditional Use', se_options: ['Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'OK', name: 'Oklahoma',
    se_term: 'Special Exception', se_options: ['Special Exception', 'Special Permit'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'OR', name: 'Oregon',
    se_term: 'Conditional Use', se_options: ['Conditional Use'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'PA', name: 'Pennsylvania',
    se_term: 'Special Exception', se_options: ['Special Exception'],
    se_burden: 'prima_facie_shifting', se_status: 'verified',
    se_authority: [{
      cite: 'Bray v. Zoning Bd. of Adjustment, 410 A.2d 909 (Pa. Commw. Ct. 1980)',
      proposition: 'Once the applicant proves compliance with the specific, objective criteria of the ordinance, a presumption arises that the use is consistent with the health, safety, and general welfare of the community, and the burden shifts to the objectors to present evidence and persuade the board that the proposed use will have a generally detrimental effect.',
    }],
    var_authority: [], var_status: 'verified' },

  { abbr: 'RI', name: 'Rhode Island',
    se_term: 'Special Use Permit', se_options: ['Special Use Permit', 'Special Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },

  { abbr: 'SC', name: 'South Carolina',
    se_term: 'Special Exception', se_options: ['Special Exception'],
    se_burden: 'criteria_compliance', se_authority: [], se_status: 'verified',
    var_authority: [], var_status: 'verified' },
];
