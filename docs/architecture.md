# Architecture

Frontend React PWA (mobile-first) ←→ Public API Proxy (Node, rate-limiting) ←→

1. OpenChargeMap & Nominatim
2. Stripe (client + server keys)
3. Simulated Rollyy micro-services (orchestration, session, settlement)

State is persisted in the browser (React Context + localStorage). No dedicated
backend exists yet in this scaffold — `services/nominatim.js` and
`services/openChargeMap.js` call the public APIs directly from the client for
demo purposes. A production build should proxy these through a small Node
service to hide API keys, enforce rate limits, and add caching (see section 7
of the original spec / `docs/roadmap.md`).

## Data flow
Voice → NLP (services/speech.js) → Geocode (nominatim) → Charger search
(openChargeMap) → Bundle pricing (rollyyOrchestration, mocked) → Select →
Pay (stripe, mocked server call) → Booking (rollyyOrchestration, mocked) →
Token (utils/jwt.js) → QR pass (components/Pass) → Live session
(rollyySession, mocked SSE via polling/interval) → Settlement
(rollyySettlement, mocked) → Receipt.

## Models
`User`, `Vehicle`, `Station`, `Bundle`, `Booking`, `Session`, `Transaction` —
currently represented as plain objects flowing through `state/AppContext.jsx`
rather than formal schemas; formalize with TypeScript types or Zod schemas as
the app matures.

## State tiers
- In-memory: React Context (`state/AppContext.jsx`)
- Persistent: `localStorage` (booking, pass JWT, session, history) for
  reload-resume support
- JWT: EV Pass credential encoded via `utils/jwt.js`, decoded for QR/pass link
