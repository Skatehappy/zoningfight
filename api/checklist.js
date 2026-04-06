// api/checklist.js
// Generates submission checklist via Claude API

export const config = { runtime: 'edge' };

const VALID_CODES = (process.env.ACCESS_CODES || '').split(',').map(c => c.trim()).filter(Boolean);

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
    const { accessCode, address, state, varianceType, letterExcerpt } = await req.json();

    if (!accessCode || !VALID_CODES.includes(accessCode.toUpperCase())) {
      return new Response(JSON.stringify({ error: 'Invalid access code' }), { status: 401, headers });
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Generate a practical zoning variance submission checklist as a JSON array of strings. Be specific to this situation. Include items like completed application form, letter copies, site plan, survey, photos, filing fee, deed, abutter list, etc. Return ONLY a valid JSON array, no other text.

Property: ${address}, ${state}
Variance type: ${varianceType || 'Area variance'}
Letter excerpt: ${letterExcerpt?.substring(0, 200) || ''}`,
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();

    let checklist;
    try {
      checklist = JSON.parse(clean);
    } catch {
      checklist = [
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
