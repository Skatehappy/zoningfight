// scripts/verify-model.mjs — T7 model-string guard.
// Resolves the single model constant, asserts it is in models.allowlist.json,
// and (when ANTHROPIC_API_KEY is present) pings the model with a minimal
// completion. Fails loudly on any error.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MODEL } from '../api/_config.js';

const here = dirname(fileURLToPath(import.meta.url));
const allow = JSON.parse(readFileSync(join(here, '..', 'models.allowlist.json'), 'utf8'));

let failed = false;
const fail = (m) => { console.error(`  FAIL: ${m}`); failed = true; };

if (!MODEL) fail('MODEL constant is empty');
if (!allow.allowlist.includes(MODEL)) {
  fail(`resolved model "${MODEL}" is not in the allowlist ${JSON.stringify(allow.allowlist)}`);
} else {
  console.log(`  ok: model "${MODEL}" is allow-listed`);
}

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.log('  note: ANTHROPIC_API_KEY not set — live model ping skipped (allowlist check only).');
} else {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 8, thinking: { type: 'disabled' },
        messages: [{ role: 'user', content: 'Reply with the single word OK.' }] }),
    });
    if (!res.ok) fail(`live ping HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    else {
      const data = await res.json();
      const text = data.content?.find(b => b.type === 'text')?.text || '';
      if (!text) fail('live ping returned no text block');
      else console.log(`  ok: live model ping succeeded ("${text.trim().slice(0, 20)}")`);
    }
  } catch (e) {
    fail(`live ping threw: ${e.message}`);
  }
}

if (failed) { console.error('MODEL GUARD: FAIL'); process.exit(1); }
console.log('MODEL GUARD: PASS');
