# Rollyy EV Pass Demo

Voice-first EV charging: say your intent ("Charge to 80% near my office at 6pm"),
get matched to a charger, pay, receive a tokenised QR pass, and watch a live
charging session simulate to completion.

## Stack
- React 18 + Vite, mobile-first PWA (`vite-plugin-pwa`)
- Live public APIs: [OpenChargeMap](https://openchargemap.org/site/develop/api) (station discovery),
  [Nominatim](https://nominatim.org/release-docs/latest/api/Search/) (geocoding),
  Web Speech API (voice input), Stripe test mode (payment UI)
- Simulated Rollyy micro-services in `src/services/rollyy*.js` (orchestration, session, settlement) —
  see `docs/rollyy-api-contracts.md` for the future real-API contracts these mocks stand in for.

## Getting started
```bash
npm install
cp .env.example .env.local   # add your OpenChargeMap + Stripe test keys
npm run dev
```

## Project layout
```
src/
  components/   # Presentational + flow components (VoiceCapture, StationList, Booking, Pass, SessionMonitor, Receipt)
  screens/      # The 6 demo screens (see docs/demo-script.md), wire components + services together
  services/     # API integrations: nominatim, openChargeMap, speech, stripe, rollyy* (simulated)
  state/        # AppContext: in-memory + localStorage persisted app state
  utils/        # jwt (EV Pass token), geo, format helpers
  config/       # env-driven config
docs/           # architecture, API map, demo script, roadmap
```

## Demo flow
See `docs/demo-script.md` for the full walkthrough script and `docs/architecture.md` for
system design. Test payments use Stripe test card `4242 4242 4242 4242`.

## Deployment
Deploys to Vercel (see `vercel.json`). Set `VITE_OPENCHARGEMAP_API_KEY` and
`VITE_STRIPE_PUBLISHABLE_KEY` as environment variables in the Vercel dashboard.

## Status
This is a hackathon scaffold: Rollyy's booking/session/settlement APIs are mocked in
`src/services/rollyy*.js`. See `docs/roadmap.md` for the plan to swap in real endpoints.
