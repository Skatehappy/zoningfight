// scripts/verify.mjs — GATE 1. Runs the thirteen headless sims (and the model
// guard) before any UI smoke testing. Exits nonzero if any sim fails.
//
// Each sim is standalone and exits nonzero on failure; this runner just
// sequences them and aggregates. Set SKIP_NETWORK=1 to skip sim-host-urls
// (used by the pre-commit hook; CI runs the full set).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const SIMS = [
  // T1 — redemption
  'sim-double-spend', 'sim-failure-releases', 'sim-ttl-reclaim',
  'sim-idempotent-retry', 'sim-commit-once',
  // T5 — lints / frames
  'sim-hardship-lint', 'sim-no-fabrication', 'sim-criteria-blank',
  'sim-frame-selection', 'sim-fl-sections', 'sim-generic-no-burden-shift',
  // T4 — caps
  'sim-input-caps',
  // host URLs (network)
  'sim-host-urls',
];

const skipNetwork = process.env.SKIP_NETWORK === '1';
const results = [];

function run(label, args) {
  const r = spawnSync('node', args, { cwd: root, encoding: 'utf8' });
  const passed = r.status === 0;
  process.stdout.write(`\n### ${label}\n${(r.stdout || '').trim()}\n`);
  if (r.stderr && r.stderr.trim()) process.stderr.write(`${r.stderr.trim()}\n`);
  results.push({ label, passed });
  return passed;
}

for (const sim of SIMS) {
  if (sim === 'sim-host-urls' && skipNetwork) {
    console.log(`\n### ${sim}\n  SKIPPED (SKIP_NETWORK=1)`);
    continue;
  }
  run(sim, ['--experimental-sqlite', '--no-warnings', join('sims', `${sim}.js`)]);
}

// Model guard (T7)
run('verify-model', ['--no-warnings', join('scripts', 'verify-model.mjs')]);

const failed = results.filter(r => !r.passed);
console.log('\n' + '='.repeat(54));
console.log(`GATE 1: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILED: ' + failed.map(f => f.label).join(', '));
  process.exit(1);
}
console.log('GATE 1: ALL GREEN');
