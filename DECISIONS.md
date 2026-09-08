# ZoningFight — Decisions Log

Every log-and-continue decision under the Consolidated CC Directive. Governing
tiebreaker (§0): preserve the customer's license code and the customer's typed input.

## 2026-09-08

### D1 — Redemption backend is Supabase; the live app currently uses Payhip
The directive's T1 specifies a Supabase codes table + atomic RPCs, but the live
ZoningFight app has NO Supabase and redeems via the Payhip license API (verify +
usage-mark). No Supabase project is wired in-repo. Decision: build T1 exactly as
specified (Supabase `schema.sql` + RPCs as the production deliverable) and remove the
Payhip burn-on-attempt from `api/generate.js`. Codes are seeded into `zf_codes`. The
single existing Payhip customer's code must be seeded by hand (tiebreaker: preserve the
customer's license code) — documented in `schema.sql` and the report. Release is gated
by Rob (Gate 3) who provisions Supabase env + seeds codes before it goes live.

### D2 — Sims run against a node:sqlite mirror when no Supabase creds are present
The directive says sims run "against staging Supabase" and "never skip silently" when
credentials are missing. No staging Supabase project is configured here. Decision:
`sims/_store.mjs` uses real Supabase RPCs when `SUPABASE_URL`+`SUPABASE_SERVICE_KEY`
are set, otherwise a `node:sqlite` in-process DB that mirrors the schema.sql RPC logic
exactly. The substitution is logged loudly on every run. Final validation against
staging Supabase is a Gate-3 step. Nothing is skipped.

### D3 — `zf_commit_code` extended with two params to write the delivery atomically
The spec signature is `zf_commit_code(p_reservation_token uuid)`, but the delivery row
needs `application_type` and `jurisdiction_state`, which the RPC does not otherwise
know. Decision: `zf_commit_code(p_reservation_token, p_application_type,
p_jurisdiction_state)` so the `zf_deliveries` insert happens in the SAME transaction as
the state transition (as the spec requires). No PII beyond state is stored.

### D4 — Reserve uses SELECT … FOR UPDATE, not a bare single UPDATE
The spec says "single atomic UPDATE … WHERE … RETURNING, no read-then-write", but the
6-branch resolution (distinct CODE_INVALID / CODE_CONSUMED / CODE_IN_USE / idempotent /
TTL-reclaim / reserve outcomes) cannot be expressed as one bare UPDATE. Decision: take
a row lock with `SELECT … FOR UPDATE` then branch. The lock (not an unlocked
read-then-write) is what defeats the 20-concurrent race — the "no read-then-write"
caution is about avoiding an unlocked TOCTOU, which FOR UPDATE satisfies. Verified by
`sim-double-spend` (exactly 1 success / 19 CODE_IN_USE).

### D5 — Added `zf_peek_code` (read-only) for the Unlock gate
So the access-code gate can tell the buyer "invalid / already used / ok" WITHOUT taking
a 15-minute reservation lock on the code. Not in the spec's RPC list; additive and
read-only.

### D6 — Perplexity MCP not reachable through the session tool interface
`claude mcp list` shows the Perplexity server connected, but its `perplexity_ask` tool
did not surface in the session's tool search. Per directive §1 step 3, fell back to
WebSearch for citation verification and logged the method in `VERIFICATION_LOG.md`. Did
not block.

## GENERIC fallback backfill queue (T5)
States for which a special-exception/variance frame has NOT been verified fall back to
`frames/GENERIC.json` (criterion-by-criterion, applicant carries the burden throughout,
no burden-shift assertion). Each fallback hit at runtime is a candidate for a future
verified per-state frame. Only FL is verified and shipped this pass.

- (runtime GENERIC hits will be appended here as they occur)

## T7 replication — pending (do NOT execute in this directive)
Replicate the model-string guard (single constant + `models.allowlist.json` + verify
script) to: TenantFight, FightMyHOA, ClaimFighter, TaxFightLetter. Logged as pending
per T7; not executed here to avoid scope expansion.
