// Playwright UI wiring test (retrofit, gate A14): every visible button / nav control on each
// reachable screen is clicked in a fresh page; the run fails on ANY console error, page error or
// failed same-origin request other than the mocked API. /api/** is mocked, so no Payhip / Anthropic
// call is ever made. Playwright is resolved from PLAYWRIGHT_PATH or ../node_modules; if it is not
// installed the test prints SKIPPED and exits 0 (CI without browsers) unless REQUIRE_UI_TEST=1.
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const cands = [process.env.PLAYWRIGHT_PATH, join(ROOT, 'node_modules'), 'C:/Users/jakld/captainsdesk/node_modules'].filter(Boolean);
const base = cands.find(c => existsSync(join(c, 'playwright')));
if (!base) {
  if (process.env.REQUIRE_UI_TEST === '1') { console.error('ui-wiring: playwright not installed'); process.exit(1); }
  console.log('ui-wiring: SKIPPED (playwright not installed)'); process.exit(0);
}
const { chromium } = createRequire(join(base, 'x.js'))('playwright');
const { preview } = await import('vite');
if (!existsSync(join(ROOT, 'dist', 'index.html'))) { console.error('ui-wiring: run `vite build` first'); process.exit(1); }
const server = await preview({ root: ROOT, preview: { port: 4399, strictPort: true, host: '127.0.0.1' } });
const URL0 = 'http://127.0.0.1:4399/';
let browser;
try { browser = await chromium.launch({ channel: 'msedge' }); } catch { browser = await chromium.launch(); }
const errors = [];
let clicks = 0;
async function fresh(code) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 160)}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${String(e).slice(0, 160)}`));
  await page.route('**/api/**', route => {
    let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch {}
    const body = b.markUsed ? { ok: true } : b.systemPrompt === 'Reply: VALID' ? { text: 'VALID' }
      : route.request().url().includes('checklist') ? { checklist: ['Item one', 'Item two'] }
      : { text: 'Dear Board,\n\nMock letter body.' };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto(URL0, { waitUntil: 'networkidle' });
  return { ctx, page };
}
async function dismiss(page) {
  const g = page.getByRole('button', { name: /^Got it/ });
  if (await g.count()) { await g.first().click(); clicks++; await page.waitForTimeout(150); }
}
const labels = async page => (await page.$$eval('button, a[href], [role=button]', els => els.filter(e => e.offsetParent !== null).map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 60)).filter(Boolean)));
const seen = new Set();
// Screen 0: code gate. Screen 1+: after entering a code (mocked VALID).
for (const stage of ['gate', 'after-code']) {
  const { ctx, page } = await fresh();
  if (stage === 'after-code') {
    const inp = page.locator('input').first();
    await inp.fill('MOCK-CODE-0001');
    const btn = page.getByRole('button', { name: /verify|continue|enter|unlock|submit|check/i }).first();
    if (await btn.count()) await btn.click();
    await page.waitForTimeout(400);
  }
  await dismiss(page);
  const names = [...new Set(await labels(page))];
  await ctx.close();
  for (const name of names) {
    const key = stage + '|' + name; if (seen.has(key)) continue; seen.add(key);
    const { ctx: c2, page: p2 } = await fresh();
    if (stage === 'after-code') {
      await p2.locator('input').first().fill('MOCK-CODE-0001');
      const b = p2.getByRole('button', { name: /verify|continue|enter|unlock|submit|check/i }).first();
      if (await b.count()) await b.click();
      await p2.waitForTimeout(400);
    }
    await dismiss(p2);
    const target = p2.locator('button, a[href], [role=button]').filter({ hasText: name.split('\n')[0] }).first();
    if (await target.count()) {
      const href = await target.getAttribute('href').catch(() => null);
      if (!href || href.startsWith('#') || href.startsWith('/') && !href.startsWith('/api')) {
        try { await target.click({ timeout: 2000, noWaitAfter: true }); clicks++; await p2.waitForTimeout(250); await p2.keyboard.press('Escape'); } catch (e) { errors.push(`unclickable: ${name} (${String(e).split('\n')[0].slice(0, 80)})`); }
      }
    }
    await c2.close();
  }
}
await browser.close(); await server.close();
if (errors.length || clicks < 3) { console.error('ui-wiring FAIL (' + clicks + ' clicks)\n' + [...new Set(errors)].slice(0, 20).join('\n')); process.exit(1); }
console.log(`ui-wiring: ${clicks} controls clicked across ${seen.size} control/screens, zero console/page errors`);
process.exit(0);
