# Rollyy — EV Mobility App

A mobile-first app for EV drivers to find and reserve charging points, parking
spots, maintenance shops, and on-demand Rollyy charging bots — all in one place.
The landing screen is a single voice/text prompt: say or type what you need
("my battery is dead", "find parking near Espoo") and Rollyy routes you to the
right service automatically.

## Architecture

Two independent apps:

```
client/   React 18 + Vite mobile web app (bottom tab navigation)
server/   Express API (live open-data integrations + in-memory reservations)
```

The client never calls third-party APIs directly — everything goes through the
Express server, so API keys stay server-side and responses are normalised into
one consistent shape for the UI.

## Features

- **Voice/text assistant** — the home screen is a mic button + text fallback;
  a request is classified into a service (charging, bot, parking, maintenance,
  car wash) and you land there already searching, with the issue or place
  pre-filled where relevant
- **Charging points** — live stations from OpenChargeMap
- **Charging bot** — compare a fleet of nearby Rollyy bots (distance, ETA,
  battery, price), reserve and pay for one, and track it driving to your vehicle
- **Parking** — nearby parking areas from OpenStreetMap (Overpass)
- **Maintenance** — nearby repair shops from OpenStreetMap, ranked against a
  free-text description of your issue (e.g. "brake squeal"), optionally via an
  AI diagnosis (see below) or a deterministic keyword/tag matcher
- **Car wash** — nearby car washes from OpenStreetMap
- **Weather** — current conditions for the searched location (Open-Meteo)
- **Map** — every result list is plotted on a live Leaflet/OpenStreetMap view
- **Reservations** — a shared reserve → pay → confirm flow across charging,
  parking, maintenance, car wash, and bot dispatch (simulated payment processor)
- **My Trips** — full reservation history; cancel a pending or already-paid
  reservation (simulated refund), which also halts any linked bot dispatch

## AI (optional, gracefully degrades without it)

Two features can use an LLM if `OPENAI_API_KEY` is configured, and fall back to
deterministic logic instantly (with a server-side warning log explaining why)
if it isn't set, times out, or the account has no credits/quota:

| Feature | AI path | Fallback |
|---|---|---|
| Home voice/text request → service routing | `intent.service.js` classifies free text into a service + place/issue | Keyword/regex matcher (`classifyIntentLocally`) |
| Maintenance issue triage | `ai.service.js` diagnoses the problem and picks specialties | Keyword/tag matcher (`recommendation.service.js`) |
| Spoken replies on the home screen | `speech.service.js` synthesizes voice via ElevenLabs (`ELEVENLABS_API_KEY`) | Browser `SpeechSynthesis` API |

The app is fully usable and demo-safe with zero AI configuration — this is
additive, not a dependency.

## Live data sources (no API key required unless noted)

| Source | Used for |
|---|---|
| [OpenChargeMap](https://openchargemap.org) | Charging stations *(free API key required)* |
| [OpenStreetMap Overpass](https://overpass-api.de) | Parking, maintenance, car wash |
| [Nominatim](https://nominatim.org) | Geocoding / reverse geocoding |
| [Open-Meteo](https://open-meteo.com) | Weather |
| [OpenAI](https://platform.openai.com) | Optional voice-intent routing + maintenance triage |

Public Overpass mirrors can rate-limit under heavy use; the server retries
across three mirrors and, only if every mirror fails, falls back to clearly
labeled ("Estimated") placeholder results so the app never dead-ends.

Rollyy bot fleet, availability, and dispatch tracking are simulated in-memory
on the server (`botDispatch.service.js`) — there is no external Rollyy API
integration yet.

## Getting started

```bash
# Server
cd server
npm install
cat > .env << 'EOF'
PORT=4000
OPENCHARGEMAP_API_KEY=your_key_here
# Optional — enables AI routing/triage; omit to use the deterministic fallback
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
# Optional — enables spoken replies on the home screen; omit to use browser TTS
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
EOF
npm run dev          # http://localhost:4000

# Client (separate terminal)
cd client
npm install
npm run dev           # http://localhost:5173 (the actual app UI), proxies /api to the server
```

Port 4000 only serves JSON (`/health`, `/api/*`) — open the client's port
(5173) in your browser to see the app.

## Project layout

```
server/src/
  routes/       geocode, charging, parking, maintenance, carwash, weather, reservations, intent, speech
  services/     nominatim, openChargeMap, overpass, weather, recommendation, botDispatch,
                reservation, ai, intent, speech
  middleware/   errorHandler
  utils/        distance

client/src/
  pages/        Home (voice/text assistant), Charging, Parking, Maintenance, CarWash,
                BotFleet, BotDispatch, Reservation, Payment, ReservationConfirmed, Trips, Weather
  components/   TopBar, BottomNav, LocationBar, MapView, PlaceCard, MechanicCard,
                WeatherChip, StateBlocks
  context/      LocationContext (shared searched location + weather across tabs)
  api/          client.js — typed fetch wrapper for every server endpoint
```

## Notes on the simulated pieces

Two things are intentionally simulated rather than calling real external
services, since this is an MVP:

- **Payments** — `reservation.service.js` validates card shape only (Luhn-free,
  no real charge, so cancelling a "paid" reservation is just a simulated refund).
  Swap for a real processor (e.g. Stripe) before production.
- **Rollyy bot fleet/dispatch** — `botDispatch.service.js` generates a small
  in-memory fleet and simulates arrival progress over time. Swap for Rollyy's
  real dispatch API when available.

