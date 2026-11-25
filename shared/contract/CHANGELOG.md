# Contract changelog

- v1: initial contract (types.ts, 10 JSON schemas, examples).
- v2 (25 Nov): TripIntent.parser adds 'sarvam-llm' (Sarvam chat model understood it; old 'llm' still accepted). New optional
  TripIntent.travellingWith ('alone'|'family'|'elders'|'kids'|'friends'|'partner'|null) and GiftAsk.unit (e.g. 'kg', 'box').
  Partner display names no longer carry "Demo"/"(demo)" (ids unchanged).
- v2 (25 Nov, gifts): GET /v1/shops?boardingPoint= (ShopsResponse), POST /v1/gifts/orders accepts items[] + departTime
  (readyBy >= 15 min before), GiftOrder gains optional items/totalInr/departTime/createdAt/updatedAt, GET /v1/gifts/orders/:id,
  GET /v1/gifts/orders?travellerId=, POST /v1/gifts/orders/:id/status {status}, GET /v1/partners/:id/pickups?date= (PickupsResponse).
