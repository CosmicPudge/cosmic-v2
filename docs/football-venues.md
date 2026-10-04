# Football venue backgrounds

NFL and CFB venue resolution is shared through `services/sports/venues/football.ts`.

Resolution order is provider venue ID, exact canonical venue name, alias, explicit event venue, home school primary venue, then the generic football background. A neutral-site event never falls back to a home school venue. Venue assets are exposed through the kiosk background resolver only when the manifest marks them `complete`; missing assets intentionally use `/dashboard/sports/stadium.webp`.

CFB assets belong under `public/kiosk/scenes/sports/cfb/<venue-slug>.webp`. The JSON manifest records source, license, attribution, and asset status. The current registry includes Utah State/Maverik Stadium, Boise State/Albertsons Stadium, Rose Bowl, and Mercedes-Benz Stadium. The Utah State @ Boise State event resolves to Albertsons Stadium when ESPN supplies that venue or a matching alias.

To add a stadium, add one registry record and one manifest record, add aliases for sponsor-name changes, place an optimized WebP at the canonical path, then change `assetStatus` to `complete` only after the file and attribution are verified. No runtime downloads are used.
