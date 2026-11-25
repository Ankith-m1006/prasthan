const { chromium, V } = require('./lib');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 430, height: 932 } });
  p.on('console', m => m.type() === 'error' && console.log('CONSOLE', m.text()));
  p.on('response', r => r.url().includes('prasthan-api') && console.log('API', r.status(), r.url().replace('https://prasthan-api.vercel.app', '')));
  for (let i = 0; i < 5; i++) { try { await p.goto('https://prasthan-ten.vercel.app', { waitUntil: 'networkidle', timeout: 45000 }); await p.getByText('Continue as guest').first().waitFor({ timeout: 20000 }); break; } catch { console.log('retry'); } }
  console.log('---WELCOME\n' + await p.innerText('body'));
  await V(p, 'Continue as guest').click(); await p.waitForTimeout(2000);
  console.log('---PROFILE\n' + await p.innerText('body'));
  await p.screenshot({ path: 'p5profile.png', fullPage: true });
  await b.close();
})();
