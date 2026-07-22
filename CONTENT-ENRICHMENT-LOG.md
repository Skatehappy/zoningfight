# ZoningFight — Content Enrichment Log (SEO Phase 2)

Date: 2026-07-22 · Directive: CC-DIRECTIVE-All-Letter-Apps-Content-Enrichment.md (app 2 of 5, P1)

## STEP 0 — Inventory
Same generator as hoafight: `scripts/build-pages.js` + templates render 10 states ×
10 zoning dispute topics + 10 state hubs = **111 pages**. No `/letters` hub in this
repo (hoafight-only from a prior directive) — deferred; the per-page enrichment
sections are the index-rate fix.

## STEP 0.5 — Technical SEO
`vercel.json`: added `/landing.html` → `/` 301 so the `.html` alternate consolidates
to the canonical root (the `/` rewrite already serves the landing page). Canonical
tags + sitemap already bare-domain `https://zoningfight.com` (no www). www→bare /
http→https remain Vercel domain-level settings for Rob to confirm.

## STEP 1 — state-data.json (10 states)
Verified per-state zoning data (enabling statute, variance/appeal/special-use
processes + deadlines, nonconforming-use rules, ADU/home-business, regulatory body,
unique features, common disputes, recent reform). Research via WebSearch (Perplexity
unavailable). **47 sources** in `VERIFICATION_LOG-SEO-CONTENT.md`. Genuine
differentiation: CA (HAA/statewide ADU, 90-day writ), TX (no statewide zoning, 10-day
certiorari, no use variances), FL (Bert Harris + Live Local, 30-day certiorari), NY
(dual area/use variance, 30-day Article 78), IL (home-rule, 35-day admin review), PA
(MPC special-exception vs conditional-use split), OH (Duncan two-track variance), GA
(§36-66-4 notice, Petition for Review), NC (Chapter 160D unified, 24-mo nonconforming),
AZ (HB 2720/2721 statewide ADU + middle-housing preemption).

## STEP 2 — Generator
Ported the shared `enrichment.js` pattern (zoning-domain fields + topic map:
variance→variance_process, appeal→appeal_process, ADU→adu_rules, nonconforming→
nonconforming_use_rules). Injects 4 sections (Zoning & Land Use Law Overview / Your
Options / How to Appeal a Zoning Decision / Common Zoning Disputes + a Provisions-
Worth-Knowing list) below existing content; 2–3 data-derived FAQ Q&As merged into the
visible FAQ + FAQPage JSON-LD (now 8/page); state-hub law snapshot.

## STEP 3 — Verify
111 pages (unchanged URLs). Spot-checked CA/TX/AZ: valid JSON-LD, 8 FAQs, enrichment
present and state-specific. All 4 JS modules compile (Babel). Build only; not deployed.
