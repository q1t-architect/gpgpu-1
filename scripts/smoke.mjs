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

await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
// Wait for canvas to appear.
await page.waitForSelector('canvas', { timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scripts/smoke-top.png', fullPage: false });

// Scroll to ~50% (recognition / acronym range).
const totalScroll = await page.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight,
);
await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), totalScroll * 0.5);
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/smoke-mid.png', fullPage: false });

// Scroll near end (brand reveal).
await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), totalScroll * 0.97);
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/smoke-end.png', fullPage: false });

await browser.close();

console.log('--- console (last 30) ---');
for (const l of logs.slice(-30)) console.log(l);
console.log('--- errors ---');
for (const e of errs) console.log(e);
process.exit(errs.length ? 1 : 0);
