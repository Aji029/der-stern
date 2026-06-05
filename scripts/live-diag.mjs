import { chromium } from 'playwright';
import { readFileSync, appendFileSync } from 'node:fs';

const LOG = '/tmp/live-diag.log';
function log(...args) {
  const line = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  console.log(line);
  try { appendFileSync(LOG, line + '\n'); } catch {}
}

const env = readFileSync('.env','utf8');
for (const l of env.split('\n')){
  const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();
page.setDefaultTimeout(12000);

const consoleEvents = [];
const failedReqs = [];
page.on('console', m => { if (['error','warning'].includes(m.type())) consoleEvents.push(`[${m.type()}] ${m.text().slice(0,400)}`); });
page.on('pageerror', err => consoleEvents.push(`[pageerror] ${err.message}`));
page.on('response', async r => {
  if (r.status() >= 400 && (r.url().includes('supabase') || r.url().includes('netlify.app'))) {
    let body=''; try { body = (await r.text()).slice(0,200); } catch {}
    failedReqs.push(`${r.status()} ${r.url().slice(0,140)}  ${body}`);
  }
});

try {
  log('1) login');
  await page.goto('https://der-stern-dev.netlify.app/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
  log('   loaded login page url=', page.url());
  await page.locator('input[type="email"]').first().fill(process.env.TEST_EMAIL);
  await page.locator('input[type="password"]').first().fill(process.env.TEST_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 12000 }).catch(()=>{ log('   no dashboard URL within 12s'); });
  log('   after login url=', page.url());

  log('2) goto /dashboard/orders');
  await page.goto('https://der-stern-dev.netlify.app/dashboard/orders', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => log('   goto err', e.message));
  await page.waitForTimeout(5000);
  log('   url=', page.url());
  const t1 = (await page.locator('body').innerText().catch(()=>'')).slice(0, 500);
  log('   visible text (500):', t1);
  await page.screenshot({ path:'/tmp/orders.png', fullPage:true }).catch(()=>{});

  log('3) goto /dashboard/todays-pick');
  await page.goto('https://der-stern-dev.netlify.app/dashboard/todays-pick', { waitUntil:'domcontentloaded', timeout:15000 }).catch(e=>log('   goto err', e.message));
  await page.waitForTimeout(4000);
  log('   url=', page.url());
  const t2 = (await page.locator('body').innerText().catch(()=>'')).slice(0, 400);
  log('   visible text (400):', t2);
  await page.screenshot({ path:'/tmp/todays-pick.png', fullPage:true }).catch(()=>{});
} catch (e) {
  log('FATAL', e.message);
}

log('--- console (' + consoleEvents.length + ', last 25) ---');
consoleEvents.slice(-25).forEach(e => log(e));
log('--- failed HTTP (' + failedReqs.length + ') ---');
failedReqs.forEach(r => log(r));

await browser.close();
log('DONE');
