
## State Frame Backfill (branch state-frame-backfill, 2026-09-09)

### D-SFB-1 — Perplexity unreachable; WebSearch fallback (§1.3)
`claude mcp list` shows perplexity Connected, but `perplexity_ask` is not exposed to the
session's tool interface (consistent all session). Fell back to WebSearch, logged in
VERIFICATION_LOG.md. Not a block.

### D-SFB-2 — Default burden is criteria_compliance / applicant_carries; zero citations
Per §0 (understate) and §5 (burden-shift skepticism): special_exception frames default to
`criteria_compliance` (special exceptions are conditionally-permitted uses — no burden
shift), variance frames to `applicant_carries`. Citations default to ZERO; only a verified
appellate cite promotes a frame to `prima_facie_shifting`. A zero-citation frame is
acceptable and is the expected common result.

### D-SFB-3 — Batch 1 burden-shift candidates NOT adopted (CT, DC)
CT (§8-3c: "if a special exception satisfies the regulations, the agency has no discretion
to deny") and DC ("once the applicant makes the requisite showing, the Board ordinarily
must grant") describe strong criteria_compliance / entitlement doctrines. These are NOT the
same as a Florida-style burden SHIFT to the government, and neither surfaced a verified
appellate citation in-batch, so both stay `criteria_compliance`. Logged as candidates for a
future verified upgrade.

### D-SFB-4 — opposing_variance / opposing_special_exception deferred (§3)
Not generated this pass. Deferred.

### D-SFB-5 — Maryland adopted as prima_facie_shifting (batch 2)
Schultz v. Pritts, 291 Md. 1 (1981) verified (existence + proposition). MD special_exception
set to prima_facie_shifting with that single cite. Generic shift structure used (caption,
authorization, criteria_compliance, burden_allocation, record_preservation, signature) — the
FL-specific "both_prongs" section is NOT generalized to other shift states. Burden-allocation
template made state-neutral ("granted unless the opposition shows the standards are unmet;
state the shift only as far as the verified authority supports").

### D-SFB-6 — Statutory burden-shift candidates NOT adopted (UT, WI); MN, CT, DC, LA, NM candidates
Per §5, prima_facie_shifting requires an APPELLATE citation. Utah (Utah Code 10-9a-507) and
Wisconsin (Wis. Stat. 59.69(5e)/62.23(7)(de)) have STATUTORY applicant-favorable mandatory-grant
rules but no appellate cite adopted -> understated to criteria_compliance. Similarly MN, CT, DC,
LA, NM showed strong criteria-compliance / entitlement language (often the generic "burden shifts
to opponents" treatise line) without a verified appellate holding -> criteria_compliance, zero
cites. All are upgrade candidates for a future pass if statutory authority is deemed sufficient
or an appellate cite is verified. Understated per §0.

### D-SFB-7 — Discretionary special-permit states -> applicant_carries
MA, MO, MT, VA set to applicant_carries (board/body retains discretion to deny even if criteria
met; VA treats special use permits as legislative/"fairly debatable"). Not criteria_compliance.
