// Build-time only: fetch each official site's favicon ONCE into assets/logos/<id>.png (bundled; no hotlinking at runtime).
// Run: node scripts/fetch-logos.mjs   (uses Google's public favicon service for the official domain)
import { writeFile } from 'node:fs/promises';
const SITES = {
  redbus: 'redbus.in', abhibus: 'abhibus.com', zingbus: 'zingbus.com', flixbus: 'flixbus.in', ksrtc: 'ksrtc.in', irctc: 'irctc.co.in',
  ixigo: 'ixigo.com', makemytrip: 'makemytrip.com', blinkit: 'blinkit.com', zepto: 'zeptonow.com', instamart: 'swiggy.com', flipkart: 'flipkart.com', zomato: 'zomato.com',
};
for (const [id, domain] of Object.entries(SITES)) {
  try {
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok || buf.length < 100) throw new Error(`HTTP ${res.status}, ${buf.length} bytes`);
    await writeFile(new URL(`../assets/logos/${id}.png`, import.meta.url), buf);
    console.log(id, buf.length);
  } catch (e) { console.log(id, 'FAILED', String(e)); }
}
