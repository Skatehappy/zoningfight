// api/checklist.js
// Generates submission checklist via Claude API
import { MODEL } from './_config.js';

export const config = { runtime: 'edge' };

// Authorize by a live reservation (or the smoke-test bypass). The checklist is
// generated while the reservation is still live (before the client commits the
// code post-render), so this reuses the same reservation the letter used.
async function reservationIsLive(reservationToken) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key || !reservationToken) return false;
  try {
    const r = await fetch(`${url}/rest/v1/rpc/zf_verify_reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ p_reservation_token: reservationToken }),
    });
    if (!r.ok) return false;
    return (await r.json())?.valid === true;
  } catch { return false; }
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  try {
    const { accessCode, reservationToken, address, state, varianceType, letterExcerpt, direction } = await req.json();
    const isOpposing = direction === 'opposing';

    const TEST_KEYS = (process.env.TEST_KEYS || 'SMOKE-TEST-2026-BAO').split(',').map(k => k.trim().toUpperCase()).filter(Boolean);
    const isTestKey = TEST_KEYS.includes(String(accessCode || '').trim().toUpperCase()) || reservationToken === 'test-token-0000';
    if (!isTestKey && !(await reservationIsLive(reservationToken))) {
      return new Response(JSON.stringify({ error: 'Invalid or expired reservation' }), { status: 401, headers });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 900,
        thinking: { type: 'disabled' },
        messages: [{
          role: 'user',
          content: isOpposing
            ? `Generate a practical checklist for a property owner OPPOSING a zoning variance granted to another party, as a JSON array of strings. Cover: confirm and calendar the appeal deadline (these windows are short and jurisdictional); send via certified mail, return receipt requested; file with the town or county clerk as well as the board; request the complete record (application, staff report, minutes, findings of fact); photograph site conditions and your property's exposure; identify other affected neighbors who may join; consult a land use attorney before the deadline if the impact is significant; check whether your jurisdiction requires a formal appeal filing versus a letter of objection. Return ONLY a valid JSON array, no other text.

Objector property: ${address}, ${state}
Situation: ${varianceType || 'Opposing a granted variance'}
Letter excerpt: ${letterExcerpt?.substring(0, 200) || ''}`
            : `Generate a practical zoning variance submission checklist as a JSON array of strings. Be specific to this situation. Include items like completed application form, letter copies, site plan, survey, photos, filing fee, deed, abutter list, etc. Return ONLY a valid JSON array, no other text.

Property: ${address}, ${state}
Variance type: ${varianceType || 'Area variance'}
Letter excerpt: ${letterExcerpt?.substring(0, 200) || ''}`,
        }],
      }),
    });

    // Fail loudly on an API error instead of silently returning an empty
    // checklist (the pre-migration bug: a dead model 404'd and this returned []).
    if (!response.ok) {
      const detail = await response.text();
      return new Response(JSON.stringify({ error: 'Checklist generation failed', detail }), { status: 502, headers });
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();

    let checklist;
    try {
      checklist = JSON.parse(clean);
    } catch {
      checklist = isOpposing
        ? [
            'Confirm the appeal deadline and calendar it — these windows are short and jurisdictional',
            'Send your objection via certified mail, return receipt requested',
            'File with the town or county clerk as well as the board that granted the variance',
            'Request the complete record: application, staff report, minutes, and findings of fact',
            'Photograph the site conditions and your property\'s exposure (light, drainage, sightlines)',
            'Identify other affected neighbors who may join the objection',
            'Consult a land use attorney before the deadline if the impact is significant',
            'Check whether your jurisdiction requires a formal appeal filing versus a letter of objection',
          ]
        : [
            'Completed variance application form (from town clerk)',
            'This cover letter — 3 copies minimum',
            'Current survey or plot plan showing dimensions',
            'Site plan showing proposed work and setbacks',
            'Photographs of the property from street and rear',
            'Filing fee — check amount with town clerk',
            'Copy of deed or proof of ownership',
            'List of abutting property owners with addresses',
            'Any prior variance approvals or relevant board decisions',
          ];
    }

    return new Response(JSON.stringify({ checklist }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
