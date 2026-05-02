// Headless smoke test: launch chromium, load /gpgpu-1/, scroll through the
// page, capture console errors and a screenshot. Used during development to
// catch runtime issues without a real browser.

import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;

const URL = process.env.SMOKE_URL ?? 'http://127.0.0.1:4173/gpgpu-1/';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const logs = [];
const errs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message}`));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('h1', { timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scripts/smoke-top.png', fullPage: false });

// scroll into transformer block sections
await page.evaluate(() => {
  document.getElementById('rope')?.scrollIntoView({ block: 'start', behavior: 'instant' });
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'scripts/smoke-rope.png', fullPage: false });

await page.evaluate(() => {
  document.getElementById('logit-lens')?.scrollIntoView({ block: 'start', behavior: 'instant' });
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'scripts/smoke-lens.png', fullPage: false });

await page.evaluate(() => {
  document.getElementById('summary')?.scrollIntoView({ block: 'start', behavior: 'instant' });
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'scripts/smoke-summary.png', fullPage: false });

// also test mobile viewport
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.screenshot({ path: 'scripts/smoke-mobile.png', fullPage: false });

// theme toggle
const toggleSelector = '.theme-toggle';
const toggle = await page.$(toggleSelector);
if (toggle) {
  await toggle.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scripts/smoke-mobile-dark.png', fullPage: false });
}

await browser.close();

console.log('--- console (last 30) ---');
for (const l of logs.slice(-30)) console.log(l);
console.log('--- errors ---');
for (const e of errs) console.log(e);
process.exit(errs.length ? 1 : 0);
