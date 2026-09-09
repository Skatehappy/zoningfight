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

---

## TIER 2 — Understated Candidates (findings only; §6 governs disposition)

Current state for all seven: special_exception = `criteria_compliance`, variance = `applicant_carries`,
zero citations. Question asked: what is the actual state standard, and is it stronger than current?
Per §5, "Perplexity suggests a shift" on a `criteria_compliance` frame → **keep as-is, log as §6 candidate,
do not promote.** No Tier-2 frame was edited.

### UT — statutory mandatory-grant (STRONGER than current)
Utah Code §10-9a-507(2) (county analog §17-27a-506): a land use authority **"shall approve a conditional
use if reasonable conditions are proposed, or can be imposed, to mitigate the reasonably anticipated
detrimental effects"**; denial only if effects **"cannot be substantially mitigated."** This is a statutory
entitlement, not discretionary. Perplexity found **no** Utah appellate case expressly allocating the
applicant/authority evidentiary burden. → **§6 candidate (STATUTORY).** Keep `criteria_compliance`.

### WI — statutory mandatory-grant + substantial-evidence-to-deny (STRONGER)
2017 Wis. Act 67, Wis. Stat. §59.69(5e) (counties) / §62.23(7)(de) (cities): if the applicant demonstrates
by **substantial evidence** that the application meets the ordinance's requirements, the municipality
**"shall grant"** the CUP; a denial must itself rest on substantial evidence identifying an unmet
requirement. *Enbridge Energy Co. v. Dane County* applies the framework (Perplexity flagged the exact
reporter cite as needing confirmation before any filing). → **§6 candidate (STATUTORY, + appellate pending
cite verification).** Keep `criteria_compliance`.

### CT — limited-discretion entitlement, NOT a burden shift
*Irwin v. Planning & Zoning Comm'n*, 244 Conn. 619, 626–28 (1998): the commission has discretion to
determine whether the regulation's standards are met, but **once it determines they are met it "lacks
discretion to deny."** *St. Joseph High School v. P&Z Comm'n*, 302 Conn. 288 (2011) applies the same.
Perplexity: this is **"not a formal burden shift to opponents"** — applicant bears the initial burden; the
commission's discretion is merely *exhausted* once compliance is shown. → **§6 candidate for a possible
"limited-discretion entitlement" category (design decision, not a shift). Appellate authority exists
(Irwin).** Keep `criteria_compliance`. (Consistent with backfill D-SFB-3.)

### DC — limited-discretion entitlement, NOT a burden shift
*Stewart v. D.C. Bd. of Zoning Adjustment*, 305 A.2d 516, 518 (D.C. 1973): applicant bears the burden of
proving compliance; once shown, the BZA's discretion is limited to whether the specified conditions are met
and it **"ordinarily must grant"** the exception. *First Baptist Church v. BZA*, 432 A.2d 695 (D.C. 1981);
*Gladden v. BZA*, 659 A.2d 249 (D.C. 1995). Perplexity: **not** a burden shift; applicant retains the
initial burden. → **§6 candidate for the same "entitlement" category. Appellate authority exists (Stewart).**
Keep `criteria_compliance`. (Consistent with backfill D-SFB-3.)

### MN — confirmed correctly classified (no shift)
Minn. Stat. §462.3595, subd. 1: **applicant bears the initial burden** to show the CUP standards are met.
*RDNT, LLC v. City of Bloomington*, 861 N.W.2d 71 (Minn. 2015); *C.R. Investments v. Village of Shoreview*,
304 N.W.2d 320 (Minn. 1981): a denial must be **legally sufficient and have a factual basis in the record.**
Perplexity **expressly rejects** the notion that a CUP "must be granted unless the municipality proves
noncompliance." A CUP applicant is in a stronger position than a variance applicant, but that is exactly what
`criteria_compliance` (SE) vs `applicant_carries` (variance) already encodes. → **Not a promotion candidate.**
Classification confirmed.

