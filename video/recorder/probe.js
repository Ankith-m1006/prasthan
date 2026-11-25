const { chromium } = require('C:/Users/ankit/hacktober-2026/hackathons/meta-vr-start-2026/spellwright/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  p.on('console', m => m.type()==='error' && console.log('CONSOLE', m.text()));
  await p.goto('https://prasthan-ten.vercel.app', { waitUntil: 'networkidle' });
  await p.waitForTimeout(6000);
  console.log((await p.innerText('body')).slice(0, 3000));
  await p.screenshot({ path: 'probe1.png' });
  await b.close();
})();
