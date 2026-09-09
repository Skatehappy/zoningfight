# ZoningFight — Perplexity Re-Verification of State Frames

**Branch:** `state-frame-backfill`
**Date:** 2026-09-09
**Method:** Perplexity MCP (`perplexity_ask`, Sonar Pro), `search_context_size: high`
**Purpose:** Independent second-source re-verification of the 100 state frames produced in the
backfill, which ran entirely on WebSearch fallback (see DECISIONS D-SFB-1). Verification only.
**Governing tiebreaker (§0):** understate rather than overstate; disagreement downgrades, never upgrades.

Per jurisdiction: prior burden → Perplexity finding → action → source. Tier 1 first.

---

## TIER 1 — The Four Burden Shifts (the entire affirmative-claim risk surface)

Each citation put to three separate `perplexity_ask` calls: (1) does the citation exist and is the
reporter cite correct; (2) does it stand for the frame's proposition; (3) is it still good law.

### MD — `MD-special-exception.json` · burden `prima_facie_shifting`
**Cite:** *Schultz v. Pritts*, 291 Md. 1 (1981)
- **Q1 Exists / cite correct:** ✅ Confirmed. Parallel cite *291 Md. 1, 432 A.2d 1319 (1981)*.
- **Q2 Proposition:** ✅ Confirmed (substantially correct). Special-exception use carries a presumption
  of general welfare/validity; applicant need not prove affirmative benefit; denial requires facts
  showing adverse effects **above and beyond** those inherent in the use irrespective of location.
  Qualification: applicant still bears the burden of proving compliance with the ordinance's specific
  requirements — "denied only" is subject to that. The frame's `burden_allocation` instruction already
  hedges ("state the shift only as far as that verified authority supports; do not overstate it"), so the
  qualification is already honored.
- **Q3 Good law:** ✅ Confirmed. Not overruled. Clarified (not rejected) by *People's Counsel for
  Baltimore County v. Loyola College in Maryland*, 406 Md. 54, 956 A.2d 166 (2008): no comparative-site
  proof required; Schultz framework reaffirmed as controlling.
- **Action:** **KEEP** `prima_facie_shifting`. Logged double-verified (WebSearch + Perplexity).

### NY — `NY-special-exception.json` · burden `prima_facie_shifting`
**Cite:** *Matter of North Shore Steak House v. Board of Appeals of Inc. Vil. of Thomaston*, 30 N.Y.2d 238 (1972)
- **Q1 Exists / cite correct:** ✅ Confirmed. Official caption *In the Matter of North Shore Steak House,
  Inc. v. Board of Appeals of the Incorporated Village of Thomaston*, 30 N.Y.2d 238 (1972).
- **Q2 Proposition:** ✅ Confirmed (substantially correct). Inclusion of the use as a permitted special
  exception is "tantamount to a legislative finding" of harmony with the zoning plan; applicant's burden is
  materially lighter than for a variance. Qualification: not an unqualified presumption requiring approval —
  applicant must satisfy the ordinance's conditions; board may deny on substantial evidence. Frame's hedged
  language honors this.
- **Q3 Good law:** ✅ Confirmed. Reaffirmed by *Matter of Retail Property Trust v. Board of Zoning Appeals
  of Town of Hempstead*, 98 N.Y.2d 190 (2002) and *Matter of Twin County Recycling Corp. v. Yevoli*,
  90 N.Y.2d 1000 (1997). Not overruled or superseded.
- **Action:** **KEEP** `prima_facie_shifting`. Logged double-verified.

### NC — `NC-special-exception.json` · burden `prima_facie_shifting`
**Cite:** *Humble Oil & Refining Co. v. Board of Aldermen of Chapel Hill*, 284 N.C. 458, 202 S.E.2d 129 (1974)
- **Q1 Exists / cite correct:** ✅ Confirmed. Both parallel reporter cites correct (284 N.C. 458,
  202 S.E.2d 129 (1974)).
- **Q2 Proposition:** ✅ Confirmed (substantially correct). Applicant's competent/material/substantial
  evidence of the ordinance-required facts establishes a **prima facie** entitlement; burden of production
  shifts to opponents; denial must rest on contrary competent evidence. Qualification: it is a burden of
  **production**, not automatic ultimate persuasion — applicant must make the prima facie showing on **each**
  required criterion. Frame does not overstate.
