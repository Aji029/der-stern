import { chromium } from 'playwright';
import { readFileSync, appendFileSync } from 'node:fs';
const log = (...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{appendFileSync('/tmp/orders-shot.log',s+'\n');}catch{}};
const env=readFileSync('.env','utf8');
for(const l of env.split('\n')){const m=l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);if(m&&!(m[1]in process.env))process.env[m[1]]=m[2];}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(15000);
page.on('pageerror', e => log('[pageerror]', e.message));
page.on('console', m => { if (['error','warning'].includes(m.type())) log('['+m.type()+']', m.text().slice(0,400)); });

log('login');
await page.goto('https://der-stern-dev.netlify.app/login', { waitUntil: 'domcontentloaded' });
await page.locator('input[type="email"]').first().fill(process.env.TEST_EMAIL);
await page.locator('input[type="password"]').first().fill(process.env.TEST_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(()=>{});
log('on', page.url());

log('goto /dashboard/orders');
await page.goto('https://der-stern-dev.netlify.app/dashboard/orders', { waitUntil: 'domcontentloaded' });
// progressive screenshots so we always have SOMETHING captured even if we time out later
for (const t of [2, 6, 12, 20]) {
  await page.waitForTimeout((t - (t === 2 ? 0 : (t === 6 ? 2 : (t === 12 ? 6 : 12)))) * 1000);
  await page.screenshot({ path: `/tmp/orders-${t}s.png`, fullPage: true }).catch(e => log('shot err at ' + t + 's:', e.message));
  log(`captured /tmp/orders-${t}s.png at ~${t}s`);
}

const html = await page.content().catch(()=> '');
log('html length:', html.length);
log('first 800 chars of body:');
const bodyStart = html.indexOf('<body');
log(html.slice(bodyStart, bodyStart + 800));

await browser.close();
log('DONE');
