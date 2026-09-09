// scripts/verify-frames.mjs — Gate for the state-frame backfill (§5 + §8).
// Scans frames/*.json. Exits nonzero on any hard fail.
import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HARDSHIP_PHRASES } from './frame-templates.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const framesDir = join(here, '..', 'frames');
const BURDENS = new Set(['applicant_carries', 'prima_facie_shifting', 'criteria_compliance']);

const CITE_RE = /\d+\s+[A-Za-z.][A-Za-z. \d]*\s+\d+|§|Stat\.|Code|Laws|Ann\.|Rev\./; // reporter or statute
const ORDINANCE_SECTION_RE = /\bSection\s+\d+[-.]\d+|\bSec\.\s*\d+[-.]\d+/i;          // local ordinance section
const ENUM_CRITERIA_RE = /\([a-z]\)[\s\S]{0,400}\([a-z]\)[\s\S]{0,400}\([a-z]\)/;     // (a)…(b)…(c)

let fails = 0, frames = 0, flagged = 0, generic = 0;
const fail = (f, msg) => { fails++; console.error(`  FAIL [${f}] ${msg}`); };

function checkStructure(f, j) {
  for (const k of ['state', 'application_type', 'terminology_default', 'terminology_options', 'burden',
                   'governing_authority', 'section_order', 'sections', 'forbidden_phrases', 'record_preservation']) {
    if (!(k in j)) { fail(f, `missing field: ${k}`); return false; }
  }
  if (!Array.isArray(j.terminology_options)) fail(f, 'terminology_options not array');
  if (!Array.isArray(j.governing_authority)) fail(f, 'governing_authority not array');
  if (!Array.isArray(j.section_order)) fail(f, 'section_order not array');
  if (typeof j.record_preservation !== 'boolean') fail(f, 'record_preservation not boolean');
  for (const key of j.section_order || []) {
    const s = j.sections?.[key];
    if (!s || !s.title || !s.instruction) fail(f, `section "${key}" missing title/instruction`);
  }
  return true;
}

for (const file of readdirSync(framesDir).filter(x => x.endsWith('.json'))) {
  const raw = readFileSync(join(framesDir, file), 'utf8');
  let j;
  try { j = JSON.parse(raw); } catch { fail(file, 'invalid JSON'); continue; }

  // GENERIC (§8.5)
  if (j.state === 'GENERIC') {
    generic++;
    if (j.burden === 'prima_facie_shifting') fail(file, 'GENERIC asserts a burden shift');
    if ((j.governing_authority || []).length) fail(file, 'GENERIC carries citations');
    if (j.section_order.includes('burden_allocation') || j.section_order.includes('both_prongs'))
      fail(file, 'GENERIC has burden-shift sections');
    continue;
  }

  frames++;
  if (!checkStructure(file, j)) continue;
  if (j.validation_status === 'flagged') flagged++;

  // state match (§5)
  const abbrFromName = file.split('-')[0];
  if (j.state !== abbrFromName) fail(file, `state "${j.state}" != filename "${abbrFromName}"`);

  // burden enumeration (§5)
  if (!BURDENS.has(j.burden)) fail(file, `invalid burden "${j.burden}"`);

  // burden-shift skepticism (§5 / §8.3)
  if (j.burden === 'prima_facie_shifting' && (j.governing_authority || []).length < 1)
    fail(file, 'prima_facie_shifting with zero citations');

  // citation format (§5)
  for (const a of j.governing_authority || []) {
    if (!a.cite || !CITE_RE.test(a.cite)) fail(file, `unparseable citation: ${a.cite || '(empty)'}`);
    if (!a.proposition) fail(file, 'citation missing proposition');
  }

  // forbidden-phrase sanity (§5) — special_exception must ban hardship terms
  if (j.application_type === 'special_exception') {
    for (const p of HARDSHIP_PHRASES) if (!j.forbidden_phrases.includes(p)) fail(file, `forbidden_phrases missing "${p}"`);
  }

  // no municipal content (§5 / §8.4) — scan everything EXCEPT governing_authority
  const nonCite = JSON.stringify({ ...j, governing_authority: [] });
  if (ORDINANCE_SECTION_RE.test(nonCite)) fail(file, 'contains a local ordinance section number');
  if (ENUM_CRITERIA_RE.test(nonCite)) fail(file, 'contains an enumerated local criteria list');
  if (nonCite.includes('⟦') || nonCite.includes('⟧')) fail(file, 'contains criterion markers');
}

// FL frozen byte-identical (§8.6)
const flDiff = spawnSync('git', ['diff', '--quiet', '1cd2287', '--', 'frames/FL-special-exception.json', 'frames/FL-variance.json'],
  { cwd: join(here, '..') });
if (flDiff.status !== 0) fail('FL', 'FL frames differ from frozen commit 1cd2287');
else console.log('  ok: FL frames byte-identical to 1cd2287');

console.log('='.repeat(54));
console.log(`state frames: ${frames} | flagged: ${flagged} | generic: ${generic}`);
if (fails) { console.error(`GATE: ${fails} FAILURE(S)`); process.exit(1); }
console.log('GATE: ALL GREEN');
