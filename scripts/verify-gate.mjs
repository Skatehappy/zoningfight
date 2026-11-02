// Three-Gate v7 — Gate 2 (execution-based verify) for letter apps.
// A1: required files present + package.json valid JSON.
// A9: citation-log parity — every statutory citation in src/App.jsx,
//     public/landing.html, landing.html, api/checklist.js must have a matching
//     entry in VERIFICATION_LOG.md (the citation identifier appears literally).
// Nonzero exit on any failure. Runs on pre-commit + GitHub Actions.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CITATION_FILES = ['src/App.jsx', 'public/landing.html', 'landing.html', 'api/checklist.js'];
const LOG = join(ROOT, 'VERIFICATION_LOG.md');

function fail(msg) { console.error('GATE RED — ' + msg); process.exit(1); }

// ── A1: required files ───────────────────────────────────────────────────────
for (const f of ['src/App.jsx', 'package.json']) if (!existsSync(join(ROOT, f))) fail('A1: missing ' + f);
try { JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')); } catch { fail('A1: package.json is not valid JSON'); }

// ── A9: citation-log parity ──────────────────────────────────────────────────
if (!existsSync(LOG)) fail('A9: VERIFICATION_LOG.md is missing');
const logNorm = readFileSync(LOG, 'utf8').replace(/\s+/g, '').toLowerCase();

let code = '';
for (const f of CITATION_FILES) { const p = join(ROOT, f); if (existsSync(p)) code += '\n' + readFileSync(p, 'utf8'); }

const tokens = new Set();
// section-symbol citations: §1954, §§5600-5615, §235-b, §92.0081, §27-2005 …
for (const m of code.matchAll(/§+\s*\d[0-9A-Za-z.\-]*/g)) {
  let t = m[0].replace(/\s+/g, '').replace(/[.\-]+$/, '');
  if (t.length > 1) tokens.add(t);
}
// CFR / U.S.C. citations: 42 U.S.C. §3604, 29 CFR §2560.503-1, 47 CFR §1.4000 …
for (const m of code.matchAll(/\b\d+\s+(?:U\.?\s?S\.?\s?C\.?|C?\.?\s?F\.?\s?R\.?)\s*§?\s*\d[0-9A-Za-z.\-]*/gi)) {
  tokens.add(m[0].replace(/\s+/g, ''));
}

const missing = [];
for (const t of tokens) if (!logNorm.includes(t.toLowerCase())) missing.push(t);

if (missing.length) {
  console.error('A9 FAIL — citations in code with no VERIFICATION_LOG.md entry (' + missing.length + '):');
  for (const m of [...missing].sort()) console.error('  ' + m);
  fail(missing.length + ' unlogged citation(s)');
}
// ── A10: citation lock (S7) + G4T test code (S6) ──────────────────────────────
import { execFileSync } from 'child_process';
const VC = join(ROOT, 'api', '_verified-citations.json');
const before = existsSync(VC) ? readFileSync(VC, 'utf8') : '';
try { execFileSync('node', ['scripts/build-verified-citations.mjs'], { cwd: ROOT, stdio: 'pipe' }); } catch (e) { fail('A10: build-verified-citations failed — ' + e.message); }
// the date stamp changes daily; compare everything else
const strip = s => s.replace(/"generated": "[^"]*"/, '');
if (strip(before) !== strip(readFileSync(VC, 'utf8'))) fail('A10: api/_verified-citations.json was stale (rebuilt now) — commit it');
try { execFileSync('node', ['scripts/test-citelock.mjs'], { cwd: ROOT, stdio: 'pipe' }); } catch (e) { fail('A10: citation-lock/G4T mock test failed\n' + (e.stdout || '') + (e.stderr || '')); }
// ── A11: auth gate — nothing reaches Anthropic without a passed Payhip (or G4T) check ──
import { readdirSync } from 'fs';
for (const f of ['api/generate.js', 'api/checklist.js']) {
  const src = readFileSync(join(ROOT, f), 'utf8');
  const a = src.indexOf('api.anthropic.com'), p = src.indexOf('await verifyLicense(');
  if (a === -1) continue;
  if (p === -1 || p > a) fail('A11: ' + f + ' reaches api.anthropic.com without a preceding await verifyLicense()');
}
const BYPASS = /SMOKE-TEST-\d|TEST_KEYS|ACCESS_CODES|SMOKE_KEY|BYPASS_KEY/i;
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (['node_modules', 'dist', '.git'].includes(e.name) ? [] : walk(join(d, e.name))) : [join(d, e.name)]);
for (const f of [...walk(join(ROOT, 'api')), ...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'scripts')), join(ROOT, 'vercel.json')].filter(f => existsSync(f) && /.(js|mjs|jsx|json)$/.test(f) && !f.endsWith('verify-gate.mjs') && !f.endsWith('test-auth-gate.mjs'))) {
  if (BYPASS.test(readFileSync(f, 'utf8'))) fail('A11: hard-coded bypass key / env bypass found in ' + f.slice(ROOT.length + 1));
}
try { execFileSync('node', ['scripts/test-auth-gate.mjs'], { cwd: ROOT, stdio: 'pipe' }); } catch (e) { fail('A11: auth-gate mock test failed\n' + (e.stdout || '') + (e.stderr || '')); }
// ── A13: no stale / unverifiable claim in sources or rendered pages ──
try { execFileSync('node', ['scripts/test-stale-claims.mjs'], { cwd: ROOT, stdio: 'pipe' }); } catch (e) { fail('A13: stale claims survive\n' + (e.stdout || '') + (e.stderr || '')); }
// ── A14: retrofit tests (Payhip contract, isCheckCall, extended citation lock, UI wiring) ──
for (const t of ['tests/payhip-mock.test.js', 'tests/isCheckCall.test.js', 'tests/citelock-extended.test.js', 'tests/pa-frame.test.js']) {
  try { execFileSync('node', [t], { cwd: ROOT, stdio: 'pipe' }); } catch (e) { fail('A14: ' + t + ' failed\n' + (e.stdout || '') + (e.stderr || '')); }
}
let ui = '';
try {
  execFileSync('node', ['node_modules/vite/bin/vite.js', 'build'], { cwd: ROOT, stdio: 'pipe' });
  ui = execFileSync('node', ['tests/ui-wiring.test.mjs'], { cwd: ROOT, stdio: 'pipe' }).toString().trim();
} catch (e) { fail('A14: ui-wiring failed\n' + (e.stdout || '') + (e.stderr || '')); }
console.log('A13 stale-claims clean; A14 payhip/isCheckCall/citelock-ext pass; ' + ui);
console.log('GATE GREEN — A1 files ok; A9 citation-log parity: all ' + tokens.size + ' citations logged; A10 citation lock + G4T mock test pass; A11 auth gate (no Anthropic without Payhip/G4T) pass.');
process.exit(0);
