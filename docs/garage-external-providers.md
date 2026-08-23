# Garage external providers (M5)

Research date: 2026-08-22.

## Plate lookup

Primary adapter: CarsXE Plate Decoder v2.

- Current API documentation: https://docs.carsxe.com/api-reference/plate-decoder/license-plate-decoder-v2
- U.S. requests require `plate`, `state`, and an API key; the documented response may include VIN, year, make, model, and trim.
- CarsXE documents 50+ country coverage and a free sandbox/trial. Current public plan information describes Sandbox (100 lifetime calls), Starter ($49/month for 2,000 calls per endpoint), Pro ($249/month for 25,000 calls per endpoint), and custom Business pricing; verify the dashboard contract before launch because pricing and quotas can change.
- The adapter treats CarsXE as an explicit, paid external lookup. It does not run without `CARSXE_API_KEY`, does not call on render/typing, and coalesces identical in-flight account requests.
- A returned VIN is sent to the existing NHTSA vPIC decode path. If NHTSA is unavailable, the verified plate-provider fields remain visible and the user must review before saving.
- Plate data is not logged, cached publicly, indexed by Search, or sent to advertising systems.

Fallback candidates reviewed:

- DataOne: U.S./Canadian vehicle data and VIN services are commercially available, but current public materials do not provide a self-serve plate API price or test credential. Treat as sales/contract integration.
- MarketCheck: strong automotive inventory/decode/market APIs, but the reviewed public documentation did not establish a U.S. consumer plate-to-VIN product with transparent startup pricing. Treat as sales/contract integration.

## Repair intelligence

No repair-estimate provider is represented as live. The server route and provider interface return an explicit unconfigured response until Cosmic has a licensed contract and credentials.

Candidates reviewed:

- RepairPal: its partner materials describe a Fair Price Estimator, certified shop network, and partner APIs, but access is a partnership arrangement rather than a public self-serve developer key. https://pages.repairpal.com/partners
- ALLDATA Connect: offers OEM repair data, repair trends, and Find-A-Fix integrations for enterprise customers and software developers; pricing and access require contact with ALLDATA. https://www.alldata.com/us/en/connect
- MOTOR/Mitchell: professional labor/parts data is appropriate for estimate accuracy, but no public consumer self-serve integration contract was found during this audit. Do not infer access or prices.

The model distinguishes `provider-estimate`, `regional-estimate`, `shop-published`, and `user-quote`. Estimates and quotes never count as recorded spending until a completed service or expense is recorded.

## Local shops

Primary optional adapter: official Google Places API (New) Text Search.

- Current pricing is SKU-based and pay-as-you-go; the reviewed pricing page lists Text Search and Nearby Search tiers, with field masks required for cost control. https://developers.google.com/maps/billing-and-pricing/pricing
- The adapter is server-only, uses `GOOGLE_MAPS_PLATFORM_API_KEY`, requires explicit user location text, and requests only shop identity/contact/rating/hours fields.
- Shop listings are labeled as Google Places data. No shop-specific price is inferred; listings show “Price: not published” unless a future provider supplies a genuinely published price.
- Google Maps Platform terms, display requirements, attribution, retention, and billing must be reviewed before production launch.

Yelp Fusion remains a fallback candidate. Yelp documents Bearer authentication, daily/QPS limits, and commercial access requirements; its current developer materials state that limits vary by plan and that production integrations should coordinate with Yelp. https://docs.developer.yelp.com/docs/places-rate-limiting

## Cost and failure controls

- External calls occur only after an explicit button action.
- Plate requests are coalesced by account + country + region + normalized plate while in flight.
- API keys remain server-only and are never accepted from request bodies.
- Provider failures are mapped to user-safe unavailable states.
- Do not log full plates, VINs, private repair notes, or secrets. Add production metrics for provider, operation, success/failure, and latency without sensitive identifiers.
- Before launch, add a shared account rate limiter and provider-budget alerts; the current adapter does not pretend that an in-memory map is a production quota system.

## M6 camera and OCR boundary

- The web camera layer uses `navigator.mediaDevices.getUserMedia()` only after a Cosmic+ user chooses VIN or plate scanning and presses `Start Camera`. It requires HTTPS (or localhost), a valid top-level origin, and browser permission. See the [MDN getUserMedia documentation](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
- Desktop Chrome/Edge/Firefox and current mobile Safari/Chrome generally expose camera access in secure top-level pages, but browser/PWA embedding, permission state, OS privacy settings, and installed-web-app behavior can still deny access. The UI always provides manual fallback.
- The browser does not provide a dependable cross-browser general OCR API for this product. M6 therefore captures a transient frame, stops the stream, and requires the user to type/correct the candidate before lookup. No camera frame is uploaded or stored.
- `BarcodeDetector` is optional only; MDN marks it limited availability and not Baseline, so it cannot be the sole VIN strategy. https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
- Future iOS native scanning should use Vision/VisionKit on-device text and barcode recognition. Future Android native scanning may use Google ML Kit. Native code is deliberately not included in M6.

## Manual configuration

Add server environment values locally:

```text
CARSXE_API_KEY=...
GOOGLE_MAPS_PLATFORM_API_KEY=...
```

Do not use `NEXT_PUBLIC_` prefixes. No provider subscription or purchase was made as part of M5.
