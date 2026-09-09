# ZoningFight — Promotion Candidates (REPORT ONLY, §6)

**Branch:** `state-frame-backfill` · **Date:** 2026-09-09 · **Method:** Perplexity MCP `perplexity_ask`

Frames Perplexity indicates *could* be stronger than their current burden classification. **None are
promoted in this pass** (§3/§5/§6: upgrades never apply automatically). Promotion requires an appellate
citation surviving all three §3 questions **plus Rob's approval**. Statutory mandatory-grant language
(e.g., UT, WI) is a real basis but a *different argument structure* than a case-law burden shift and may
warrant its own burden category — a design decision for Rob, not a verification finding.

Per candidate: jurisdiction · current burden · proposed burden · supporting authority · authority type
(appellate / statutory).

---

## From Tier 2

### UT — Utah (statutory mandatory-grant)
- **Frame:** `UT-special-exception.json`
- **Current burden:** `criteria_compliance`
- **Proposed burden:** a *statutory mandatory-grant* standard — likely its **own burden category**, not
  `prima_facie_shifting`. §6: statutory mandatory-grant is a different argument structure than a case-law
  burden shift.
- **Supporting authority:** Utah Code **§10-9a-507(2)** (municipal) / **§17-27a-506** (county): authority
  **"shall approve"** a conditional use if reasonable conditions can substantially mitigate reasonably
  anticipated detrimental effects; denial only if effects "cannot be substantially mitigated."
- **Authority type:** **STATUTORY.** No Utah appellate case expressly allocating the evidentiary burden was
  found. A case-law burden shift is therefore **not** available; promotion, if any, would be a new
  "statutory mandatory-grant" frame type — a design decision for Rob.

### WI — Wisconsin (statutory mandatory-grant + substantial-evidence-to-deny)
- **Frame:** `WI-special-exception.json`
- **Current burden:** `criteria_compliance`
- **Proposed burden:** statutory mandatory-grant with a substantial-evidence constraint on denial — again
  likely its **own category** rather than `prima_facie_shifting`.
- **Supporting authority:** 2017 Wis. Act 67 — **Wis. Stat. §59.69(5e)** (counties) / **§62.23(7)(de)**
  (cities): if the applicant shows by **substantial evidence** the application meets the ordinance's
  requirements, the municipality **"shall grant"** the CUP; denial must rest on substantial evidence.
- **Authority type:** **STATUTORY** (primary) + **appellate** *Enbridge Energy Co. v. Dane County* applying
  it — **exact reporter cite NOT yet verified**; must survive all three §3 questions before any promotion.

### CT — Connecticut (limited-discretion entitlement — NOT a burden shift)
- **Frame:** `CT-special-exception.json`
- **Current burden:** `criteria_compliance`
- **Proposed burden:** possible **"limited-discretion entitlement"** category — explicitly **not** a burden
  shift to opponents (applicant retains the initial burden; the commission's discretion is merely exhausted
  once compliance is shown).
- **Supporting authority:** *Irwin v. Planning & Zoning Comm'n*, **244 Conn. 619, 626–28 (1998)**;
  *St. Joseph High School v. P&Z Comm'n*, 302 Conn. 288 (2011).
- **Authority type:** **APPELLATE** (state supreme court). Fits an "entitlement" category, not
  `prima_facie_shifting`. Design decision for Rob.

### DC — District of Columbia (limited-discretion entitlement — NOT a burden shift)
- **Frame:** `DC-special-exception.json`
- **Current burden:** `criteria_compliance`
- **Proposed burden:** same **"limited-discretion entitlement"** category as CT — not a burden shift.
- **Supporting authority:** *Stewart v. D.C. Bd. of Zoning Adjustment*, **305 A.2d 516, 518 (D.C. 1973)**;
  *First Baptist Church v. BZA*, 432 A.2d 695 (D.C. 1981); *Gladden v. BZA*, 659 A.2d 249 (D.C. 1995).
- **Authority type:** **APPELLATE** (D.C. Court of Appeals). Entitlement category, not
  `prima_facie_shifting`. Design decision for Rob.

---

## Not candidates (confirmed correctly classified in Tier 2)

- **MN** — applicant bears the initial burden (Minn. Stat. §462.3595); denial needs legal sufficiency +
  factual basis (*RDNT*, 861 N.W.2d 71 (Minn. 2015); *C.R. Investments*, 304 N.W.2d 320 (Minn. 1981)).
  Perplexity expressly rejects a "must-grant-unless-municipality-disproves" reading. `criteria_compliance`
  correct.
- **NM** — applicant bears the burden of persuasion; whole-record review is judicial, not a shift; no statute
  or case establishes a shift (NMSA 1978 §3-21-1; *Albuquerque Commons*, 2008-NMSC-025). Correct.
- **LA** — presumption of validity; challenger bears the burden on judicial review; no statewide
  special-exception burden shift. Correct.

---

## Design note for Rob (§6)

The four Tier-2 candidates split into two kinds, **neither of which is a Florida-style case-law burden
shift**:
1. **Statutory mandatory-grant** (UT, WI): the statute says the authority *shall* approve a compliant
   application. Real leverage, but its argument structure is "the statute compels grant," not "the
   presumption shifts the burden to objectors." Likely warrants a distinct `statutory_mandatory_grant`
   burden type with its own section template (cite the statute, not a case).
2. **Limited-discretion entitlement** (CT, DC): appellate doctrine that once compliance is shown the board
   *lacks discretion to deny*. Also not a burden shift; the applicant keeps the initial burden. Could share
   the same new category or a sibling `limited_discretion_entitlement` type.

Adopting either category is a **schema design decision**, plus Rob's approval, plus (for WI) verifying the
*Enbridge* reporter cite through all three §3 questions. **Nothing is promoted in this pass.**
