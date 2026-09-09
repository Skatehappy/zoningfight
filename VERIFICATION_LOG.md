# ZoningFight — Regulatory Verification Log
Created: 2026-07-19
Retrieval layer: Perplexity MCP
Master input: C:\NEWEST OF THE NEW\reports\Portfolio-Regulatory-Sweep.md
Standard: Three-Gate v7

### 2026-07-19 — NY Town Law §267
- **Source file:** src/App.jsx:337
- **Verdict:** VERIFIED
- **Subject:** New York Town Law §267 establishes the zoning board of appeals.
- **Source:** https://www.nysenate.gov/legislation/laws/TWN/267
- **Action:** no change — confirmed

### 2026-07-19 — NY Town Law §267-b
- **Source file:** src/App.jsx:369
- **Verdict:** VERIFIED
- **Subject:** New York Town Law §267-b governs area and use variances heard by the ZBA.
- **Source:** https://www.nysenate.gov/legislation/laws/TWN/267-B
- **Action:** no change — confirmed

### 2026-07-19 — NY Town Law §274-b
- **Source file:** src/App.jsx:386
- **Verdict:** VERIFIED
- **Subject:** New York Town Law §274-b governs special use permits.
- **Source:** https://www.nysenate.gov/legislation/laws/TWN/274-B
- **Action:** no change — confirmed

### 2026-07-19 — CGS §8-2
- **Source file:** src/App.jsx:369
- **Verdict:** VERIFIED
- **Subject:** Connecticut General Statutes §8-2 is the zoning enabling / regulations statute.
- **Source:** https://www.cga.ct.gov/current/pub/chap_124.htm#sec_8-2
- **Action:** no change — confirmed

### 2026-07-19 — CGS §8-7
- **Source file:** src/App.jsx:337
- **Verdict:** VERIFIED
- **Subject:** Connecticut General Statutes §8-7 governs appeals to the zoning board of appeals.
- **Source:** https://www.cga.ct.gov/current/pub/chap_124.htm#sec_8-7
- **Action:** no change — confirmed

### 2026-07-19 — FL Statutes Chapter 163 / §163.3202
- **Source file:** src/App.jsx:386
- **Verdict:** VERIFIED
- **Subject:** Florida Statutes Chapter 163, §163.3202 requires local land development regulations.
- **Source:** http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0100-0199/0163/Sections/0163.3202.html
- **Action:** no change — confirmed

### 2026-07-19 — 42 U.S.C. §1983
- **Source file:** src/App.jsx:342
- **Verdict:** VERIFIED
- **Subject:** 42 U.S.C. §1983 provides the civil-rights cause of action for deprivation of federal rights under color of state law.
- **Source:** https://www.law.cornell.edu/uscode/text/42/1983
- **Action:** no change — confirmed

### 2026-07-19 — 42 U.S.C. §1988
- **Source file:** src/App.jsx:424
- **Verdict:** VERIFIED
- **Subject:** 42 U.S.C. §1988 authorizes attorney fees in civil-rights actions.
- **Source:** https://www.law.cornell.edu/uscode/text/42/1988
- **Action:** no change — confirmed

### 2026-07-19 — Reed v. Town of Gilbert 576 U.S. 155 (2015)
- **Source file:** src/App.jsx:419
- **Verdict:** VERIFIED
- **Subject:** Reed v. Town of Gilbert holds content-based sign regulations are subject to strict scrutiny.
- **Source:** https://www.supremecourt.gov/opinions/14pdf/13-502_9olb.pdf
- **Action:** no change — confirmed

### 2026-07-19 — Village of Willowbrook v. Olech 528 U.S. 562 (2000)
- **Source file:** src/App.jsx:436
- **Verdict:** VERIFIED
- **Subject:** Village of Willowbrook v. Olech recognizes the "class-of-one" equal protection claim.
- **Source:** https://supreme.justia.com/cases/federal/us/528/562/
- **Action:** no change — confirmed

### 2026-07-19 — CA Government Code §65900
- **Source file:** src/App.jsx:337
- **Verdict:** VERIFIED
- **Subject:** California Government Code §65900 governs boards of zoning adjustment / the zoning administrator.
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65900&lawCode=GOV
- **Action:** no change — confirmed. Note: Perplexity retrieval was inconclusive on the exact section; §§65900-65904 govern zoning-adjustment boards — flag for Gate-3 spot-check.

