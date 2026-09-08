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

## T5 — Florida special-exception controlling authority (Consolidated Directive)
Retrieval date: 2026-09-08
Method: WebSearch (Perplexity MCP server connected but its tools were not exposed
to the session's tool interface; per directive §1 step 3, fell back to WebSearch
and logged. Not a block.)

### Irvine v. Duval County Planning Commission, 495 So. 2d 167 (Fla. 1986)
- **Verdict:** VERIFIED — real, citation and year correct.
- **Proposition confirmed:** Once the applicant meets the initial burden of showing
  the application satisfies the criteria for the special exception, the burden shifts
  to the commission to show, by competent substantial evidence in the record, that the
  application fails those standards and is adverse to the public interest.
- **Sources:** law.justia.com/cases/florida/supreme-court/1986/67092-0.html ;
  courtlistener.com/opinion/1929909/irvine-v-duval-county-planning-commission/
- **Action:** SHIP in frames/FL-special-exception.json (burden allocation section).

### Jesus Fellowship, Inc. v. Miami-Dade County, 752 So. 2d 708 (Fla. 3d DCA 2000)
- **Verdict:** VERIFIED — real, citation and year correct.
- **Proposition confirmed:** Once the applicant makes the required showing, the
  application must be granted unless the opposition carries its burden of showing the
  standards are not met and the proposal is adverse to the public interest.
- **Source:** caselaw.findlaw.com/court/fl-district-court-of-appeal/1200847.html
- **Action:** SHIP as supporting authority (both-prongs section).

### Dusseau v. Metropolitan Dade County Bd. of County Commissioners, 794 So. 2d 1270 (Fla. 2001)
- **Verdict:** VERIFIED — real, citation and year correct (decided May 17, 2001).
- **Proposition confirmed:** Quasi-judicial special-exception decisions are reviewed on
  the record by certiorari, with deference to the agency's findings; a court cannot
  reweigh evidence. Supports the record-preservation section (a denial unsupported by
  record evidence is the applicant's remedy).
- **Sources:** leagle.com/decision/20012064794so2d127011951 ;
  law.justia.com/cases/florida/supreme-court/2001/sc95217.html
- **Action:** SHIP as supporting authority (record-preservation section).

**Dropped citations:** none — all three verified.
