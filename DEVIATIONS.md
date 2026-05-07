# Deviations from MASTER_SPEC.md

Logged per user instruction to record any out-of-spec changes rather than make them silently.

## 1. `scripts/generate-content.js` — dotenv loading and statute regex

**Spec section 7** specifies `import 'dotenv/config';` and a statute-citation regex `/§|Section|Title|Code|Stat\.|Statute/`.

**Deviation:**
1. dotenv import replaced with explicit `dotenv.config({ path: '.env.local' })` plus `.env` fallback. Default `dotenv/config` reads `.env` only; spec section 14 mandates the key live in `.env.local`, so the literal spec import authenticates as nobody.
2. Validation regex extended to `/§|Section|Title|Code|Stat\.|Statute|ILCS|Compiled Statutes/i` (case-insensitive, plus ILCS support). Illinois Compiled Statutes use the form `765 ILCS 160/1-30` with no `§` and no English statute words; the original regex rejected every Illinois page as "statute citation does not match expected pattern."

## 2. `.gitignore` — broader contents than spec

**Spec section 14** lists only:
```
.env.local
scripts/data/generated/_failures.log
```

**Deviation:** Repo had no prior `.gitignore`. Created a full file including standard Vite/Node ignores (`node_modules/`, `dist/`, `.env`, `.env.*.local`, `.vercel`, `.DS_Store`, `*.log`) in addition to the spec's two lines.

## 3. `vercel.json` — preserved existing `functions` block

**Spec section 12** says "append rewrites; do not replace existing rules" — silent on other top-level keys.

**Deviation:** ZoningFight's existing `vercel.json` contained a `functions: { "api/generate.js": { "maxDuration": 60 } }` block beyond the spec's example. Preserved verbatim while appending the spec's two new rewrites. This is conservative per the "do not replace existing" spirit.

## 4. App.jsx URL-param dispute mappings

**Packet section 3** provides example slug→variance-type mappings (e.g., `'zoning-variance-appeal-letter' → 'Variance Appeal'`).

**Deviation:** Used the existing form's actual `varianceType` select options. The form has only 4 options ("Area/Setback Variance", "Use Variance", "Dimensional Variance", "Other") so most SEO-page slugs collapse to "Other":

| slug | mapped to |
|---|---|
| zoning-variance-appeal-letter | Area/Setback Variance |
| zoning-decision-appeal | Other |
| special-use-permit-appeal | Use Variance |
| setback-variance-request | Area/Setback Variance |
| conditional-use-permit-denial | Use Variance |
| zoning-board-hearing-objection | Other |
| spot-zoning-challenge | Other |
| nonconforming-use-letter | Other |
| zoning-code-violation-defense | Other |
| rezoning-application-letter | Other |

**Reason:** Per packet's own instruction: "URL params must map to strings the existing form actually accepts." Logged here for traceability.
