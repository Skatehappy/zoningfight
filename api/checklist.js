// api/checklist.js
// Generates submission checklist via Claude API
import { MODEL } from './_config.js';
import { verifyLicense } from './_license.js';
import { isTestCode, takeTestBudget } from './_g4t.js';
import { verifiedFor, citationRules, lintCitations } from './_citelint.js';
import { lintNumbers } from './_numlint.js';
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

export default async function handler(req, res) {
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
    if (isTestCode(accessCode)) {
      const b = takeTestBudget();
      console.error(`[g4t] checklist test code use ${b.used}/${b.cap}`);
      if (!b.ok) return res.status(429).json({ error: 'Test code daily cap reached' });
    } else {
      const lic = await verifyLicense(accessCode, PRODUCT_LINK, payhipApiKey);
      if (!lic.ok) return res.status(lic.status).json({ error: lic.error });
    }

    const verified = verifiedFor(VERIFIED, state);
    const userText = `${address || ''} ${varianceType || ''}`;

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
        system: (citationRules(verified) + NO_FIGURES).trim(),
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
      return res.status(502).json({ error: 'Checklist generation failed', detail });
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

    // Citation lock + numeric-claims check on every item (items with an unverified cite/figure are dropped).
    if (Array.isArray(checklist)) {
      checklist = checklist.filter(it => typeof it === 'string'
        && lintCitations(it, verified.keys, userText, verified.subs).ok
        && lintNumbers(it, verified.abbr, userText).ok);
    }
    return res.status(200).json({ checklist });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
