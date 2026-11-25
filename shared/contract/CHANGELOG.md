# Contract changelog

- v1: initial contract (types.ts, 10 JSON schemas, examples).
- v2 (25 Nov): TripIntent.parser adds 'sarvam-llm' (Sarvam chat model understood it; old 'llm' still accepted). New optional
  TripIntent.travellingWith ('alone'|'family'|'elders'|'kids'|'friends'|'partner'|null) and GiftAsk.unit (e.g. 'kg', 'box').
  Partner display names no longer carry "Demo"/"(demo)" (ids unchanged).
- v2 (25 Nov, gifts): GET /v1/shops?boardingPoint= (ShopsResponse), POST /v1/gifts/orders accepts items[] + departTime
  (readyBy >= 15 min before), GiftOrder gains optional items/totalInr/departTime/createdAt/updatedAt, GET /v1/gifts/orders/:id,
  GET /v1/gifts/orders?travellerId=, POST /v1/gifts/orders/:id/status {status}, GET /v1/partners/:id/pickups?date= (PickupsResponse).
- v2 (25 Nov, polling + storage): AlertsResponse gains serverTime (+ echoed since); GET /v1/alerts?since=<serverTime>&onlyMine=1
  returns only live alerts newer than since (seeded history is excluded), cache-control no-store. HealthResponse gains store: 'memory'|'upstash'.
- v3 (25 Nov, partner accounts): POST /v1/partners/register {type, name, boardingPoint?, city?, items? [{name, priceInr, unit}],
  routes?, seatsPerNight?} -> {partner} (demo, no password; 400 on bad input, 409 on a taken name). Registered partners are kept in
  the shared store (Upstash when connected) and appear in GET /v1/partners, /v1/shops, demand, add buses, pickups and orders.
  Partner gains optional registered / seatsPerNight / city. RegisterPartnerRequest / RegisterPartnerResponse types.
