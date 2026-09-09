// api/generate.js
import { MODEL } from './_config.js';
import { lintLetter } from './_lint.js';

// Node serverless runtime (NOT edge). Edge caps at ~25s on Hobby and ignores
// maxDuration, which 504'd ~25s Opus letters. Node honors maxDuration:60. This
// MUST use the classic (req, res) handler: Vercel's Node runtime writes the
// response via res and IGNORES a returned Response object (returning one hangs
// the function until the timeout).
export const config = { maxDuration: 60 };

const PRODUCT_LINK = 'Z3JNl';

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

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { accessCode, systemPrompt, userPrompt, reviewMode, draftLetter, markUsed,
            criteria, forbiddenPhrases, enforceForbidden } = await readBody(req);

    if (!accessCode || !accessCode.trim()) {
      return res.status(401).json({ error: 'Access code required' });
    }

    const payhipApiKey = process.env.PAYHIP_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!payhipApiKey || !anthropicKey) {
      return res.status(500).json({ error: 'Service not configured' });
    }

    const isCheckCall = systemPrompt === 'Reply: VALID';
    const TEST_KEYS = (process.env.TEST_KEYS || 'SMOKE-TEST-2026-BAO').split(',').map(k => k.trim().toUpperCase()).filter(Boolean);
    const isTestKey = TEST_KEYS.includes(String(accessCode || '').trim().toUpperCase());

    // Delivery-confirmed usage mark. The client calls this ONCE, after the final
    // letter has rendered — so the code is consumed only after successful
    // delivery, not on the generation attempt. No model call here. A failure is
    // swallowed: the customer already has the letter (we absorb the accounting).
    if (markUsed) {
      if (!isTestKey && accessCode && accessCode.trim()) {
        try {
          await fetch(`https://payhip.com/api/v1/license/usage`, {
            method: 'PUT',
            headers: { 'payhip-api-key': payhipApiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `product_link=${PRODUCT_LINK}&license_key=${encodeURIComponent(accessCode.trim())}`,
          });
        } catch { /* letter already delivered; do not fail on a usage-mark hiccup */ }
      }
      return res.status(200).json({ ok: true });
    }

    if (!isCheckCall && !isTestKey) {
      const payhipRes = await fetch(
        `https://payhip.com/api/v1/license/verify?product_link=${PRODUCT_LINK}&license_key=${encodeURIComponent(accessCode.trim())}`,
        { method: 'GET', headers: { 'payhip-api-key': payhipApiKey } }
      );
      if (!payhipRes.ok) {
        // Fail closed: any non-200 (auth error, timeout, 5xx, unknown key) rejects.
        return res.status(401).json({ error: 'Invalid access code. Check your Payhip receipt email.' });
      }
      const payhipData = await payhipRes.json().catch(() => null);
      // Must be a REAL, enabled license. Payhip returns a {data} envelope even for
      // invalid keys (enabled:false), so checking data existence alone fails OPEN.
      if (!payhipData?.data?.enabled) {
        return res.status(401).json({ error: 'Invalid access code. Check your Payhip receipt email.' });
      }
      if (payhipData.data.uses >= 1) {
        return res.status(401).json({ error: 'This code has already been used. Each code generates one letter.' });
      }
    }

    let messages;
    if (reviewMode && draftLetter) {
      messages = [{ role: 'user', content: `Review and improve this appeal letter. Fix vague language, ensure all arguments are explicitly stated, remove emotional appeals, tighten redundancy. Return ONLY the improved letter:\n\n${draftLetter}` }];
    } else {
      messages = [{ role: 'user', content: userPrompt }];
    }

    const callAnthropic = async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 3000,
          thinking: { type: 'disabled' },
          system: (!isCheckCall && systemPrompt) ? systemPrompt : undefined,
          messages,
        }),
      });
      if (!response.ok) return { httpError: await response.text() };
      const data = await response.json();
      // Extract the text block by type, not position (adaptive thinking can put a
      // thinking block first). Missing text => treat as a generation failure.
      const t = data.content?.find(b => b.type === 'text')?.text;
      if (!t) return { httpError: `No text block (stop_reason: ${data.stop_reason || 'unknown'})` };
      return { text: t };
    };

    // Generate, LINT (forbidden hardship phrases + no-fabrication for special
    // exceptions), and regenerate ONCE on a lint failure. Markers are always
    // stripped from the delivered text. The code is NOT marked used here — the
    // client sends { markUsed:true } after the letter renders.
    let lastReason = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const gen = await callAnthropic();
      if (gen.httpError) return res.status(502).json({ error: 'AI generation failed', detail: String(gen.httpError).slice(0, 500) });
      const lint = lintLetter(gen.text, { criteria, forbiddenPhrases, enforceForbidden });
      if (lint.ok) return res.status(200).json({ text: lint.cleanText });
      lastReason = lint.reason;
      console.error(`[lint] attempt ${attempt + 1} failed: ${lint.reason}`);
    }
    // Second lint failure: reject. Code was never marked used, so nothing is burned.
    return res.status(422).json({ error: 'Generation failed', detail: `lint:${lastReason}` });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
