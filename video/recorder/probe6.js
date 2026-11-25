const { chromium, V } = require('./lib');
const KN = 'ಸಂಕ್ರಾಂತಿಗೆ ಹುಬ್ಬಳ್ಳಿಗೆ ಊರಿಗೆ ಹೋಗ್ತಾ ಇದ್ದೀನಿ, ಗುರುವಾರ ರಾತ್ರಿ, ಬಸ್ಸಲ್ಲಿ, ಇಬ್ರು';
const last = (t, k) => t.slice(Math.max(0, t.lastIndexOf(k)));
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 430, height: 932 } });
  p.on('console', m => m.type() === 'error' && console.log('CONSOLE', m.text()));
  p.on('response', r => r.url().includes('prasthan-api') && !r.url().includes('alerts?') && console.log('API', r.status(), r.url().replace('https://prasthan-api.vercel.app', '')));
  for (let i = 0; i < 5; i++) { try { await p.goto('https://prasthan-ten.vercel.app', { waitUntil: 'networkidle', timeout: 45000 }); await p.getByText('Continue as guest').first().waitFor({ timeout: 20000 }); break; } catch { console.log('retry'); } }
  await V(p, 'Continue as guest').click(); await p.waitForTimeout(1500);
  await p.locator('input:visible').first().fill('Manjunath');
  for (const c of ['ಕನ್ನಡ', 'Karnataka', 'Hubballi', 'Bus', 'Majestic', 'Family']) { await V(p, c, { exact: true }).click(); await p.waitForTimeout(300); }
  await V(p, 'Save and start').click(); await p.waitForTimeout(2500);
  let t = await p.innerText('body'); console.log('---SPEAK\n' + t);
  await V(p, 'or type', { exact: true }).click(); await p.waitForTimeout(500);
  await p.locator('input:visible, textarea:visible').first().fill(KN);
  const t0 = Date.now();
  await V(p, 'Send', { exact: true }).click();
  await V(p, /^You said:/).waitFor({ timeout: 40000 }); console.log('reply after', Date.now() - t0);
  await p.waitForTimeout(8000);
  t = await p.innerText('body'); console.log('---CARD\n' + last(t, 'You said:'));
  const links = await p.$$eval('a', as => as.map(a => a.href)); console.log('LINKS', links.filter(h => /redbus/i.test(h)));
  await V(p, 'Alert me when a new bus opens').click(); await p.waitForTimeout(3000);
  await V(p, 'Partners', { exact: true }).click(); await p.waitForTimeout(1500);
  await V(p, 'Demo State RTC').click(); await p.waitForTimeout(4000);
  await V(p, 'Add buses', { exact: true }).click(); await p.waitForTimeout(800);
  t = await p.innerText('body'); console.log('---FORM\n' + last(t, 'Add buses:').slice(0, 400));
  await V(p, /^Add \d+ buses$/).click(); await p.waitForTimeout(5000);
  t = await p.innerText('body'); console.log('---NOTIFIED\n' + (t.match(/.*notified.*/g) || []).join('\n'));
  await V(p, 'Alerts', { exact: true }).click(); await p.waitForTimeout(4000);
  t = await p.innerText('body'); console.log('---ALERTS\n' + last(t, 'New buses, special').slice(0, 800));
  await V(p, 'About', { exact: true }).click(); await p.waitForTimeout(2500);
  t = await p.innerText('body'); console.log('---ABOUT\n' + last(t, 'Your festival trip home, in your own language').slice(0, 1800));
  await p.screenshot({ path: 'p6about.png' });
  await b.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
