// sim-host-urls.js
// Every landing_url in hosts/code-hosts.json resolves 200. A dead link on a
// paid product is worse than a search box, so the registry must stay clean.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ok, eq, pass } from './_assert.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const hosts = JSON.parse(readFileSync(join(here, '..', 'hosts', 'code-hosts.json'), 'utf8'));

const urls = [];
for (const [state, munis] of Object.entries(hosts)) {
  if (state.startsWith('_')) continue;
  for (const [slug, entry] of Object.entries(munis)) {
    if (entry && entry.landing_url) urls.push(`${state}/${slug} -> ${entry.landing_url}`);
  }
}
ok(urls.length > 0, `registry has ${urls.length} landing URLs to check`);

let failures = 0;
for (const u of urls) {
  const url = u.split(' -> ')[1];
  // Municode: enforce landing-page pattern only (no constructed code paths).
  ok(/^https:\/\/library\.municode\.com\/[a-z]{2}\/[a-z_]+$/.test(url) || !url.includes('municode'),
     `${u} is a Municode landing page (no code path)`);
  let code = 0;
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'Mozilla/5.0 (ZoningFight sim)' } });
    code = res.status;
  } catch (e) {
    code = -1;
  }
  if (code === 200) { console.log(`  ok: 200 ${u}`); }
  else { console.error(`  FAIL: ${code} ${u}`); failures += 1; }
}
eq(failures, 0, 'all landing URLs resolve 200');

pass('sim-host-urls');
