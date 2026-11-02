// Stale / unverifiable claims denylist (Phase B close-out). Any sentence in the generated
// sources, state-data.json, rendered pages or model output matching a rule here is a value that
// VERIFICATION_LOG-SEO-CONTENT.md marked CORRECTED/REMOVED (or that has no source at all:
// filing fees, small-claims limits, penalty ranges). Used by scripts/clean-stale-claims.mjs
// (rewrites sources), scripts/test-stale-claims.mjs (gate) and api/_numlint.js (generator).
// Per-state rules are keyed by state abbreviation; ALL applies everywhere.
// ALLOW matches are verified figures (Fla. Stat. 162.09, Tex. Loc. Gov't Code ch. 54, 53 P.S. 10617.2).
export const ALLOW = /162\.09|54\.0(01|17)|10617\.2|\$19\b|Fines up to \$250\/day for first violation|\$250 per day for a first/;
export const ALL = [
  /small[- ]claims?[^.]*(\$\d|limit|cap(ped)?\b|jurisdiction)|(\$\d|limit)[^.]*small[- ]claims?/i,
  /(filing|application|court|recording|stenographer)\s+(fees?|costs?)[^.]*\$\d|\$\d[^.]*(filing|application|court)\s+fees?/i,
  /\bfees? (vary|range|typically)[^.]*\$\d|\$\d[^.]*(typically|generally|commonly)[^.]*(range|vary)/i,
  /magistrate courts? handle|magisterial district court (jurisdiction|limit)|\$12,000 magisterial/i,
  /\$\d[\d,]*\s*(to|[-–\/])\s*\$?\d[\d,]*/,
  /(fines?|penalt(y|ies)|per day|a day|\/day|per unit)[^.]*\$\d|\$\d[^.]*(per day|a day|\/day|per unit|per violation)/i,
  /Flynn|Yecko|Skokie|Schomaeker|Cassell|Willott|Chrismon|McKinney v|Oregon Hill|Mann Media|Mangum|Rotter|Ivancovich|Outdoor Systems|Dade County|Miami Beach|Sunset Estate|Lodi|Drumore|Cleveland v\. Ward|M\.E\.M|M-E-M/,
  /\b11-830\b|12-902|12-904|12-2001|supersedeas|mere inconvenience|one of the shortest/i,
];
export const STATE = {
  AZ: [
    /12-2101(?![^.]*court of appeals)/i,
    /Board of Adjustment[^.]*\b(30|thirty)[- ]days?|\b(30|thirty)[- ]days?[^.]*(appeal|file)[^.]*Board of Adjustment/i,
    /\b(30|thirty)[- ]day (appeal|window|deadline|jurisdictional)/i,
    /9-462\.05[^.]*(misdemeanor|jail|fine)|class [23] misdemeanor/i,
  ],
  GA: [/certiorari|\b5-4-|\b5-3-20/i, /Guhl\/Flynn/],
  TX: [
    /211\.006\(d\)/, /Chapter 2007|§ 2007\./,
    /(Board of Adjustment|board of adjustment|ZBA)[^.]*\b(10|ten|30|thirty)[- ]days?(?![^.]*(filed|filing))|\b(10|30)[- ]days?[^.]*appeal[^.]*(Board of Adjustment)/i,
    /reasonable time/i,
  ],
  NC: [/160D-1402\(c\)[^.]*\b(30|thirty)|\b(30|thirty)[^.]*160D-1402\(c\)/i],
  NY: [/Town Law § ?265[^.]*(\d+|thirty)[- ]days?/i, /Article 78[^.]*\b(60|sixty)[- ]days?|\b(60|sixty)[- ]days?[^.]*Article 78/i],
  IL: [/\b45[- ]days?[^.]*(administrative review|3-103|circuit court|judicial)/i, /\b30[- ]days?[^.]*(Zoning Board of Appeals|board of appeals)/i],
  CA: [/local appeal deadlines typically|\b10 (to 15 )?days to appeal/i],
  OH: [/2335\.39[^.]*(recover|award|fee)/i],
};
export const stale = (sentence, abbr) => {
  if (ALLOW.test(sentence)) return false;
  return [...ALL, ...(STATE[abbr] || [])].some(r => r.test(sentence));
};
// Headline "deadline" field: kept only where a verified value exists; null = remove the field.
// Values come from VERIFICATION_LOG-SEO-CONTENT.md.
const AZ_D = 'Board of Adjustment appeal: within a reasonable time (A.R.S. § 9-462.06(D)); special action in superior court: 30 days (§ 9-462.06(K))';
const TX_D = "Appeal to the board of adjustment: by the 20th day after the decision (Tex. Loc. Gov't Code § 211.010); court petition: within 10 days after the board decision is filed (§ 211.011)";
export const DEADLINES = {
  AZ: { 'conditional-use-permit-denial': AZ_D, 'nonconforming-use-letter': AZ_D, 'setback-variance-request': AZ_D, 'special-use-permit-appeal': AZ_D, 'spot-zoning-challenge': null, 'zoning-board-hearing-objection': AZ_D, 'zoning-code-violation-defense': AZ_D, 'zoning-decision-appeal': AZ_D, 'zoning-variance-appeal-letter': AZ_D },
  CA: { 'zoning-decision-appeal': null, 'zoning-variance-appeal-letter': null },
  GA: { 'zoning-code-violation-defense': null },
  IL: { 'conditional-use-permit-denial': null, 'nonconforming-use-letter': null, 'setback-variance-request': null, 'special-use-permit-appeal': null, 'spot-zoning-challenge': null, 'zoning-board-hearing-objection': null, 'zoning-code-violation-defense': '45 days to appeal to the board of appeals (65 ILCS 5/11-13-12)', 'zoning-decision-appeal': null, 'zoning-variance-appeal-letter': null },
  NY: { 'nonconforming-use-letter': null, 'rezoning-application-letter': null, 'setback-variance-request': null, 'spot-zoning-challenge': null, 'zoning-code-violation-defense': null },
  OH: { 'nonconforming-use-letter': null, 'rezoning-application-letter': null, 'spot-zoning-challenge': null },
  PA: { 'spot-zoning-challenge': null },
  TX: { 'conditional-use-permit-denial': TX_D, 'nonconforming-use-letter': TX_D, 'rezoning-application-letter': null, 'setback-variance-request': TX_D, 'special-use-permit-appeal': TX_D, 'spot-zoning-challenge': null, 'zoning-board-hearing-objection': TX_D, 'zoning-code-violation-defense': TX_D, 'zoning-decision-appeal': TX_D, 'zoning-variance-appeal-letter': TX_D },
};
