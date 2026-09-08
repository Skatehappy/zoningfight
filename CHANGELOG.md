# ZoningFight — Changelog

All notable changes per the Consolidated CC Directive (Three-Gate Build Standard v7).
One entry per task. Build order: T1 → T3 → T2 → T4 → T5 → T7.

## [1.1.0] — 2026-09-08

### T1 — Atomic code redemption
- Added `schema.sql` (repo root, manual Supabase-SQL-editor execution): `zf_codes`
  table with `status`/`reserved_at`/`reservation_token`/`client_nonce`/`consumed_at`/
  `attempt_count`; `zf_deliveries` ledger; RLS deny-by-default; SECURITY DEFINER RPCs
  `zf_reserve_code`, `zf_commit_code`, `zf_release_code`, `zf_verify_reservation`,
  `zf_peek_code`. Idempotent, additive backfill for any pre-existing table.
- Reservation flow: validate → reserve → generate → deliver (render) → commit. Commit
  fires AFTER the letter renders. 15-minute lazy TTL reclamation, no cron.
- `src/lib/redeem.js`: per-session `client_nonce`, reserve/commit/release wrappers over
  PostgREST (anon key), smoke-test bypass. Never persists the license code.
- `api/generate.js`: removed Payhip burn-on-attempt. Now authorizes generation by a
  live reservation (server-side `zf_verify_reservation`), returns structured error
  codes, and NEVER burns a code on failure. Regenerate-once on lint failure.
- `api/checklist.js`: authorized by live reservation instead of the static ACCESS_CODES
  env list.
- Sims (Gate 1): `sim-double-spend`, `sim-failure-releases`, `sim-ttl-reclaim`,
  `sim-idempotent-retry`, `sim-commit-once` — all green against a `node:sqlite` mirror
  of the schema (staging Supabase used automatically when `SUPABASE_URL`/
  `SUPABASE_SERVICE_KEY` are set).

### T3 — Error taxonomy
- `src/lib/errors.js`: single source of truth for user-facing failure messages.
  TRANSIENT / INPUT_TOO_LONG / INPUT_INVALID / CODE_IN_USE / CODE_CONSUMED /
  CODE_INVALID. Non-definitive failures reassure the buyer the code is not used. No
  error string contains "purchase", "buy", or "checkout" (Gate B7).

### T4 — Input clarity and caps (engine)
- `src/lib/validate.js`: per-field caps (Regulation Section Numbers 200, Additional
  Information 4000, criterion 400, evidence 1200, short 200, long 1500) + total-payload
  guard (30k). Validation runs before reserve.

### T5 — Application types and state-keyed frames (data + engine)
- `frames/FL-special-exception.json` (burden-shifting, Irvine/Jesus Fellowship/Dusseau,
  7-section order, forbidden phrases, record preservation), `frames/FL-variance.json`
  (Herrera, applicant carries), `frames/GENERIC.json` (criterion-by-criterion, no
  burden shift, no authority) — FL only this pass; all else falls back to GENERIC.
- `frames/select.mjs` (pure selection, opposing postures share requesting doctrine),
  `src/lib/frames.js` (client registry), `src/lib/criteria.js` (repeating group ->
  ⟦ ⟧-marked prompt scaffold, blank placeholder), `src/lib/prompt.js` (frame-driven
  section-ordered prompt), `api/_lint.js` (forbidden-phrase + no-fabrication rails).
- `hosts/code-hosts.json`: 9 verified FL Municode LANDING pages (no constructed code
  paths); unlisted municipalities get a copyable search string, never a fabricated link.

### T7 — Model string guard
- `models.allowlist.json` + `scripts/verify-model.mjs` (allowlist check + live ping).
  Single model constant remains `api/_config.js`; SEO script now imports it (removed the
  last inline model string). Gate B8 enforces no inline model strings.

### Gates + sims
- Gate 1: `npm run verify` runs all 13 sims + the model guard (14/14 green).
- Gate 2: `scripts/gate2.mjs` B1–B12 (12/12 green); `.githooks/pre-commit` + CI workflow
  share it. B2 uses Node 22 `node:sqlite`.
