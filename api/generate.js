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

// Fail-closed Payhip license verify. Runs on EVERY request (gate check and
// generation). Rejects unless HTTP 200 + data.enabled===true + product_link
// matches this app. Network error / timeout / non-JSON -> 503 (never "invalid").
async function verifyLicense(licenseKey, productLink, apiKey) {
  const key = (licenseKey || '').trim();
  if (!key) return { ok: false, status: 401, error: 'Invalid license key.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://payhip.com/api/v1/license/verify?product_link=${encodeURIComponent(productLink)}&license_key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { headers: { 'payhip-api-key': apiKey }, signal: controller.signal });
    if (res.status !== 200) return { ok: false, status: 401, error: 'Invalid license key.' };
    const json = await res.json();
    const d = json && json.data;
    if (!d || d.enabled !== true || d.product_link !== productLink) {
      return { ok: false, status: 401, error: 'Invalid license key.' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, status: 503, error: 'License verification unavailable — please try again shortly.' };
  } finally {
    clearTimeout(timer);
  }
}

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

    const lic = await verifyLicense(accessCode, PRODUCT_LINK, payhipApiKey);
    if (!lic.ok) return res.status(lic.status).json({ error: lic.error });

    // Delivery-confirmed usage mark. The client calls this ONCE, after the final
    // letter has rendered — so the code is consumed only after successful
    // delivery, not on the generation attempt. No model call here. A failure is
    // swallowed: the customer already has the letter (we absorb the accounting).
    if (markUsed) {
      if (accessCode && accessCode.trim()) {
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
