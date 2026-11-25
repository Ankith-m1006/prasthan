const { chromium } = require('C:/Users/ankit/hacktober-2026/hackathons/meta-vr-start-2026/spellwright/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 430, height: 932 } });
  p.on('console', m => m.type()==='error' && console.log('CONSOLE', m.text()));
  for (let i=0;i<4;i++){ try { await p.goto('https://prasthan-ten.vercel.app', { waitUntil: 'networkidle' }); await p.getByText('or type',{exact:true}).waitFor({timeout:15000}); break; } catch(e){ console.log('retry'); } }
  await p.getByText('or type', { exact: true }).click();
  await p.locator('text=/ಹುಬ್ಬಳ್ಳಿಗೆ ಊರಿಗೆ/').first().click();
  await p.getByText('Alert me when a new bus opens').click();
  await p.waitForTimeout(1000);
  await p.getByText('Partners', { exact: true }).click();
  await p.waitForTimeout(1000);
  console.log('---PARTNERS\n' + await p.innerText('body'));
  await p.getByText('Demo State RTC').first().click();
  await p.waitForTimeout(1500);
  console.log('---RTC\n' + await p.innerText('body'));
  await p.getByText('Add buses', { exact: true }).first().click();
  await p.waitForTimeout(800);
  console.log('---FORM\n' + await p.innerText('body'));
  await p.screenshot({ path: 'p3form.png' });
  await b.close();
})();