### 2026-07-19 — CA Government Code §65901
- **Source file:** src/App.jsx:386
- **Verdict:** VERIFIED
- **Subject:** California Government Code §65901 gives zoning-adjustment boards / administrators power to hear variances and conditional use permits.
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65901&lawCode=GOV
- **Action:** no change — confirmed. Note: Perplexity retrieval was inconclusive on the exact section; §§65900-65904 govern zoning-adjustment boards — flag for Gate-3 spot-check.

### 2026-07-19 — CA Government Code §65852.25
- **Source file:** src/App.jsx:369
- **Verdict:** INCORRECT
- **Subject:** §65852.25 governs ONLY post-disaster reconstruction of multifamily dwellings (and resuming their nonconforming use after catastrophe), NOT general non-conforming use.
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.25&lawCode=GOV
- **Action:** code change — §65852.2 is the ADU statute; California has NO single non-conforming-use statute (protection = constitutional police power + common-law vested-rights doctrine + local ordinances under Gov Code §§65850-65852). Replaced the miscited enabling-act reference at src/App.jsx:369 with the vested-rights / local-ordinance framing, keeping §65852.25 in the code as a corrective clarifier.

### 2026-07-19 — §2.1
- **Source file:** src/App.jsx:118
- **Verdict:** VERIFIED
- **Subject:** non-statutory internal reference — no verification needed.
- **Source:** n/a
- **Action:** no change — confirmed

### 2026-07-19 — §4.2.3
- **Source file:** src/App.jsx:117
- **Verdict:** VERIFIED
- **Subject:** non-statutory internal reference — no verification needed.
- **Source:** n/a
- **Action:** no change — confirmed

### 2026-07-19 — CA Government Code §65900 / §65901 (caveat resolution)
- **Source file:** src/App.jsx:337 / :386
- **Verdict:** VERIFIED (Gate-3 spot-check caveat cleared)
- **Subject:** §65900 authorizes a city/county to create a board of zoning adjustment or zoning administrator by ordinance; §65901 grants that body authority to hear and decide conditional use permits and variances.
- **Source:** law.justia.com Cal. Gov. Code §§65900-65909.5; Stockton Citizens for Sensible Planning v. City of Stockton (quoting §65901(a)).
- **Action:** no code change — citations confirmed correct; earlier "retrieval inconclusive" flag resolved. Perplexity-verified 2026-07-19.

---

## State Frame Backfill — Batch 1 (AL AK AZ AR CA CO CT DE DC GA)
Retrieval date: 2026-09-09 · Method: WebSearch
(Perplexity MCP server shows Connected but its `perplexity_ask` tool is not reachable
through the session's tool interface — same as prior sessions; per directive §1.3 fell
back to WebSearch and logged. Re-add not attempted mid-session as tools are enumerated
at session start.)

Resolved: special-exception terminology + burden doctrine, state-level only (no municipality named).
- AL Special Exception · AK/AZ/DE Conditional Use · AR Conditional Use/Special Exception ·
  CA Conditional Use · CO Special Use · CT Special Permit · DC Special Exception · GA Special Use Permit.
- **Burden shift: none verified for any of the 10.** Several sources repeated the generic
  treatise line "once the applicant shows every criterion is met, the burden effectively
  shifts to opponents" — this is NOT a state-specific appellate holding, so per §5
  burden-shift skepticism it was NOT adopted. All 10 → criteria_compliance, zero citations.
- **Confirmed citations this batch: none** (zero-citation frames, which is acceptable per §0).

## State Frame Backfill — Batch 2 (HI ID IL IN IA KS KY LA ME MD)
Retrieval + verification date: 2026-09-09 · Method: WebSearch

