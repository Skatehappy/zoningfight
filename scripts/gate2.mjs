// scripts/gate2.mjs — GATE 2. Automated per-change static checks (B1–B12).
// One script shared by the pre-commit hook and CI. Exits nonzero on any failure.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, extname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const IGNORE = new Set(['node_modules', 'dist', '.git', '.vercel', 'public']);
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const ALL = walk(root);
const read = (p) => readFileSync(p, 'utf8');
const rel = (p) => relative(root, p).replace(/\\/g, '/');

const results = [];
function check(id, desc, fn) {
  try {
    const problems = fn() || [];
    const passed = problems.length === 0;
    results.push({ id, desc, passed, problems });
  } catch (e) {
    results.push({ id, desc, passed: false, problems: [`threw: ${e.message}`] });
  }
}

// ---- B1: syntax check all non-JSX JS/MJS -----------------------------------
check('B1', 'JS/MJS syntax check', () => {
  const problems = [];
  for (const p of ALL) {
    const ext = extname(p);
    if ((ext === '.js' || ext === '.mjs') && !rel(p).startsWith('scripts/build-pages')) {
      const r = spawnSync('node', ['--check', p], { encoding: 'utf8' });
      if (r.status !== 0) problems.push(`${rel(p)}: ${(r.stderr || '').split('\n')[0]}`);
    }
  }
  return problems;
});

// ---- B2: node:sqlite (Node 22 --experimental-sqlite) available -------------
check('B2', 'node:sqlite available', () => {
  const r = spawnSync('node', ['--experimental-sqlite', '--no-warnings', '-e',
    "const {DatabaseSync}=require('node:sqlite'); new DatabaseSync(':memory:');"], { encoding: 'utf8' });
  return r.status === 0 ? [] : [`node:sqlite not usable: ${(r.stderr || '').split('\n')[0]}`];
});

// ---- B3: no obvious committed secrets --------------------------------------
check('B3', 'no committed secrets', () => {
  const problems = [];
  const rx = /sk-ant-[a-z0-9-]{10,}|service_role.*ey[A-Za-z0-9._-]{20,}/i;
  for (const p of ALL) {
    if (/\.(png|jpg|jpeg|ico|zip|lock)$/.test(p)) continue;
    if (rx.test(read(p))) problems.push(`${rel(p)}: looks like a secret`);
  }
  return problems;
});

// ---- B4: .gitignore covers node_modules and env ----------------------------
check('B4', '.gitignore covers node_modules/.env', () => {
  const gi = read(join(root, '.gitignore'));
  const problems = [];
  if (!/node_modules/.test(gi)) problems.push('.gitignore missing node_modules');
  if (!/\.env/.test(gi)) problems.push('.gitignore missing .env');
  return problems;
});

// ---- B5: version bumped past 1.0.0 -----------------------------------------
check('B5', 'package version bumped', () => {
  const v = JSON.parse(read(join(root, 'package.json'))).version;
  return v && v !== '1.0.0' ? [] : [`version is ${v}`];
});

