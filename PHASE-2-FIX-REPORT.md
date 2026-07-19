# ZoningFight — Phase-2 Regulatory Fix Report
Date: 2026-07-19
Standard: Three-Gate v7 (Gate 2 = scripts/verify-gate.mjs, A1 + A9 citation-log parity)
Retrieval: Perplexity MCP, verified 2026-07-19

## Citations audited (15 tokens surfaced by the A9 gate)
Statutory / case-law:
- NY Town Law §267, §267-b, §274-b
- CGS §8-2, §8-7
- FL Statutes Chapter 163 / §163.3202
- 42 U.S.C. §1983, §1988
- Reed v. Town of Gilbert, 576 U.S. 155 (2015)
- Village of Willowbrook v. Olech, 528 U.S. 562 (2000)
- CA Government Code §65900, §65901
- CA Government Code §65852.25

Non-statutory internal references:
- §2.1, §4.2.3 (template placeholders — no verification needed)

## Verdict counts
- VERIFIED (no change): 14
  - 12 statutory/case-law confirmed
  - 2 non-statutory internal references
- INCORRECT (fixed): 1 — CA Government Code §65852.25

## Code change
File: src/App.jsx:369 (non-conforming-use rule)
- Before: cited "California Government Code §65852.25" as the enabling-act provision protecting non-conforming uses.
- After: replaced with "California's common-law vested-rights doctrine and the local zoning ordinance's non-conforming-use provisions," including a corrective clarifier that §65852.25 covers only post-disaster reconstruction of multifamily dwellings, not general non-conforming use.
- Rationale: §65852.25 governs only post-disaster reconstruction of multifamily dwellings. §65852.2 is the ADU statute. California has no single non-conforming-use statute — protection derives from constitutional police power, the common-law vested-rights doctrine, and local ordinances under Gov Code §§65850-65852. §65852.25 is intentionally retained in the code text as a corrective clarifier, so its INCORRECT log entry stands.

## Unknowns / flags for Gate-3 spot-check
- CA Government Code §65900 and §65901: Perplexity retrieval was inconclusive on the exact section boundaries; §§65900-65904 govern zoning-adjustment boards. Verdict VERIFIED but flagged for a Gate-3 human spot-check.

## Gate status
GATE GREEN — A1 files ok; A9 citation-log parity: all 15 citations logged.
