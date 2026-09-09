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
];