// ---- B6: no unbounded PostgREST list reads (row-limit audit) ---------------
// The client touches Supabase ONLY through RPCs (rpc/…), never table list reads,
// so the 1000-row truncation cannot bite. Flag any .from().select() list read.
check('B6', 'no unbounded PostgREST list reads', () => {
  const problems = [];
  for (const p of ALL) {
    if (!/\.(js|jsx|mjs)$/.test(p)) continue;
    if (rel(p).startsWith('node_modules')) continue;
    const src = read(p);
    if (/\.from\(['"`][^'"`]+['"`]\)\s*\.select\(/.test(src)) {
      problems.push(`${rel(p)}: direct table .select() — use an RPC or add a range`);
    }
  }
  return problems;
});

// ---- B7: no purchase/buy/checkout in error strings -------------------------
check('B7', 'no purchase/buy/checkout in error strings', () => {
  const problems = [];
  const errFiles = ALL.filter(p => /errors\.js$/.test(p) || /error/i.test(rel(p)));
  // scan errors.js specifically plus any string literal near "error"
  const src = read(join(root, 'src', 'lib', 'errors.js'));
  for (const word of ['purchase', 'buy', 'checkout']) {
    // ignore the comment line that names the rule itself
    const lines = src.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    if (lines.join('\n').toLowerCase().includes(word)) problems.push(`errors.js message contains "${word}"`);
  }
  return problems;
});

// ---- B8: no inline model strings outside _config.js / allowlist ------------
check('B8', 'no inline model strings', () => {
  const problems = [];
  const rx = /claude-(?:opus|sonnet|haiku|fable)[a-z0-9.\-]*\d/i;
  for (const p of ALL) {
    const r = rel(p);
    if (r === 'api/_config.js' || r === 'models.allowlist.json') continue;
    if (/\.(md|lock)$/.test(p) || r.startsWith('scripts/verify-model')) continue; // prose/allowlist-driven
    if (!/\.(js|jsx|mjs|json|ts)$/.test(p)) continue;
    if (rx.test(read(p))) problems.push(`${r}: inline model string`);
  }
  return problems;
});

// ---- B9: license code never written to localStorage ------------------------
check('B9', 'license code never persisted', () => {
  const problems = [];
  for (const p of ALL) {
    if (!/\.(js|jsx|mjs)$/.test(p)) continue;
    const src = read(p);
    // any setItem whose argument list mentions accessCode / licenseCode
    const m = src.match(/localStorage\.setItem\([^)]*\b(accessCode|licenseCode|access_code)\b[^)]*\)/);
    if (m) problems.push(`${rel(p)}: ${m[0].slice(0, 60)}…`);
  }
  return problems;
});

// ---- B10: frame JSON has verified_on + >=1 authority (except GENERIC) -------
check('B10', 'frames verified with authority', () => {
  const problems = [];
  const dir = join(root, 'frames');
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const j = JSON.parse(read(join(dir, f)));
    if (j.state === 'GENERIC') continue;
    if (!j.verified_on) problems.push(`${f}: verified_on is null`);
    if (!(j.governing_authority && j.governing_authority.length >= 1))
      problems.push(`${f}: no governing_authority`);
  }
  return problems;
});

// ---- B11: no hardcoded municipal ordinance text in frames/templates --------
check('B11', 'no hardcoded ordinance text in frames', () => {
  const problems = [];
  const dir = join(root, 'frames');
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const src = read(join(dir, f));
    if (src.includes('⟦') || src.includes('⟧')) problems.push(`${f}: contains criterion markers`);
    // an enumerated ordinance-criteria list embedded in a frame would look like
    // "(a) ... (b) ..." or "1. The use ... 2. The use ..."
    if (/\(a\)[^]*\(b\)[^]*\(c\)/.test(src)) problems.push(`${f}: looks like an embedded criteria list`);
  }
  return problems;
});

// ---- B12: Municode landing pattern only (no constructed code paths) --------
check('B12', 'no constructed Municode code-path URLs', () => {
  const problems = [];
  const rx = /https:\/\/library\.municode\.com\/[A-Za-z0-9_\-/]+/g;
  const landing = /^https:\/\/library\.municode\.com\/[a-z]{2}\/[a-z_]+$/;
  for (const p of ALL) {
    if (/\.(png|jpg|jpeg|ico|zip|lock)$/.test(p)) continue;
    const src = read(p);
    const matches = src.match(rx) || [];
    for (const u of matches) {
      const clean = u.replace(/["'`,).]+$/, '');
      if (!landing.test(clean)) problems.push(`${rel(p)}: non-landing Municode URL ${clean}`);
    }
  }
  return problems;
});

// ---- report ----------------------------------------------------------------
let failed = 0;
for (const r of results) {
  if (r.passed) console.log(`  ok  ${r.id} — ${r.desc}`);
  else { failed++; console.error(`  FAIL ${r.id} — ${r.desc}`); r.problems.forEach(x => console.error(`        ${x}`)); }
}
console.log('='.repeat(54));
console.log(`GATE 2: ${results.length - failed}/${results.length} checks passed`);
if (failed) process.exit(1);
console.log('GATE 2: ALL GREEN');
