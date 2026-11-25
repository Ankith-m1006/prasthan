const { chromium } = require('C:/Users/ankit/hacktober-2026/hackathons/meta-vr-start-2026/spellwright/node_modules/playwright-core');
const V = (p, t, o={}) => p.getByText(t, o).locator('visible=true').first();
// scroll nearest vertical scroll container so element top sits at `margin` px from container top (smooth optional)
async function scrollTo(loc, margin = 16, smooth = false) {
  await loc.evaluate((e, [m, sm]) => {
    let a = e.parentElement;
    while (a && !(/(auto|scroll)/.test(getComputedStyle(a).overflowY) && a.scrollHeight > a.clientHeight)) a = a.parentElement;
    if (!a) return;
    const d = e.getBoundingClientRect().top - a.getBoundingClientRect().top - m;
    a.scrollBy({ top: d, behavior: sm ? 'smooth' : 'instant' });
  }, [margin, smooth]);
}
async function open(p, url = 'https://prasthan-ten.vercel.app') {
  for (let i = 0; i < 6; i++) {
    try { await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); await p.getByText('or type', { exact: true }).waitFor({ timeout: 15000 }); return; }
    catch (e) { console.log('retry', i); }
  }
  throw new Error('site did not load');
}
module.exports = { chromium, V, scrollTo, open };