### NM — confirmed correctly classified (no shift)
Applicant bears the **burden of persuasion** on the elements for issuance; whole-record review is a
*judicial-review* standard, not a burden shift. **No** NM statute or published Supreme Court/Court of Appeals
case establishes an applicant→opponent shift (NMSA 1978 §3-21-1 has no such rule; *Albuquerque Commons
P'ship v. City Council*, 2008-NMSC-025 distinguishes map-changes from special-use permits). → **Not a
promotion candidate.** SE `criteria_compliance` / variance `applicant_carries` confirmed.

### LA — confirmed correctly classified (no shift)
No burden shift. Zoning decisions carry a **presumption of validity**; the **challenger** bears the burden on
judicial review (arbitrary-and-capricious / substantial-evidence). Special-use permits get the same review
as other zoning enactments. **No** Louisiana Supreme Court / Court of Appeal case establishes a statewide
special-exception burden shift. → **Not a promotion candidate.** Classification confirmed.

**Tier 2 result: 0 downgrades. 4 §6 candidates (UT, WI statutory; CT, DC entitlement-not-shift). 3 confirmed
correct (MN, NM, LA). No promotions this pass.**

---

## TIER 3 — Burden Classification of the Remaining Frames (§3 Tier 3, §7 batches of ten)

These frames carry **no citations**; the risk is misclassification, not fabrication. Method: one state-level
`perplexity_ask` per state (no municipality named), asking whether proof of compliance with the ordinance's
standards *entitles* the applicant (→ `criteria_compliance`) or the board keeps *broad discretion* to deny a
compliant application (→ `applicant_carries`), and whether any appellate **burden shift** exists (→ §6
candidate, never promoted). Variance = `applicant_carries` (hardship) confirmed alongside.

**Structural note (materiality):** for `special_exception` frames, `criteria_compliance` and
`applicant_carries` generate the **identical** letter — both instruct "the applicant carries the burden
throughout; make NO burden-shift assertion." Only `prima_facie_shifting` adds a burden-allocation section +
citations. A Tier-3 downgrade is therefore a pure *classification* correction (understate-safe) with no change
to letter output. Every re-verified frame is stamped `verified_via: "WebSearch, Perplexity"`.

### Batch A — AK AL AR AZ CA CO DE GA HI IA (2026-09-09)

| State | Prior SE | Perplexity finding | Action |
|---|---|---|---|
| AK | criteria_compliance | Appellate **burden shift** — *Griswold v. Homer Advisory Planning Comm'n* (applicant proves criteria → burden shifts to opponents). | **Keep** criteria_compliance; **§6 candidate** (appellate, needs 3-question verify). Letter asserts no shift, so no overstatement. |
| AL | criteria_compliance | Limited, standards-based discretion; no clear burden-shift doctrine. | **Keep** — confirmed. |
| AR | criteria_compliance | **Broad discretion**; compliance does not entitle; PPX labels SE `applicant_carries`. | **Downgrade → applicant_carries** (§0/§5). |
| AZ | criteria_compliance | Criteria-bound discretion; PPX labels `criteria_compliance`; no shift. | **Keep** — confirmed. |
| CA | criteria_compliance | CUP is a **broad-discretion** approval (findings + substantial evidence, *Topanga*); no general shift. | **Downgrade → applicant_carries**. |
| CO | criteria_compliance | `criteria_compliance` (qualified); discretion limited by ordinance; no zoning shift. | **Keep** — confirmed. |
| DE | criteria_compliance | criteria_compliance; a possible post-compliance shift, but PPX **could not name the controlling case** with confidence. | **Keep**; noted as **unverified** shift (not a solid §6 candidate). |
| GA | criteria_compliance | **Not** a categorical "compliant → must approve" state; many special-use decisions treated as **legislative/broad discretion**. | **Downgrade → applicant_carries** (understate). |
| HI | criteria_compliance | Agency **retains broad discretion** to deny; compliance does not clearly entitle. | **Downgrade → applicant_carries**. |
| IA | criteria_compliance | Limited standards-based discretion (Iowa Code §414.12 / §335); no verified shift. | **Keep** — confirmed. |

All ten variances confirmed `applicant_carries`. **Batch A: 4 downgrades (AR CA GA HI), 6 confirmed, 1 §6
candidate (AK), 1 unverified-shift note (DE).**

### Batch B — ID IL IN KS KY MA ME MI MO MS (2026-09-09)

| State | Prior SE | Perplexity finding | Action |
|---|---|---|---|
| ID | criteria_compliance | Standards-based discretion (Idaho Code §67-6512 / LLUPA); no broad policy discretion; no shift. | **Keep** — confirmed. |
| IL | criteria_compliance | Special use may be denied despite compliance on LaSalle/Sinclair location-specific effects; **broad residual discretion**. | **Downgrade → applicant_carries** (§5 ambiguous→understate). |
| IN | criteria_compliance | Special exception is a permitted use; **approval mandatory once criteria met** (limited discretion); opponents need not disprove. Stronger, but not a shift. | **Keep** criteria_compliance; entitlement-flavored §6-adjacent note. |
| KS | criteria_compliance | **Broad discretion**; Golden factors, presumption of reasonableness, challenger's burden; no entitlement from compliance. | **Downgrade → applicant_carries**. |
| KY | criteria_compliance | Limited standards-based discretion (KRS 100.237); no broad veto; no shift. | **Keep** — confirmed. |
| MA | applicant_carries | Special permit is **discretionary**, not automatic; applicant carries throughout; no shift. | **Keep** applicant_carries — confirmed. |
| ME | criteria_compliance | "Strict compliance with the ordinance" standards (30-A §4353); standards-based, not broad discretion; no shift. | **Keep** — confirmed. |
| MI | criteria_compliance | Special land use is **discretionary** (MCL 125.3502 "deny, approve, or approve with conditions"); compliance ≠ compelled approval. | **Downgrade → applicant_carries**. |
| MO | applicant_carries | Applicant carries initial and ultimate burden; compliance limits but doesn't compel; no shift. | **Keep** applicant_carries — confirmed. |
| MS | criteria_compliance | Applicant proves by preponderance; **compliance does not entitle**; body may deny on substantial evidence. | **Downgrade → applicant_carries**. |

Variances all confirmed `applicant_carries`. **Batch B: 4 downgrades (IL KS MI MS), 4 confirmed CC (ID IN KY
ME), 2 confirmed AC (MA MO). IN noted as entitlement-flavored (§6-adjacent).**
