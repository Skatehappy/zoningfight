// api/generate.js
import { MODEL } from './_config.js';
import { lintLetter } from './_lint.js';
import { isTestCode, takeTestBudget } from './_g4t.js';
import { verifyLicense } from './_license.js';
import { verifiedFor, citationRules, lintCitations } from './_citelint.js';
import { lintNumbers } from './_numlint.js';
import { callComplete } from './_complete.js';
import { findPersona, USER_SIGNS_RULE } from './_persona.js';
import { openActsRule, lintRecordsMeetings } from './_open-acts.js';
import VERIFIED from './_verified-citations.json' with { type: 'json' };

// Node serverless runtime (NOT edge). Edge caps at ~25s on Hobby and ignores
// maxDuration, which 504'd ~25s Opus letters. Node honors maxDuration:60. This
// MUST use the classic (req, res) handler: Vercel's Node runtime writes the
// response via res and IGNORES a returned Response object (returning one hangs
// the function until the timeout).
export const config = { maxDuration: 60 };

const PRODUCT_LINK = 'Z3JNl';

// Appended server-side to every letter request (client cannot remove it).
export const PLAIN_TEXT_RULE = [String.fromCharCode(10), String.fromCharCode(10), "FORMAT RULE (mandatory): write the letter as plain text only. Do not use markdown of any kind: no # headings, no ** or __ bold, no * or _ italics, no bullet markers other than a plain hyphen at line start, no tables or | characters, no code fences, no horizontal rules. Use ordinary paragraphs and numbered lines such as 1. 2. 3. where a list is needed."].join("");

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  }
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

// Per-request time budget (ms). Vercel Node maxDuration is 60s; every request answers by ~50s at the latest.
//  - HARD_MS: each model fetch is aborted here; the request then answers 502 (or a stripped fallback) instead of 504.
//  - RETRY_BEFORE_MS: the truncation retry (second, larger call) and the lint regeneration (second attempt) each
//    start only if the previous model reply arrived before this mark; otherwise they are skipped.
// Worst case: reply at 22s + retry capped at 50s = 50s. One model call per request in the normal case.
export const HARD_MS = 50000;
export const RETRY_BEFORE_MS = 22000;

