import { chromium } from 'playwright';
import { readFileSync, appendFileSync } from 'node:fs';
const log = (...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{appendFileSync('/tmp/oi.log',s+'\n');}catch{}};
const env=readFileSync('.env','utf8');
for(const l of env.split('\n')){const m=l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);if(m&&!(m[1]in process.env))process.env[m[1]]=m[2];}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 414, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(10000);
const errs = [];
page.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(`[${m.type()}] ${m.text().slice(0,400)}`); });
page.on('pageerror', e => errs.push(`[pageerror] ${e.message}`));

async function withTimeout(p, ms, label) {
  return await Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT ${label} after ${ms}ms`)), ms))
  ]);
}

log('login');
await page.goto('https://der-stern-dev.netlify.app/login', { waitUntil:'domcontentloaded' });
await page.locator('input[type="email"]').first().fill(process.env.TEST_EMAIL);
await page.locator('input[type="password"]').first().fill(process.env.TEST_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/\/dashboard/, { timeout:12000 }).catch(()=>{});
log('on', page.url());

log('goto /dashboard/orders');
await page.goto('https://der-stern-dev.netlify.app/dashboard/orders', { waitUntil:'domcontentloaded' });

// Take a baseline shot quickly
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/orders-3s.png', fullPage: true }).catch(()=>{});
log('shot /tmp/orders-3s.png at 3s');

// Quick liveness test: can JS still execute? (no DOM walking)
try {
  const live = await withTimeout(page.evaluate(() => Date.now()), 5000, 'evaluate Date.now');
  log('JS is alive, Date.now =', live);
} catch (e) { log('FROZEN JS:', e.message); }

// Targeted overlay scan: only z-index >= 40 elements (modal layer)
log('targeted overlay scan (z-index >= 40, fixed/absolute):');
try {
  const overlays = await withTimeout(page.evaluate(() => {
    const out = [];
    const candidates = document.querySelectorAll('div, aside, section');
    for (const el of candidates) {
      const cs = getComputedStyle(el);
      if (!['fixed','absolute'].includes(cs.position)) continue;
      const z = parseInt(cs.zIndex || '0', 10) || 0;
      if (z < 40) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 100 || r.height < 100) continue;
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 100),
        z, pe: cs.pointerEvents,
        w: Math.round(r.width), h: Math.round(r.height),
        x: Math.round(r.x), y: Math.round(r.y),
        text: (el.innerText || '').slice(0, 80).replace(/\s+/g, ' '),
      });
    }
    return out;
  }), 8000, 'overlay scan');
  log(`  found ${overlays.length}:`);
  overlays.forEach(o => log('   ', JSON.stringify(o)));
} catch (e) { log('  overlay scan failed:', e.message); }

// What's at the click target (the row for order 13758)?
log('what is on top of order 13758 row?');
try {
  const probe = await withTimeout(page.evaluate(() => {
    const row = Array.from(document.querySelectorAll('*')).find(el => (el.innerText||'').includes('13758'));
    if (!row) return { reason: 'no element containing 13758 found' };
    const r = row.getBoundingClientRect();
    const cx = r.x + r.width/2, cy = r.y + r.height/2;
    const top = document.elementFromPoint(cx, cy);
    return {
      rowTag: row.tagName.toLowerCase(),
      rowVisible: r.width > 0 && r.height > 0,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      topTag: top?.tagName?.toLowerCase(),
      topCls: (top?.className || '').toString().slice(0, 120),
      topMatchesRow: row === top || row.contains(top),
    };
  }), 8000, 'probe');
  log(' ', JSON.stringify(probe));
} catch (e) { log('  probe failed:', e.message); }

// Try clicking it
log('click order 13758:');
const before = page.url();
try {
  await withTimeout(page.locator('text="13758"').first().click({ timeout: 4000 }), 6000, 'click 13758');
  await page.waitForTimeout(2000);
  log('  url after click:', page.url(), '(was', before + ')');
} catch (e) { log('  click failed:', e.message); }

await page.screenshot({ path: '/tmp/orders-final.png', fullPage: true }).catch(()=>{});

log('--- console events (' + errs.length + ', last 25) ---');
errs.slice(-25).forEach(e => log(e));
await browser.close();
log('DONE');
