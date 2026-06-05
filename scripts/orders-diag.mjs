import { chromium } from 'playwright';
import { readFileSync, appendFileSync } from 'node:fs';

const LOG = '/tmp/orders-diag.log';
const log = (...a) => { const s = a.map(x => typeof x==='string' ? x : JSON.stringify(x)).join(' '); console.log(s); try{ appendFileSync(LOG, s+'\n'); }catch{} };

const env = readFileSync('.env','utf8');
for (const l of env.split('\n')) { const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]; }

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();
page.setDefaultTimeout(15000);

const consoleEvents = [];
const failedReqs = [];
const supabaseReqs = [];
page.on('console', m => { if (['error','warning','log'].includes(m.type())) consoleEvents.push(`[${m.type()}] ${m.text().slice(0,500)}`); });
page.on('pageerror', err => consoleEvents.push(`[pageerror] ${err.message}`));
page.on('request', r => { if (r.url().includes('supabase')) supabaseReqs.push(`-> ${r.method()} ${r.url().slice(0,150)}`); });
page.on('response', async r => {
  const url = r.url();
  if (url.includes('supabase')) supabaseReqs.push(`<- ${r.status()} ${url.slice(0,150)}`);
  if (r.status() >= 400) {
    let body=''; try { body = (await r.text()).slice(0,200); } catch {}
    failedReqs.push(`${r.status()} ${url.slice(0,150)}  ${body}`);
  }
});

try {
  log('-- login --');
  await page.goto('https://der-stern-dev.netlify.app/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('input[type="email"]').first().fill(process.env.TEST_EMAIL);
  await page.locator('input[type="password"]').first().fill(process.env.TEST_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(()=>{ log('  no /dashboard within 15s — url=', page.url()); });
  log('  logged in, url=', page.url());

  log('-- goto /dashboard/orders --');
  await page.goto('https://der-stern-dev.netlify.app/dashboard/orders', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => log('  goto err:', e.message));
  log('  arrived at', page.url(), ' — waiting 15s for content...');
  await page.waitForTimeout(15000);

  const text = (await page.locator('body').innerText().catch(()=>'')) ?? '';
  log('--- visible body text on /dashboard/orders ---');
  log(text.slice(0, 1500) || '(empty body!)');
  log('--- end ---');
  log('  page title:', await page.title());

  await page.screenshot({ path: '/tmp/orders.png', fullPage: true }).catch(e => log('screenshot err', e.message));
  log('  screenshot saved /tmp/orders.png');
} catch (e) { log('FATAL', e.message); }

log('--- Supabase requests (' + supabaseReqs.length + ') ---');
supabaseReqs.slice(-30).forEach(r => log(r));
log('--- console events (' + consoleEvents.length + ') ---');
consoleEvents.slice(-25).forEach(e => log(e));
log('--- failed HTTP (' + failedReqs.length + ') ---');
failedReqs.forEach(r => log(r));

await browser.close();
log('DONE');
