
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

## Perplexity Re-Verification (branch state-frame-backfill, 2026-09-09)

### D-PRV-1 — Tier 1: all four burden shifts CONFIRMED, zero downgrades
MD (Schultz v. Pritts), NY (North Shore Steak House), NC (Humble Oil), PA (Bray) each survived all three
§3 questions (exists / proposition / good law) against Perplexity as an independent second source. Each
proposition was returned as "substantially correct" with a refinement (applicant still bears burden of
compliance with ordinance criteria; production vs. persuasion distinction) that the frames' existing
`burden_allocation` hedge ("state the shift only as far as that verified authority supports; do not
overstate it") already honors. Per §5, "confirmed" → keep. No proposition text edited (§10 = downgrades
only). `verified_via` stamped "WebSearch, Perplexity" on the four frames; this is verification metadata,
not a substantive change.

### D-PRV-2 — FL frozen citations confirmed; not edited (§2)
Irvine, Jesus Fellowship, Dusseau all confirmed via Perplexity. FL remains byte-identical to 1cd2287. No
FL citation failed, so §2's "report-only if fails" branch was not triggered.

### D-PRV-3 — Tier 2: 4 §6 candidates surfaced, none promoted; 3 confirmed correct
UT and WI carry statutory mandatory-grant language (Utah Code §10-9a-507(2); 2017 Wis. Act 67). CT and DC
carry a limited-discretion *entitlement* doctrine (Irwin, 244 Conn. 619; Stewart, 305 A.2d 516). Per §5/§6,
all four are logged as promotion candidates in _reports/PROMOTION-CANDIDATES.md and NOT promoted: statutory
mandatory-grant and limited-discretion entitlement are each a different argument structure than a Florida-
style case-law burden shift and may warrant their own burden category — a schema design decision reserved
for Rob. MN, NM, LA re-confirmed as correctly classified (no shift). No Tier-2 frame edited.

### D-PRV-4 — Tier 3 Batch A: 4 downgrades (AR CA GA HI)
Perplexity found broad board/agency discretion (no compliance-entitlement) for AR, CA (CUP), GA
(legislative), HI — so SE `criteria_compliance` → `applicant_carries` per §0 (understate) / §5. Materially
this is a label-only correction: SE criteria_compliance and applicant_carries generate the identical letter
(both "applicant carries throughout, no shift"); only prima_facie_shifting changes output. AL/AZ/CO/DE/IA
confirmed criteria_compliance. AK logged as §6 candidate (Griswold appellate shift); DE possible shift left
unverified. No promotions.

### D-PRV-5 — Tier 3 Batch B: 4 downgrades (IL KS MI MS)
Broad-discretion special-use states → SE CC→AC (label-only; identical letter output). ID/IN/KY/ME confirmed
CC; MA/MO confirmed AC. IN's "approval mandatory once criteria met" is entitlement-flavored (same family as
CT/DC), logged §6-adjacent, not promoted.
