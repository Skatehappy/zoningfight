// npm test runner: runs every offline test script as a child process, prints pass/fail counts, exits 1 on any failure.
// Excluded (live network): scripts/acceptance-test.mjs, scripts/smoke-ai.mjs.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const suites = [
  'scripts/verify-frames.mjs', 'scripts/test-citelock.mjs', 'scripts/test-auth-gate.mjs',
  'scripts/test-stale-claims.mjs', 'scripts/test-strict-coverage.mjs', 'scripts/test-verified-dates.mjs', 'scripts/check-banned-claims.mjs',
  ...readdirSync(root + 'tests').filter(f => /\.test\.m?js$/.test(f)).sort().map(f => 'tests/' + f),
];
let pass = 0; const failed = [];
for (const s of suites) {
  const r = spawnSync(process.execPath, [s], { cwd: root, encoding: 'utf8', env: { ...process.env, REQUIRE_UI_TEST: process.env.REQUIRE_UI_TEST || '' } });
  const ok = r.status === 0; ok ? pass++ : failed.push(s);
  console.log((ok ? 'PASS ' : 'FAIL ') + s);
  if (!ok) console.log(((r.stdout || '') + (r.stderr || '')).split('\n').slice(-25).join('\n'));
}
console.log(`\n${pass} passed, ${failed.length} failed, ${suites.length} total`);
process.exit(failed.length ? 1 : 0);
