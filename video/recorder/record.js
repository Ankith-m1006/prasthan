const fs = require('fs'), path = require('path');
const { chromium } = require('./lib');
const OUT = path.join(__dirname, 'frames'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
const KN = 'ಸಂಕ್ರಾಂತಿಗೆ ಹುಬ್ಬಳ್ಳಿಗೆ ಊರಿಗೆ ಹೋಗ್ತಾ ಇದ್ದೀನಿ, ಗುರುವಾರ ರಾತ್ರಿ, ಬಸ್ಸಲ್ಲಿ, ಇಬ್ರು';
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', m => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 200)));
  p.on('response', r => r.url().includes('prasthan-api') && !r.url().includes('alerts?') && console.log('API', r.status(), r.url().replace('https://prasthan-api.vercel.app', '').slice(0, 80)));
  await p.goto('file:///' + path.join(__dirname, 'stage.html').replace(/\\/g, '/'));
  await p.evaluate(() => ov('titlecard', true));
  let f;
  for (let i = 0; i < 6; i++) {
    await p.evaluate(() => { document.getElementById('app').src = 'https://prasthan-ten.vercel.app/?r=' + Date.now(); });
    await p.waitForTimeout(1500);
    f = p.frameLocator('#app');
    try { await f.getByText('Continue as guest').locator('visible=true').first().waitFor({ timeout: 30000 }); break; } catch { console.log('retry iframe', i); }
  }
  await p.waitForTimeout(3000);
  const V = (t, o = {}) => f.getByText(t, o).locator('visible=true').first();
  const sleep = ms => p.waitForTimeout(ms);
  const tap = async (loc) => {
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    const bb = await loc.boundingBox();
    if (bb) await p.evaluate(([x, y]) => tap(x, y), [bb.x + bb.width / 2, bb.y + bb.height / 2]);
    await sleep(280); await loc.click();
  };
  const scroll = async (loc, margin = 16) => {
    await loc.evaluate((e, m) => {
      let a = e.parentElement;
      while (a && !(/(auto|scroll)/.test(getComputedStyle(a).overflowY) && a.scrollHeight > a.clientHeight)) a = a.parentElement;
      if (!a) return;
      a.scrollBy({ top: e.getBoundingClientRect().top - a.getBoundingClientRect().top - m, behavior: 'smooth' });
    }, margin);
    await sleep(1100);
  };
  const cap = (...a) => p.evaluate(a => cap(...a), a);
  const card = (...a) => p.evaluate(a => { card(...a); ov('card', true); }, a);

  const cdp = await p.context().newCDPSession(p);
  let n = 0; const idx = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const name = `f${String(n++).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(OUT, name), Buffer.from(data, 'base64'));
    idx.push([name, metadata.timestamp]);
    try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  const marks = []; const t0 = Date.now(); const mark = s => { marks.push([s, (Date.now() - t0) / 1000]); console.log('mark', s, ((Date.now() - t0) / 1000).toFixed(1)); };

  mark('title'); await sleep(6000);
  // 1 welcome
  await cap('1 / First launch', 'Continue as guest', 'No sign-up, no OTP. The profile is saved only on this phone; operators only ever see totals.', '');
  await p.evaluate(() => ov('titlecard', false)); mark('welcome'); await sleep(4500);
  await tap(V('Continue as guest')); await sleep(1500);
  // 2 profile
  await cap('2 / One-screen profile', 'Tell us your trip home once', 'Manjunath: replies in Kannada, home Hubballi (Karnataka), boards at Majestic, goes by bus with family. These become Flagsmith traits, so his flags follow his region and language.', '');
  mark('profile');
  const name = f.locator('input:visible').first();
  await tap(name); await p.keyboard.type('Manjunath', { delay: 70 }); await sleep(500);
  for (const c of ['ಕನ್ನಡ', 'Karnataka', 'Hubballi', 'Bus', 'Majestic', 'Family']) { await tap(V(c, { exact: true })); await sleep(650); }
  await sleep(800);
  await tap(V('Save and start')); await sleep(2500);
  // 3 speak
  await cap('3 / Speak', 'Say the trip home, in Kannada', 'Hold the mic and Sarvam speech-to-text hears Kannada. In this take we type the same sentence, so speech-to-text is not used here.', '');
  mark('speak'); await sleep(3500);
  await tap(V('or type', { exact: true })); await sleep(900);
  const input = f.locator('input:visible, textarea:visible').first();
  await tap(input); await sleep(300);
  await p.keyboard.type(KN, { delay: 50 }); await sleep(800);
  await tap(V('Send', { exact: true }));
  await V(/^You said:/).waitFor({ timeout: 45000 }); await sleep(1200);
  await V('hide typing', { exact: true }).click().catch(() => {}); await sleep(500);
  // 4 card
  await cap('4 / Trip card', 'Understood, answered in Kannada', 'Bengaluru -> Hubballi, Thu 14 Jan, night, bus, 2 people. The Kannada reply is spoken with live Sarvam text-to-speech ("reply: live voice"). Every field is one tap to fix.', 'Trip parsing here is the rule parser ("understanding: rules"). This video has no audio.');
  mark('card'); await scroll(V(/^You said:/), 40); await sleep(8000);
  await scroll(V('How', { exact: true }), 60); await sleep(2500);
  // 5 warnings
  await cap('5 / Heads up', 'Rush night and tout warning', '14 Jan is a rush night: book early, private fares jump. Book only on official apps or counters; never pay an agent outside the bus stand.', 'Demand numbers (2,400 want, 880 seats) are seeded demo data.');
  mark('warn'); await scroll(V('HEADS UP', { exact: true }), 30); await sleep(6500);
  // 6 links
  await cap('6 / Official links', 'Straight to the official sites', 'redBus opens the BLR -> Hubballi route page. KSRTC, AbhiBus, Zingbus, FlixBus open their official sites. No prices, no ranking, no scraping, no tickets sold here.', '');
  mark('links'); await scroll(V('Book on the official sites', { exact: true }), 20); await sleep(6000);
  // 7 alert me
  await cap('7 / Alert me', 'Tell me when a new bus opens', 'One tap saves the trip on the api. The diya lights up and the reply confirms in Kannada.', '');
  mark('alertme'); await scroll(V('Alert me when a new bus opens'), 420); await sleep(1200);
  await tap(V('Alert me when a new bus opens'));
  await V('Alert is on', { exact: true }).waitFor({ timeout: 30000 }).catch(() => console.log('alert-on not seen'));
  await sleep(4000);
  // 8 partners
  await cap('8 / Bus operator', 'The buses that are missing', 'Demo State RTC sees one demand board: BLR -> Hubballi, Thu 14 Jan, night. 2,400 want, 880 seats, gap 1,520: add 38 buses.', 'Seeded demo data: operators, routes and demand are invented.');
  mark('partners'); await tap(V('Partners', { exact: true })); await sleep(1500);
  await tap(V('Demo State RTC'));
  await V(/^BLR -> Hubballi/).waitFor({ timeout: 40000 }); await sleep(800);
  await scroll(V(/^BLR -> Hubballi/), 30); await sleep(5500);
  // 9 add
  await cap('9 / Add buses', 'Operator adds 6 buses', '6 buses, 22:30, from Majestic. Every waiting traveller gets an alert in their own language.', '');
  mark('add'); await tap(V('Add buses', { exact: true })); await sleep(1500);
  for (const c of ['6', '22:30', 'MAJESTIC']) { await tap(V(c, { exact: true })); await sleep(700); }
  await sleep(1000);
  await tap(V(/^Add 6 buses$/));
  const toast = V(/waiting travellers notified/);
  await toast.waitFor({ timeout: 40000 });
  const toastText = await toast.innerText(); console.log('TOAST', toastText);
  await scroll(toast, 24);
  await cap('10 / Notified', '"' + toastText.trim() + '"', 'Waiting travellers on this route get the new bus in their language. The traveller\'s Alerts tab gets a badge.', '');
  mark('notified'); await sleep(6000);
  // 11 alerts
  await cap('11 / The alert, in Kannada', 'The new bus reaches Manjunath', '"Demo State RTC: 6 new buses to Hubballi, 14 Jan, night 22:30, from Majestic." The alert is read aloud with live Sarvam text-to-speech.', 'This video has no audio.');
  mark('alerts'); await tap(V('Alerts', { exact: true }));
  await V(/ಹುಬ್ಬಳ್ಳಿಗೆ 6 ಹೊಸ ಬಸ್/).waitFor({ timeout: 30000 }).catch(() => console.log('kn alert not seen'));
  await sleep(7000);
  // 12 about flags
  await cap('12 / Flagsmith', 'Flags: live from Flagsmith', 'festival_mode, voice_fallback_offline, voice_enabled, gifting and more are read live from Flagsmith for this guest identity and its traits, refreshed every 10 seconds.', '');
  mark('about'); await tap(V('About', { exact: true })); await sleep(1500);
  await scroll(V(/^Live flag values/), 30); await sleep(7000);
  await card('On stage: flip a flag, the app follows', 'In the Flagsmith dashboard we flip a flag (festival mode, offline-voice fallback, gifting rollout).<br>The app picks it up in about 10 seconds. Same code, no deploy.', 'Shown live on stage, not in this recording.');
  mark('flipcard'); await sleep(7000);
  await p.evaluate(() => ov('card', false));
  // 13 Tamil profile -> Pongal (optional)
  let pongal = false;
  try {
    await cap('13 / Segments', 'A Tamil traveller gets Pongal mode', 'Switch the profile to Tamil Nadu and Tamil. Flagsmith\'s tamil_travellers segment sends festival_mode = Pongal to this identity.', '');
    mark('tamil'); await scroll(V('View or edit profile'), 200);
    await tap(V('View or edit profile')); await sleep(1500);
    for (const c of ['தமிழ்', 'Tamil Nadu']) { await tap(V(c, { exact: true })); await sleep(700); }
    const town = V('Madurai', { exact: true });
    if (await town.count()) { await tap(town); await sleep(600); }
    await tap(V(/^Save/)); await sleep(1500);
    await tap(V('Speak', { exact: true })).catch(() => {});
    await f.getByText(/Pongal/).locator('visible=true').first().waitFor({ timeout: 30000 });
    pongal = true; await sleep(1000);
    const greet = await f.getByText(/Pongal/).locator('visible=true').first().innerText();
    console.log('PONGAL', greet);
    await sleep(6000);
  } catch (e) { console.log('pongal skipped', e.message.slice(0, 120)); }
  // NudgeBee + end
  await card('Rush night: NudgeBee', 'Plan: when special buses open and everyone opens the app, NudgeBee watches the api and voice services,<br>explains a failure in Slack, and on approval its runbook flips Flagsmith <b>voice_fallback_offline</b><br>so travellers still get text + saved-audio answers.', 'Honest note: NudgeBee is being connected live at the venue. It is not shown working in this recording.');
  mark('nudge'); await sleep(10000);
  await p.evaluate(() => { ov('card', false); ov('endcard', true); }); mark('end'); await sleep(7000);
  mark('stop');
  await cdp.send('Page.stopScreencast'); await sleep(500);
  fs.writeFileSync(path.join(__dirname, 'index.json'), JSON.stringify({ idx, marks, pongal }));
  console.log('frames', n, 'pongal', pongal, 'marks', JSON.stringify(marks));
  await b.close();
})().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
