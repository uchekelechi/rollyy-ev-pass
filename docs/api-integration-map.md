# Public API Integration Map

| API | Endpoint | Usage | Implementation |
|---|---|---|---|
| OpenChargeMap | `GET /poi?latitude&longitude&distance…` | Station list; maps `ID`, `AddressInfo`, `Connections` to UI cards | `src/services/openChargeMap.js` |
| Nominatim | `GET /search?q=…` | Rate-limited to 1 req/s; used for geocoding and as NLP location fallback | `src/services/nominatim.js` |
| Web Speech API | `window.SpeechRecognition` | Voice capture, 10s timeout, falls back to text input | `src/services/speech.js`, `src/components/VoiceCapture` |
| Stripe | Elements (card/Apple Pay), test keys | Payment UI + mocked PaymentIntent confirm | `src/services/stripe.js`, `src/components/Booking` |

## Rollyy API touchpoints (simulated today)

Mocked in `src/services/rollyy*.js`. Future real contracts:

- `POST /bundles/search {location, prefs} -> [{stationId, price}]`
- `POST /booking {bundleId, pmToken} -> {bookingId, qr, expires}`
- `GET /session/{id}` (SSE) `-> {kWh, status}`
- `POST /settlement {sessionId} -> {receiptUrl}`

See `docs/roadmap.md` for the swap-over plan.