export default async function handler(req, res) {
  const t0 = Date.now();
  cors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { accessCode, systemPrompt, userPrompt, reviewMode, draftLetter, markUsed,
            criteria, forbiddenPhrases, enforceForbidden, state, letterType } = await readBody(req);

    if (!accessCode || !accessCode.trim()) {
      return res.status(401).json({ error: 'Access code required' });
    }

    const payhipApiKey = process.env.PAYHIP_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!payhipApiKey || !anthropicKey) {
      return res.status(500).json({ error: 'Service not configured' });
    }

    const isCheckCall = systemPrompt === 'Reply: VALID';

    // G4T test code (inert unless G4_TEST_CODE_SECRET is set): no Payhip verify, no usage mark.
    const testCode = isTestCode(accessCode);
    if (!testCode) {
      const lic = await verifyLicense(accessCode, PRODUCT_LINK, payhipApiKey);
      if (!lic.ok) return res.status(lic.status).json({ error: lic.error });
    }

    // Delivery-confirmed usage mark. The client calls this ONCE, after the final
    // letter has rendered — so the code is consumed only after successful
    // delivery, not on the generation attempt. No model call here. A failure is
    // swallowed: the customer already has the letter (we absorb the accounting).
    if (markUsed) {
      if (testCode) console.error('[g4t] markUsed skipped (test code)');
      if (accessCode && accessCode.trim() && !testCode) {
        try {
          await fetch(`https://payhip.com/api/v1/license/usage`, {
            method: 'PUT',
            signal: AbortSignal.timeout(8000),
            headers: { 'payhip-api-key': payhipApiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `product_link=${PRODUCT_LINK}&license_key=${encodeURIComponent(accessCode.trim())}`,
          });
        } catch { /* letter already delivered; do not fail on a usage-mark hiccup */ }
      }
      return res.status(200).json({ ok: true });
    }

    // Access check (client gate): license already verified above. No model call, no usage mark.
    if (isCheckCall) return res.status(200).json({ text: 'VALID' });

    if (testCode) {
      const b = takeTestBudget();
      console.error(`[g4t] test code use ${b.used}/${b.cap} state=${String(state || '').slice(0, 20)} type=${String(letterType || '').slice(0, 40)}${isCheckCall ? ' check' : reviewMode ? ' review' : ' draft'}`);
      if (!b.ok) return res.status(429).json({ error: 'Test code daily cap reached' });
    }

    // Citation lock (S7): the model may cite only authorities VERIFIED for this state, or ones the user typed.
    const verified = verifiedFor(VERIFIED, state);
    const userText = reviewMode && draftLetter ? `${userPrompt || ''}
${draftLetter}` : (userPrompt || '');

    let messages;
    if (reviewMode && draftLetter) {
      messages = [{ role: 'user', content: `Review and improve this appeal letter. Fix vague language, ensure all arguments are explicitly stated, remove emotional appeals, tighten redundancy. Write plain text only (no markdown: no #, **, __, tables or code fences). Keep the writer as the owner/applicant signing in their own name ([Your Name]); never present the letter as written by an attorney, counsel or a firm. Return ONLY the improved letter:\n\n${draftLetter}` }];
    } else {
      messages = [{ role: 'user', content: userPrompt }];
    }

    const callAnthropic = async (avoid = [], personaHits = []) => {
      const avoidNote = avoid.length ? `
Do NOT use any of the following citations or figures (they are not verified): ${avoid.join('; ')}. Rewrite without them.` : '';
      const personaNote = personaHits.length ? `
Your previous draft was rejected because it contained the phrase "${personaHits.join('", "')}". The letter is written and signed by the owner/applicant in their own name ([Your Name]); never describe the writer as an attorney, counsel, law firm or representative. Rewrite it without that wording.` : '';
      const sys = isCheckCall ? undefined : ((systemPrompt || '') + citationRules(verified) + openActsRule(verified.abbr) + '\n\n' + USER_SIGNS_RULE + PLAIN_TEXT_RULE + avoidNote + personaNote).trim();
      // stop_reason "max_tokens" = truncated: retried once with a higher limit, never linted or returned as a letter.
      const r = await callComplete('https://api.anthropic.com/v1/messages', anthropicKey, max => ({ model: MODEL, max_tokens: max, thinking: { type: 'disabled' }, system: sys, messages }), [3000, 6000], { deadline: t0 + HARD_MS, retryBefore: t0 + RETRY_BEFORE_MS });
      if (!r.ok) return { httpError: r.err, truncated: !!r.truncated, timedOut: !!r.timedOut };
      return { text: r.text };
    };

    // Generate, LINT (forbidden hardship phrases + no-fabrication for special
    // exceptions), and regenerate ONCE on a lint failure. Markers are always
    // stripped from the delivered text. The code is NOT marked used here — the
    // client sends { markUsed:true } after the letter renders.
    let lastReason = null;
    let avoid = [];
    let personaHits = [];
    let fallback = null;   // citation-stripped first draft, used if the single regeneration itself fails
    for (let attempt = 0; attempt < 2; attempt++) {
      // Budget guard: a second model call (lint regeneration) only starts if the first finished early enough.
      if (attempt > 0 && Date.now() - t0 > RETRY_BEFORE_MS) {
        console.error(`[budget] skipping attempt ${attempt + 1} at ${Date.now() - t0}ms`);
        if (fallback) return res.status(200).json({ text: fallback });
        return res.status(502).json({ error: 'The letter took too long to finish checking, so it was not delivered. Your access code has not been used. Please try again.', detail: 'time-budget' });
      }
      const gen = await callAnthropic(avoid, personaHits);
      if (gen.httpError && fallback) return res.status(200).json({ text: fallback });
      if (gen.timedOut) return res.status(502).json({ error: 'The AI took too long to answer, so no letter was delivered. Your access code has not been used. Please try again.', detail: 'timeout' });
      if (gen.truncated) return res.status(502).json({ error: 'The letter was cut off before it finished, so it was not delivered. Your access code has not been used. Please try again.', detail: 'truncated' });
      if (gen.httpError) return res.status(502).json({ error: 'AI generation failed', detail: String(gen.httpError).slice(0, 500) });
      // No attorney voice: the letter is the user's own. A hit regenerates once (budget permitting, see the guard above);
      // a second hit is never returned and never marks the code used (markUsed is a separate, later request).
      if (!isCheckCall) {
        const ph = findPersona(gen.text);
        if (ph.length) {
          console.error(`[persona] attempt ${attempt + 1} rejected phrases=${JSON.stringify(ph)}`);
          if (attempt === 0) { personaHits = ph; continue; }
          if (fallback) return res.status(200).json({ text: fallback });
          return res.status(502).json({ error: `The letter could not be produced without wording that presents it as written by an attorney or firm (${ph.join('; ')}), so no letter was delivered. Your access code has not been used. Please try again.`, detail: 'persona-lint' });
        }
      }
      const lint = lintLetter(gen.text, { criteria, forbiddenPhrases, enforceForbidden });
      if (lint.ok) {
        if (isCheckCall) return res.status(200).json({ text: lint.cleanText });
        const cl0 = lintCitations(lint.cleanText, verified.keys, userText, verified.subs);
        const nl = lintNumbers(lint.cleanText, verified.abbr, userText);   // dollar/percent/day figures vs verified state data
        const rm = lintRecordsMeetings(lint.cleanText, verified.abbr);   // records request must cite the public-records act, not the open-meetings act
        if (cl0.ok && nl.ok && rm.ok) return res.status(200).json({ text: lint.cleanText });
        const cl = { bad: [...cl0.bad, ...nl.bad, ...rm.bad], stripped: rm.strip(lintNumbers(cl0.stripped, verified.abbr, userText).stripped) };
        // Log citation strings only (never letter text / user input).
        console.error(`[citelint] state=${verified.abbr || 'n/a'} attempt=${attempt + 1} misses=${cl.bad.length} cites=${JSON.stringify(cl.bad.map(s => s.slice(0, 80)))} action=${attempt === 0 ? 'regenerate' : 'strip'}`);
        if (attempt === 1) return res.status(200).json({ text: cl.stripped });
        avoid = cl.bad;
        fallback = cl.stripped;
        continue;
      }
      lastReason = lint.reason;
      console.error(`[lint] attempt ${attempt + 1} failed: ${lint.reason}`);
    }
    // Second lint failure: reject. Code was never marked used, so nothing is burned.
    return res.status(422).json({ error: 'Generation failed', detail: `lint:${lastReason}` });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
