# context.dev (optional helper)

Ankith's own web data API: scrape, crawl, web/news search, company search, file/PDF parsing; MCP server + SDKs. About 11,000 credits (Equal AI kit noted news search at about 1 credit per 10 results; scrape about 1 credit per page) [UNVERIFIED pricing; check the dashboard].

It is NOT a sponsor. Sponsors stay the heroes. Mention it in the README as "optional live data helper".

## What it is for in Prasthan

1. **Alerts feed (main use).** News search for real announcements, turned into `Alert` items with `source: "context_dev"` and the article `sourceUrl`:
   - "KSRTC special buses Sankranti 2027 Bengaluru"
   - "special trains Sankranti Bengaluru Patna" / "Pongal special trains Bengaluru Madurai"
   - "private bus fares surge Sankranti Bengaluru"
   The api keeps only items from the last 30 days, max 5, and shows the headline + source link. It never rewrites them as facts of our own.
2. **Demo data refresh (prep only, by hand).** Scrape public operator/route pages to sanity-check route names and boarding points in `seed/`. Not at runtime. No prices.
3. **Find sweet shops near boarding points (prep only).** Search for sweet shops near Majestic etc. to make the synthetic shop list realistic. The seed still uses invented names; never put a real shop's name next to invented numbers.

## Rules

- Behind the Flagsmith flag `live_data_source` (`seeded` | `context_dev`). Default `seeded`. The stage demo uses `seeded` unless the live search was tested at 14:30 that day.
- Only `services/api/src/live/contextdev.ts` calls it. Timeout 6 s, cache 10 min, on any error return the seeded alerts and set `source: "seeded"`.
- Key: env var `CONTEXT_DEV_API_KEY` [UNVERIFIED name: check the context.dev docs/SDK readme for the expected variable; if the SDK wants another name, map it in code, keep `.env.example` in sync]. Only in `.env`. Never in the repo, the zip, the app bundle, logs, prompts or the video.
- No scraping of booking sites (redBus, IRCTC etc.). Deep links only. No price collection.
- Respect each site's terms; news search results are shown as links to the source.

## Codex prompt hook

A-05 (stretch) builds it. If context.dev docs are not reachable from Codex, skip A-05; nothing else depends on it.