- **Q3 Good law:** ✅ Confirmed. Reaffirmed by *SBA Communications Corp. v. Asheville City Council*, 366 N.C.
  86, 729 S.E.2d 206 (2012). N.C. Gen. Stat. §160D-705(c) **recodifies/modernizes** the SUP framework but does
  **not** displace Humble Oil.
- **Action:** **KEEP** `prima_facie_shifting`. Logged double-verified.

### PA — `PA-special-exception.json` · burden `prima_facie_shifting`
**Cite:** *Bray v. Zoning Bd. of Adjustment*, 410 A.2d 909 (Pa. Commw. Ct. 1980)
- **Q1 Exists / cite correct:** ✅ Confirmed. Full cite *48 Pa. Commw. 523, 410 A.2d 909 (1980)*, decided
  Jan. 17, 1980. Abbreviated form as written is valid.
- **Q2 Proposition:** ✅ Confirmed (substantially correct). On proving compliance with the ordinance's
  specific objective criteria, a presumption of consistency with health/safety/welfare arises and objectors
  must show a generally detrimental effect. Qualification: distinguish **burden of persuasion** from **duty to
  come forward with evidence**; applicant retains persuasion on the specific objective criteria. Frame honors
  this.
- **Q3 Good law:** ✅ Confirmed. Reaffirmed by *Siya Real Estate LLC v. Allentown ZHB*, 210 A.3d 1152
  (Pa. Commw. 2019) and later Commonwealth Court decisions. Narrowed/clarified, **not** overruled.
- **Action:** **KEEP** `prima_facie_shifting`. Logged double-verified.

**Tier 1 result: 4/4 confirmed on all three questions. Zero downgrades.** All four frames now carry
`verified_via: "WebSearch, Perplexity"`. Each retains a single citation confirmed by both sources as good law
(§8.1 satisfied).

---

## FLORIDA — FROZEN (§2): verify and report only; no edits

FL frames shipped in `1cd2287` and passed prod acceptance. Verified via Perplexity; **not modified.**
If any had failed it would be reported as a production decision, not edited. All three confirmed:

### `FL-special-exception.json` (burden `prima_facie_shifting`, 3 cites)
- ***Irvine v. Duval Cnty. Planning Comm'n*, 495 So. 2d 167 (Fla. 1986)** — ✅ exists; ✅ proposition
  (burden shifts to the board/opponent to show by competent substantial evidence the standards are unmet and
  the proposal adverse to the public interest); ✅ good law, reaffirmed *Broward County v. International, Ltd.*,
  787 So. 2d 838 (Fla. 2001). Minor note: the opposing party is not always the commission specifically — may
  be any party opposing. Frame text unaffected.
- ***Jesus Fellowship, Inc. v. Miami-Dade County*, 752 So. 2d 708 (Fla. 3d DCA 2000)** — ✅ exists; ✅
  proposition (grant required unless opposition proves BOTH standards unmet AND adverse to public interest);
  ✅ still 3d DCA precedent, applied through *Miami-Dade County v. Publix Supermarkets* (2020). Note: it is a
  burden-shift conditioned on the applicant's initial showing (not automatic entitlement), and *First Baptist
  Church of Perrine v. Miami-Dade County*, 768 So. 2d 1114 (Fla. 3d DCA 2000) distinguishes it where the
  applicant fails the initial showing. Frame's `both_prongs` section already frames it correctly.
- ***Dusseau v. Metro. Dade Cnty. Bd. of Cnty. Comm'rs*, 794 So. 2d 1270 (Fla. 2001)** — ✅ exists; ✅
  proposition (quasi-judicial review by certiorari, competent-substantial-evidence, no reweighing); ✅ good law.
- **Action:** none. FL byte-identical to `1cd2287` (verify gate enforces).

### `FL-variance.json` (burden `applicant_carries`, 1 cite)
- ***Herrera v. City of Miami*, 600 So. 2d 561 (Fla. 3d DCA 1992)** — carried forward from the frozen commit;
  applicant-carries hardship doctrine, not a burden shift. Not separately re-queried this pass (FL frozen;
  no affirmative burden-shift claim to re-verify). Frame unaffected.
