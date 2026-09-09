
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
