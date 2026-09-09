
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
