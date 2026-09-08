// api/generate.js
import { MODEL } from './_config.js';
import { lintLetter } from './_lint.js';

// Node serverless runtime (NOT edge). Edge caps at ~25s on Hobby and ignores
// maxDuration, which 504'd ~25s Opus letters. Node honors maxDuration:60. This
// MUST use the classic (req, res) handler: Vercel's Node runtime writes the
// response via res and IGNORES a returned Response object (returning one hangs
// the function until the timeout).
export const config = { maxDuration: 60 };

// Permanent smoke-test bypass (mirrors src/lib/redeem.js).
const SMOKE_TEST_KEY = 'SMOKE-TEST-2026-BAO';
const TEST_TOKEN = 'test-token-0000';

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

// Structured error responder — the client maps errorCode to a T3 message.
// Generation failures NEVER burn a code (commit is client-side, post-render).
function fail(res, status, errorCode, detail) {
  return res.status(status).json({ errorCode, detail });
}

// Confirm a live reservation before spending Anthropic tokens. Read-only.
async function reservationIsLive(reservationToken) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    // Backend not wired yet. Treat as transient (code never burned); the app
    // cannot generate real letters until Supabase env is configured (Gate 3).
    return false;
  }
  try {
    const r = await fetch(`${url}/rest/v1/rpc/zf_verify_reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ p_reservation_token: reservationToken }),
    });
    if (!r.ok) return false;
    const out = await r.json();
    return out?.valid === true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ errorCode: 'TRANSIENT', detail: 'method' });

  try {
    const {
      reservationToken, accessCode,
      systemPrompt, userPrompt, reviewMode, draftLetter,
      criteria,            // [{criterion, evidence}] — no-fabrication lint (T5)
      forbiddenPhrases,    // from the selected frame (T5)
      enforceForbidden,    // true for special-exception / opposing-special-exception
    } = await readBody(req);

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return fail(res, 500, 'TRANSIENT', 'Service not configured');

    const isTest =
      String(accessCode || '').trim().toUpperCase() === SMOKE_TEST_KEY ||
      reservationToken === TEST_TOKEN;

    // Authorize generation by a live reservation (or the smoke bypass).
    if (!isTest) {
      if (!reservationToken) return fail(res, 401, 'TRANSIENT', 'no reservation');
      const live = await reservationIsLive(reservationToken);
      if (!live) return fail(res, 401, 'TRANSIENT', 'reservation not live');
    }

    let messages;
    if (reviewMode && draftLetter) {
      messages = [{ role: 'user', content: `Review and improve this letter. Fix vague language, ensure all arguments are explicitly stated, remove emotional appeals, tighten redundancy. Do NOT introduce any quoted ordinance criteria that were not already present. Return ONLY the improved letter:\n\n${draftLetter}` }];
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
          system: systemPrompt || undefined,
          messages,
        }),
      });
      if (!response.ok) return { httpError: (await response.text()).slice(0, 500) };
      const data = await response.json();
      // Extract the text block by type, not position (adaptive thinking can
      // place a thinking block first).
      const text = data.content?.find(b => b.type === 'text')?.text;
      if (!text) return { httpError: `no text block (stop_reason: ${data.stop_reason || 'unknown'})` };
      return { text };
    };

    // Generate, lint, and REGENERATE ONCE on a lint failure. A second lint
    // failure fails TRANSIENT with the code released (client releases). A lint
    // failure never burns a code. Markers are stripped for delivery.
    let lastLintReason = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const gen = await callAnthropic();
      if (gen.httpError) return fail(res, 502, 'TRANSIENT', gen.httpError);
      const lint = lintLetter(gen.text, { criteria, forbiddenPhrases, enforceForbidden });
      if (lint.ok) return res.status(200).json({ text: lint.cleanText });
      lastLintReason = lint.reason;
      // Log the full output server-side (never shown to the buyer).
      console.error(`[lint] attempt ${attempt + 1} failed: ${lint.reason}\n---\n${gen.text}\n---`);
    }
    return fail(res, 422, 'TRANSIENT', `lint:${lastLintReason}`);
  } catch (err) {
    return fail(res, 500, 'TRANSIENT', err.message);
  }
}
