// api/checklist.js
// Generates submission checklist via Claude API
import { MODEL } from './_config.js';
import { verifyLicense } from './_license.js';
import { isTestCode, takeTestBudget } from './_g4t.js';
import { verifiedFor, citationRules, lintCitations } from './_citelint.js';
import { lintNumbers } from './_numlint.js';
import { callComplete } from './_complete.js';
import { findPersona } from './_persona.js';
import { typeInfo, fallbackFor } from './_checklist-fallbacks.js';
import VERIFIED from './_verified-citations.json' with { type: 'json' };

const NO_FIGURES = '\n\nFIGURE RULES (mandatory): do not state any filing-fee amount, dollar figure, penalty amount or number of days/deadline unless the user supplied it; for fees and deadlines say to confirm the amount or date with the clerk.';

// Node serverless (classic req/res), same as generate.js — needed for the timing-safe G4T compare.
export const config = { maxDuration: 30 };

const PRODUCT_LINK = 'Z3JNl';

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  }
  const chunks = [];
  for await (const ch of req) chunks.push(typeof ch === 'string' ? Buffer.from(ch) : ch);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

// Time budget: the model part of a checklist request is capped at 20s total (retry only if the first reply was
// back within 8s); on any miss the per-type fallback list is returned with HTTP 200.
export const CHECKLIST_MODEL_MS = 20000;
export const CHECKLIST_RETRY_MS = 8000;

export default async function handler(req, res) {
  const t0 = Date.now();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { accessCode, address, state, varianceType, letterExcerpt, direction } = await readBody(req);
    const isOpposing = direction === 'opposing';

    if (!accessCode || !String(accessCode).trim()) return res.status(401).json({ error: 'Access code required' });

    const payhipApiKey = process.env.PAYHIP_API_KEY;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!payhipApiKey || !apiKey) return res.status(500).json({ error: 'Service not configured' });

    // Fail closed: nothing reaches Anthropic unless a Payhip license verifies (or a G4T test code,
    // inert unless G4_TEST_CODE_SECRET is set). Read-only verify: does NOT mark the code used.
    const testCode = isTestCode(accessCode);
    if (testCode) {
      const b = takeTestBudget();
      console.error(`[g4t] checklist test code use ${b.used}/${b.cap}`);
      if (!b.ok) return res.status(429).json({ error: 'Test code daily cap reached' });
    } else {
      const lic = await verifyLicense(accessCode, PRODUCT_LINK, payhipApiKey);
      if (!lic.ok) return res.status(lic.status).json({ error: lic.error });
    }

    const verified = verifiedFor(VERIFIED, state);
    const userText = `${address || ''} ${varianceType || ''}`;
    const info = typeInfo(varianceType);
    const who = isOpposing ? 'a property owner opposing a zoning decision made for another party' : 'an applicant or property owner';

    const system = (citationRules(verified) + NO_FIGURES).trim();
    const prompt = `Generate a practical checklist for ${who} sending a letter to a zoning board or office about ${info.focus}, as a JSON array of 8 to 10 strings. Every item is one plain action step of at most 25 words and fits this situation only: do not include steps that belong to a different kind of zoning matter. Always include sending the letter by certified mail with return receipt and keeping a copy. Steps are for the owner or applicant to do themselves; never write a step as if from an attorney, counsel or law firm. Return ONLY a valid JSON array, no other text.

Property: ${address}, ${state}
Situation: ${varianceType || 'Other zoning matter'}
Letter excerpt: ${letterExcerpt?.substring(0, 200) || ''}`;

    // Never parse a cut-off reply: callComplete retries once with a higher limit, then reports truncation.
    // Any model failure (HTTP error, truncation, unparseable reply) falls back to this letter type's own list, HTTP 200.
    const diag = {};
    const r = await callComplete('https://api.anthropic.com/v1/messages', apiKey, max => ({ model: MODEL, max_tokens: max, thinking: { type: 'disabled' }, system, messages: [{ role: 'user', content: prompt }] }), [2000, 4000], { deadline: t0 + CHECKLIST_MODEL_MS, retryBefore: t0 + CHECKLIST_RETRY_MS });
    diag.attempts = r.attempts; diag.stop = r.stop; diag.status = r.status;
    let checklist = null;
    if (r.ok) {
      try { checklist = JSON.parse(r.text.replace(/```json|```/g, '').trim()); } catch { diag.parseFailed = true; }
    } else {
      diag.failed = r.timedOut ? 'timeout' : r.truncated ? 'truncated' : 'model-error';
      console.error(`[checklist] model failure reason=${diag.failed} status=${r.status || 'n/a'}`);
    }

    // Citation lock + numeric-claims check on every item (items with an unverified cite/figure are dropped).
    // If fewer than 3 survive (or the reply was unusable), this letter type's static fallback is used instead.
    if (Array.isArray(checklist)) {
      checklist = checklist.filter(it => typeof it === 'string' && it.trim()).filter(it => {
        const c = lintCitations(it, verified.keys, userText, verified.subs);
        const n = lintNumbers(it, verified.abbr, userText);
        const p = findPersona(it);   // no attorney voice: such an item is dropped (fewer than 3 survivors -> static fallback)
        if (c.ok && n.ok && !p.length) return true;
        (diag.droppedItems = diag.droppedItems || []).push({ item: it.slice(0, 120), cites: c.bad, nums: n.bad, persona: p });
        return false;
      }).slice(0, 15);
    } else if (checklist !== null) { diag.parseFailed = true; checklist = null; }
    diag.survivors = Array.isArray(checklist) ? checklist.length : -1;
    if (!Array.isArray(checklist) || checklist.length < 3) { diag.usedFallback = true; checklist = fallbackFor(varianceType); }

    return res.status(200).json(testCode ? { checklist, _diag: diag } : { checklist });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
