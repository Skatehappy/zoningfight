// api/_checklist-fallbacks.js — per-letter-type checklist content, shared by api/checklist.js (Edge-safe: no imports).
// `focus` steers the model; `steps` is the static fallback used when the model list is unusable (call failed,
// cut off twice, or too few items survived the citation/figure lock). Fallback items are plain action steps only:
// no statute, ordinance, case, deadline, fee, dollar amount, percentage or day count (no digits at all), so
// nothing here needs a VERIFICATION_LOG entry. Keys are the exact values api/checklist.js receives from the client
// (varianceType option, "Opposing a granted variance", or the special-exception application title).

const COMMON_START = [
  'Send the letter by certified mail, return receipt requested, and keep the tracking number',
  'Keep a complete copy of everything you send, including attachments',
];
const COMMON_END = [
  'Write down the date you sent the letter and the date any response arrives',
  'Consider a consult with a local land use attorney if the board or office does not respond or the matter is significant',
];

export const TYPES = {
  'Area/Setback Variance': {
    focus: 'a request for an area or setback variance, relief from a required distance from a property line or other area rule',
    steps: ['Get the variance application form and any submission instructions from the town or county clerk', 'Prepare a current survey or plot plan that shows the existing and proposed distances from each property line', 'Prepare a site plan showing the proposed work and the setback you are asking to reduce', 'Photograph the property from the street and rear to show the conditions behind your request', 'Ask the clerk what the filing fee is and how to pay it, and what notice to abutting owners is required', 'Gather the deed or other proof of ownership and a list of abutting property owners'],
  },
  'Use Variance': {
    focus: 'a request for a use variance, permission for a use the zoning district does not normally allow',
    steps: ['Get the variance application form and any submission instructions from the town or county clerk', 'Write down the use you propose and the uses the district currently allows', 'Gather evidence about why the property cannot reasonably be used as the district allows, such as listing history or cost estimates', 'Collect proof that the situation is unique to your property and was not created by you', 'Ask the clerk what the filing fee is, what notice to neighbors is required, and when the hearing will be held', 'Gather the deed or other proof of ownership and a list of abutting property owners'],
  },
  'Dimensional Variance': {
    focus: 'a request for a dimensional variance, relief from a height, lot size, coverage or similar measurement rule',
    steps: ['Get the variance application form and any submission instructions from the town or county clerk', 'List each dimensional rule involved, the measurement the code requires, and the measurement you propose', 'Prepare a survey or plot plan and drawings showing the proposed dimensions', 'Photograph the property and nearby structures to show how your proposal compares with its surroundings', 'Ask the clerk what the filing fee is and what notice to abutting owners is required', 'Gather the deed or other proof of ownership and a list of abutting property owners'],
  },
  'Building Permit Denial': {
    focus: 'an appeal or challenge of a denied building permit',
    steps: ['Get a copy of the written denial and note exactly which reasons the building department gave', 'Keep your complete permit application, plans and every communication with the department', 'Ask the department in writing which code provisions it relied on and who made the decision', 'Ask the clerk how to appeal a permit denial and how long you have, and calendar the answer', 'Consider whether a revised plan could address the stated reasons while you pursue the appeal'],
  },
  'Cease and Desist / Stop Work Order': {
    focus: 'a response to a cease and desist or stop-work order',
    steps: ['Stop the work covered by the order unless an official tells you in writing that you may continue', 'Keep the order itself, note how and when you received it, and photograph the site as it stands now', 'Gather your permits, approved plans and inspection records for the work', 'Ask the issuing office in writing what it must see to lift the order and how to appeal it', 'Ask the clerk what the appeal deadline is and calendar it right away', 'Do not ignore any hearing notice or court paper that follows the order'],
  },
  'Non-Conforming Use Dispute': {
    focus: 'a dispute over whether a property has a legal non-conforming (grandfathered) use',
    steps: ['Gather proof that the use existed before the current zoning rule took effect, such as old permits, licenses, tax and utility records', 'Collect dated photos, advertisements, invoices or testimony showing the use has continued without a break', 'Record any period when the use stopped and the reason, since the local code may treat that as important', 'Ask the zoning office in writing for its file on the property and the basis for its position', 'Identify long-time neighbors or customers who can confirm the history in writing'],
  },
  'Conditional Use Permit Denial': {
    focus: 'a denied conditional use permit',
    steps: ['Get a copy of the written denial and list each reason or finding the board gave', 'Compare each criterion the ordinance sets for a conditional use with the evidence in your application', 'Gather expert reports, traffic or noise information and letters of support that answer the stated reasons', 'Request the full record: application, staff report, hearing minutes and findings', 'Ask the clerk how to appeal or reapply and what time limits apply, and calendar the answer'],
  },
  'Zoning Code Interpretation Dispute': {
    focus: 'a dispute over how the zoning official interpreted the zoning code',
    steps: ['Get the interpretation or determination in writing and note who issued it and when', 'Quote the exact code language at issue and set out the reading you believe is correct', 'Gather earlier decisions, letters or approvals showing how the office treated similar cases', 'Ask the clerk how to appeal an official interpretation and how long you have, and calendar the answer', 'Request the zoning office file for the property and any written guidance it relied on'],
  },
  'Sign Permit Denial': {
    focus: 'a denied sign permit',
    steps: ['Get a copy of the written denial and note exactly what reason it gives for refusing the sign', 'Prepare drawings of the sign showing its size, height, placement, lighting and materials', 'Photograph the proposed location and comparable signs nearby that were allowed', 'Ask the permitting office in writing which sign rule it applied and whether the reason depends on what the sign says', 'Ask the clerk how to appeal a sign denial and how long you have, and calendar the answer'],
  },
  'Code Enforcement / Neighbor Complaint': {
    focus: 'a response to a code enforcement notice or a neighbor complaint about the property',
    steps: ['Keep the notice or complaint, note how and when you received it, and read what it says you must fix', 'Photograph the property with dates visible, both the claimed problem and any corrections you make', 'Ask the enforcement office in writing which code provision is claimed and what it needs to close the matter', 'Keep receipts and records for any corrective work', 'Ask the office how to appeal or request a hearing and what time limits apply, and calendar the answer', 'Do not ignore any hearing notice or court paper'],
  },
  'Other': {
    focus: 'a zoning matter that does not fit the other categories, described by the applicant',
    steps: ['Write a short dated timeline of what happened and what you are asking the board or office to do', 'Gather the notices, decisions, applications and correspondence that relate to the matter', 'Ask the clerk which body decides this kind of matter and what the filing and appeal rules are', 'State clearly in your letter the specific outcome you are requesting'],
  },
  'Opposing a granted variance': {
    focus: 'a property owner opposing a variance already granted to another party',
    steps: ['Ask the clerk in writing for the appeal procedure and the appeal deadline, and calendar the answer right away', 'File your objection with the town or county clerk as well as the board that granted the variance', 'Request the complete record: application, staff report, hearing minutes and findings of fact', 'Photograph site conditions and show how the grant affects your property, such as light, drainage or sightlines', 'Identify other affected neighbors who may join the objection', 'Check whether your jurisdiction requires a formal appeal filing rather than a letter of objection'],
  },
  'Request a Special Exception': {
    focus: 'a request for a special exception, a use the zoning code already allows if listed criteria are met',
    steps: ['Get the special exception application form and instructions from the clerk', 'List each criterion the ordinance sets and match it to a document or fact that shows you meet it', 'Prepare a site plan and a description of the proposed use, including hours, traffic, parking and any noise', 'Gather letters of support or expert reports that address the criteria', 'Ask the clerk what the filing fee is, what notice to neighbors is required, and when the hearing will be held'],
  },
  'Oppose a Special Exception': {
    focus: 'a property owner opposing a special exception granted or proposed for another party',
    steps: ['Ask the clerk in writing for the hearing and appeal procedure and the deadlines, and calendar the answers right away', 'List each criterion the ordinance sets for a special exception and the facts showing it is not met', 'Request the complete record: application, staff report, hearing minutes and findings', 'Photograph site conditions and document traffic, noise or other effects on your property', 'Identify other affected neighbors who may join the objection or speak at the hearing'],
  },
};

const NEUTRAL = {
  focus: 'a zoning or land use matter before a local board or office',
  steps: ['Write a short dated timeline of what happened and what you are asking the board or office to do', 'Gather the notices, decisions, applications and correspondence that relate to the matter', 'Ask the clerk which body decides this kind of matter and what the filing and appeal rules are', 'State clearly in your letter the specific outcome you are requesting'],
};
const norm = s => String(s || '').trim().toLowerCase();
export function typeInfo(type) {
  const k = Object.keys(TYPES).find(t => norm(t) === norm(type));
  return k ? TYPES[k] : NEUTRAL;
}
export function fallbackFor(type) {
  return [...COMMON_START, ...typeInfo(type).steps, ...COMMON_END];
}
