// Launch Chromium with web security disabled so the sandbox's broken CORS path
// doesn't trip the page. This lets us reach a real, interactive state on
// /dashboard/orders and observe what the page does after data is loaded.
import { chromium } from 'playwright';
import { readFileSync, appendFileSync } from 'node:fs';
const log = (...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{appendFileSync('/tmp/cors-off.log',s+'\n');}catch{}};
const env=readFileSync('.env','utf8');
for(const l of env.split('\n')){const m=l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);if(m&&!(m[1]in process.env))process.env[m[1]]=m[2];}

const browser = await chromium.launch({
  headless: true,
  args: [
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process,BlockInsecurePrivateNetworkRequests',
    '--no-sandbox',
  ],
});
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  bypassCSP: true,
  viewport: { width: 414, height: 900 },
});
const page = await ctx.newPage();
page.setDefaultTimeout(15000);
const errs = [];
page.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(`[${m.type()}] ${m.text().slice(0,400)}`); });
page.on('pageerror', e => errs.push(`[pageerror] ${e.message}`));

async function withTimeout(p, ms, label) {
  return await Promise.race([
    p, new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT ${label} @ ${ms}ms`)), ms))
  ]);
}

log('login');
await page.goto('https://der-stern-dev.netlify.app/login', { waitUntil:'domcontentloaded' });
await page.locator('input[type="email"]').first().fill(process.env.TEST_EMAIL);
await page.locator('input[type="password"]').first().fill(process.env.TEST_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/\/dashboard/, { timeout:15000 }).catch(()=>{});
log('on', page.url());

log('goto /dashboard/orders');
await page.goto('https://der-stern-dev.netlify.app/dashboard/orders', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(6000);

// JS liveness
try {
  const t = await withTimeout(page.evaluate(() => Date.now()), 4000, 'evaluate Date.now');
  log('JS alive:', t);
} catch (e) { log('FROZEN JS:', e.message); }

// Visible text — confirms data arrived
try {
  const txt = await withTimeout(page.locator('body').innerText().catch(()=>''), 5000, 'innerText');
  log('--- visible text (first 800) ---');
  log(txt.slice(0, 800));
  log('--- end ---');
} catch (e) { log('innerText err:', e.message); }

await page.screenshot({ path:'/tmp/orders-cors-off-1.png', fullPage:true }).catch(()=>{});
log('shot /tmp/orders-cors-off-1.png');

// Overlay scan
try {
  const overlays = await withTimeout(page.evaluate(() => {
    const out = [];
    const els = document.querySelectorAll('div, aside, section, nav');
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (!['fixed','absolute'].includes(cs.position)) continue;
      const z = parseInt(cs.zIndex || '0', 10) || 0;
      if (z < 10) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 300 || r.height < 300) continue;
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className||'').toString().slice(0,90),
        z, pos: cs.position, pe: cs.pointerEvents, vis: cs.visibility,
        rect: { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) },
        txt: (el.innerText||'').slice(0,80).replace(/\s+/g,' '),
      });
    }
    return out;
  }), 8000, 'overlay scan');
  log('overlay candidates:', overlays.length);
  overlays.forEach(o => log(' ', JSON.stringify(o)));
} catch (e) { log('overlay scan err:', e.message); }

// Click an order
log('attempting to click order 13758');
const before = page.url();
try {
  await withTimeout(page.locator('text="13758"').first().click({ timeout: 4000 }), 6000, 'click 13758');
  await page.waitForTimeout(3000);
  log('  after click url=', page.url(), '(was', before + ')');
} catch (e) { log('  click err:', e.message); }
await page.screenshot({ path:'/tmp/orders-cors-off-2.png', fullPage:true }).catch(()=>{});

// Click Create Order
log('attempting to click Create Order');
try {
  await withTimeout(page.locator('button:has-text("Create Order")').first().click({ timeout: 4000 }), 6000, 'click create');
  await page.waitForTimeout(3000);
  log('  after click url=', page.url());
} catch (e) { log('  click err:', e.message); }
await page.screenshot({ path:'/tmp/orders-cors-off-3.png', fullPage:true }).catch(()=>{});

log('--- console (' + errs.length + ') ---');
errs.slice(-30).forEach(e => log(e));
await browser.close();
log('DONE');