**CONFIRMED CITATION (first verified cite in the backfill):**
- **Schultz v. Pritts, 291 Md. 1 (1981)** — Court of Appeals of Maryland (highest court).
  Verified via a separate confirmatory search: exists (VLEX, mdcourts.gov opinion, Lawpipe/
  StrongSuit briefs, and numerous Baltimore/Harford County BZA decisions applying it) AND
  stands for the proposition encoded: a special exception enjoys a presumption of validity;
  the applicant need not prove affirmative benefit; denial only on facts showing adverse
  effects "above and beyond those inherently associated with such use irrespective of
  location." → MD special_exception = prima_facie_shifting.
- All other 9 batch-2 states: terminology resolved, NO verified appellate burden shift →
  criteria_compliance, zero citations. (LA has a partial burden-favorable rule for
  non-objective standards but no clean verified appellate cite; understated to criteria_compliance.)

## State Frame Backfill — Batch 3 (MA MI MN MS MO MT NE NV NH NJ)
Retrieval date: 2026-09-09 · Method: WebSearch
- Terminology resolved for all 10. No verified appellate burden shift in any.
- Discretionary special-permit states set to applicant_carries (board may deny even if
  criteria met): MA (MGL 40A, discretionary), MO (Mo. Sup. Ct. expanded denial authority),
  MT ("matter of grace... discretion of the council"). Remaining 7 criteria_compliance.
- MN has a strong "entitled if standards met" doctrine (Minn. Stat. 462.3595/394.301) but
  no single verified appellate cite in-batch; understated to criteria_compliance, zero cites.
- Confirmed citations this batch: none.

## State Frame Backfill — Batch 4 (NM NY NC ND OH OK OR PA RI SC)
Retrieval + verification date: 2026-09-09 · Method: WebSearch

**CONFIRMED CITATIONS (verified existence + proposition):**
- **Matter of North Shore Steak House v. Board of Appeals of Inc. Vil. of Thomaston, 30 N.Y.2d 238 (1972)**
  (NY Court of Appeals) — inclusion as a special use = legislative finding of harmony; strong
  presumption favors the use; applicant's burden much lighter than a variance. → NY prima_facie_shifting.
- **Humble Oil & Refining Co. v. Board of Aldermen of Chapel Hill, 284 N.C. 458, 202 S.E.2d 129 (1974)**
  (NC Supreme Court) — prima facie entitlement on competent/material/substantial evidence; burden
  shifts to opponents; absent contrary evidence, entitled as a matter of law. → NC prima_facie_shifting.
- **Bray v. Zoning Bd. of Adjustment, 410 A.2d 909 (Pa. Commw. Ct. 1980)** — on proving the specific
  objective criteria, presumption of consistency with health/safety/welfare arises; burden shifts to
  objectors to show generally detrimental effect. → PA prima_facie_shifting.
- Other 7 (NM ND OH OK OR RI SC): criteria_compliance, zero citations. NM again showed only the generic
  "burden shifts to opponents" treatise line (no verified NM appellate cite) → understated.

## State Frame Backfill — Batch 5 (SD TN TX UT VT VA WA WV WI WY)
Retrieval date: 2026-09-09 · Method: WebSearch
- No verified appellate burden shift. VA = applicant_carries (special use permits are
  legislative/discretionary; "fairly debatable" standard). Rest criteria_compliance.
- STATUTORY applicant-favorable mandatory-grant candidates (understated to criteria_compliance
  per §5's appellate-cite requirement; logged for review): UT (Utah Code 10-9a-507 — grant
  unless city proves non-mitigable detriment), WI (Wis. Stat. 59.69(5e)/62.23(7)(de) — shall
  grant if requirements met on substantial evidence).
- Confirmed citations this batch: none.

## Backfill complete — summary
51 jurisdictions (FL + 50). Verified appellate burden shifts (prima_facie_shifting):
FL (frozen, Irvine), MD (Schultz v. Pritts), NY (North Shore Steak House), NC (Humble Oil),
PA (Bray) = 4 generated + FL. All other jurisdictions criteria_compliance or applicant_carries,
zero citations. Every shipped citation independently verified (existence + proposition).

## §8 Acceptance (live model, 2026-09-09): 20/20 GREEN across 10 sampled jurisdictions
AL CO GA IL MD NC NY PA TX WY — special_exception letters: 0 hardship terms (filled criteria);
0 fabricated criteria + placeholder present (blank criteria). Shift states (MD NC NY PA) verified.
