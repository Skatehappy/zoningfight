# ZoningFight — Consolidated Directive Report

**Date:** 2026-09-08 · **Version:** 1.1.0 · **Standard:** Three-Gate v7
**Status:** code-complete, **HALTED for Gate 3 (Rob).** CC does not declare this shipped.

Build order executed: **T1 → T3 → T2 → T4 → T5 → T7**, then gates. T6 (burned-code
audit) cut per directive — one sale to date, handle by hand.

---

## What changed

### T1 — Atomic code redemption *(the core fix)*
Codes were consumed on the generation *attempt* (Payhip usage marked mid-flow), so a
failed generation destroyed a paid code. Replaced with a Supabase reservation ledger:

- `schema.sql` (repo root, run manually in the Supabase SQL editor): `zf_codes`
  (`status`/`reserved_at`/`reservation_token`/`client_nonce`/`consumed_at`/
  `attempt_count`), `zf_deliveries`, RLS deny-by-default, and SECURITY DEFINER RPCs
  `zf_reserve_code`, `zf_commit_code`, `zf_release_code`, `zf_verify_reservation`,
  `zf_peek_code`. Idempotent + additive backfill (never drops).
- Flow: **validate → reserve → generate → deliver (render) → commit.** Commit fires
  after the letter renders. 15-minute lazy TTL reclamation, **no cron**.
- `src/lib/redeem.js` (per-session nonce, reserve/commit/release) + `App.jsx` wiring.
  `api/generate.js` now authorizes by a live reservation and **never burns a code** on
  failure; Payhip removed from the UI path.

### T3 — Error taxonomy
`src/lib/errors.js`: TRANSIENT / INPUT_TOO_LONG / INPUT_INVALID / CODE_IN_USE /
CODE_CONSUMED / CODE_INVALID. Non-definitive failures explicitly say **"your code has not
been used."** No error string contains *purchase*, *buy*, or *checkout* (Gate B7).

### T2 — Draft persistence
Debounced (500ms) autosave to `localStorage` `zf_draft_v1`; restore banner with
**Discard draft**; cleared only after a successful commit; 256KB cap. **The license code
is never persisted** (Gate B9).

### T4 — Input clarity + caps
"Specific Numbers" → **Regulation Section Numbers** (`e.g., Section 4.2.1; Article VI`);
added **Additional Information** (4000). Visible counters + hard caps on every free-text
field; total-payload guard (30k). All validation runs **before** reserve.

### T5 — Application types + state-keyed frames
- Five types incl. restored **Other**. Pre-selection disclosure (variance vs special
  exception, once per session). Required, no-default **Deciding Body** field.
- **Core constraint:** the app supplies NO ordinance criteria. User enters them in the
  1–8-row **Criteria From Your Ordinance** group; each row → a numbered argument section
  in order; blank evidence → bracketed placeholder, never fabricated.
- Frame registry (`frames/`): FL special-exception (Irvine burden shift), FL variance
  (Herrera), GENERIC (criterion-by-criterion, no burden shift). Everything non-FL →
  GENERIC, logged to DECISIONS as backfill queue.
- Guided retrieval: 9 verified FL Municode **landing** links (no constructed code
  paths); unlisted municipalities get a copyable search string, never a fabricated link.
- Two HARD lints in `api/_lint.js`: forbidden-phrase (hardship language for special
  exceptions) and no-fabrication (every ⟦ ⟧-marked criterion must match user input).
  On hit: regenerate once, then fail TRANSIENT with the code released.

### T7 — Model string guard
`models.allowlist.json` + `scripts/verify-model.mjs`. Single model constant stays
`api/_config.js`; the SEO script now imports it (last inline model string removed). Gate
B8 enforces no inline model strings anywhere else.

---

## What was verified

- **Gate 1** (`npm run verify`): 13 sims + model guard — **14/14 green.**
  double-spend (1 success / 19 CODE_IN_USE), failure-releases, ttl-reclaim,
  idempotent-retry, commit-once, hardship-lint (all 5 phrases), no-fabrication,
  criteria-blank, frame-selection (FL→FL, WY→GENERIC), fl-sections, generic-no-burden-
  shift, input-caps (zero reservations on invalid), host-urls (all 9 resolve 200).
- **Gate 2** (`scripts/gate2.mjs`): **B1–B12 12/12 green.** Pre-commit hook + CI share it.
- `vite build`: clean (62 modules).
- Redemption sims run against a `node:sqlite` mirror of `schema.sql` when no Supabase
  creds are present; they auto-target staging Supabase when `SUPABASE_URL`/
  `SUPABASE_SERVICE_KEY` are set (logged, never skipped — DECISIONS D2).
- Florida citations verified via WebSearch (Perplexity MCP connected but its tools were
  not reachable in-session; fell back per §1 and logged): **Irvine 495 So. 2d 167**,
  **Jesus Fellowship 752 So. 2d 708**, **Dusseau 794 So. 2d 1270**, **Herrera 600 So. 2d
  561** — all real, none dropped. See `VERIFICATION_LOG.md`.

---

## What remains (Gate 3 — Rob)

1. **Provision Supabase** and run `schema.sql`; set env from `.env.example` (Vercel +
   local). Until then the app is code-complete but cannot generate real letters
   (failures are TRANSIENT — no code is ever burned).
2. **Seed `zf_codes`**, including the ONE existing Payhip customer's code (tiebreaker:
   preserve the customer's license code).
3. Run `npm run verify` with staging creds set to exercise the RPCs on real Postgres.
4. Human smoke on real data + the integrity check. CC has not declared done/shipped.

### Known follow-ups (logged, NOT executed here)
- **GENERIC backfill queue** (DECISIONS): only FL is verified. Other states fall back to
  GENERIC (safe: no burden-shift assertion) until per-state frames are verified.
- **T7 replication** to TenantFight, FightMyHOA, ClaimFighter, TaxFightLetter — pending
  per directive; deliberately not scoped into this pass.
- Commit granularity: shipped in 6 commits; App.jsx UI slices for T1/T2/T4/T5 landed
  together (single shared file). Every task is individually logged + gated. (DECISIONS D11.)
