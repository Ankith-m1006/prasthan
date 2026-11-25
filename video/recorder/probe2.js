const { chromium } = require('C:/Users/ankit/hacktober-2026/hackathons/meta-vr-start-2026/spellwright/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 430, height: 932 } });
  p.on('console', m => m.type()==='error' && console.log('CONSOLE', m.text()));
  for (let i=0;i<4;i++){ try { await p.goto('https://prasthan-ten.vercel.app', { waitUntil: 'networkidle' }); await p.getByText('or type',{exact:true}).waitFor({timeout:15000}); break; } catch(e){ console.log('retry', e.message.slice(0,80)); } }
  await p.getByText('or type', { exact: true }).click();
  await p.waitForTimeout(800);
  console.log('---TYPE\n' + await p.innerText('body'));
  await p.screenshot({ path: 'p2a.png' });
  // click first Kannada sample chip
  const chips = p.locator('text=/ಹುಬ್ಬಳ್ಳಿ/');
  console.log('kn chips', await chips.count());
  await chips.first().click();
  await p.waitForTimeout(2500);
  console.log('---CARD\n' + await p.innerText('body'));
  await p.screenshot({ path: 'p2b.png' });
  await b.close();
})();
