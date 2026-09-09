
## State Frame Backfill (branch: state-frame-backfill)

### Batch 1 — AL AK AZ AR CA CO CT DE DC GA (2026-09-09)
- Infrastructure: scripts/frame-templates.mjs (agnostic section templates + generator),
  scripts/gen-frames.mjs, scripts/verify-frames.mjs (§5/§8 gate, `npm run verify`),
  scripts/coverage-report.mjs, scripts/state-data.mjs.
- src/lib/frames.js now bundles ALL frames via static Vite glob (no runtime resolution).
- 20 frames written (10 special_exception + 10 variance), all criteria_compliance /
  applicant_carries, zero citations, no burden shift. Gate GREEN; FL frozen (byte-identical
  to 1cd2287); vite build OK.

### Batch 2 — HI ID IL IN IA KS KY LA ME MD (2026-09-09)
- 20 frames. MD special_exception = prima_facie_shifting (Schultz v. Pritts, 291 Md. 1
  (1981), verified). All others criteria_compliance/applicant_carries, zero citations.
- Shift template made state-neutral (no FL-specific both_prongs section). Gate green, build OK.

### Batch 3 — MA MI MN MS MO MT NE NV NH NJ (2026-09-09)
- 20 frames, zero citations, no burden shift. Discretionary states (MA MO MT) =
  applicant_carries; rest criteria_compliance. Gate green.

### Batch 4 — NM NY NC ND OH OK OR PA RI SC (2026-09-09)
- 20 frames. Three verified burden shifts: NY (North Shore Steak House), NC (Humble Oil),
  PA (Bray). Other 7 criteria_compliance, zero cites. Gate green.

### Batch 5 — SD TN TX UT VT VA WA WV WI WY (2026-09-09)
- 20 frames. VA = applicant_carries (legislative/discretionary); rest criteria_compliance.
  UT/WI statutory-shift candidates understated. Gate green, build OK.

### Backfill complete: 100 new state frames (50 jurisdictions x 2), FL frozen.
- 4 verified burden shifts added (MD, NY, NC, PA). All others criteria_compliance/
  applicant_carries, zero citations. Branch: state-frame-backfill. Not pushed (Rob Gate 3).

### Acceptance + regression (2026-09-09)
- §8 sampled acceptance: 20/20 green (10 jurisdictions incl. all shift states) — 0 hardship
  terms, 0 fabricated criteria. §9 regression: bogus->401, legacy->200, FL frozen. DONE for
  Rob's Gate 3 review (branch state-frame-backfill, unpushed).

## Perplexity Re-Verification (branch: state-frame-backfill)

### Tier 1 — MD NY NC PA burden shifts (2026-09-09)
- Independent second-source re-verification via Perplexity MCP (Sonar Pro). All four burden-shift citations
  confirmed on existence, proposition, and good-law status. Zero downgrades.
- Frame changes: `verified_via` on MD/NY/NC/PA special-exception frames updated "WebSearch" ->
  "WebSearch, Perplexity". No burden, citation, or proposition changes.
- FL (frozen) Irvine/Jesus Fellowship/Dusseau verified for the record; frames unchanged (byte-identical to
  1cd2287).
- Reports: _reports/PERPLEXITY-REVERIFICATION.md, _reports/PROMOTION-CANDIDATES.md (scaffold).

### Tier 2 — understated candidates UT WI MN CT DC NM LA (2026-09-09)
- Verified actual state standard for each via Perplexity. 0 downgrades, 0 promotions, no frame edits.
- UT/WI (statutory mandatory-grant) and CT/DC (limited-discretion entitlement) logged as §6 promotion
  candidates. MN/NM/LA classifications re-confirmed. See _reports/PROMOTION-CANDIDATES.md.

### Tier 3 Batch A — AK AL AR AZ CA CO DE GA HI IA (2026-09-09)
- SE downgrades criteria_compliance -> applicant_carries: AR, CA, GA, HI (broad-discretion states;
  label-only, letter output unchanged). AL/AZ/CO/DE/IA confirmed. AK -> §6 candidate (Griswold).
- All 20 frames stamped verified_via "WebSearch, Perplexity".

### Tier 3 Batch B — ID IL IN KS KY MA ME MI MO MS (2026-09-09)
- SE downgrades CC->AC: IL, KS, MI, MS. Confirmed CC: ID, IN, KY, ME. Confirmed AC: MA, MO.
  IN entitlement-flavored (§6-adjacent). 20 frames stamped verified_via "WebSearch, Perplexity".

### Tier 3 Batch C — MT ND NE NH NJ NV OH OK OR RI (2026-09-09)
- SE downgrades CC->AC: ND, NE, NV. Confirmed CC: NH, NJ, OH, OK, OR, RI. Confirmed AC: MT.
  NH/OH entitlement-flavored (§6-adjacent). 20 frames stamped.
