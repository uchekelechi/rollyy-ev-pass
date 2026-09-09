# Rollyy — EV Mobility App

A mobile-first app for EV drivers to find and reserve charging points, parking
spots, maintenance shops, and on-demand Rollyy charging bots — all in one place.

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

- **Charging points** — live stations from OpenChargeMap
- **Charging bot** — compare a fleet of nearby Rollyy bots (distance, ETA,
  battery, price), reserve and pay for one, and track it driving to your vehicle
- **Parking** — nearby parking areas from OpenStreetMap (Overpass)
- **Maintenance** — nearby repair shops from OpenStreetMap, ranked against a
  free-text description of your issue (e.g. "brake squeal") via keyword/tag matching
- **Car wash** — nearby car washes from OpenStreetMap
- **Weather** — current conditions for the searched location (Open-Meteo)
- **Map** — every result list is plotted on a live Leaflet/OpenStreetMap view
- **Reservations** — a shared reserve → pay → confirm flow across charging,
  parking, maintenance, car wash, and bot dispatch (simulated payment processor)

No AI is used in this iteration — search/matching is deterministic (geocoding,
distance sorting, keyword-based specialty detection). That's intentionally left
for a future iteration.

## Live data sources (no API key required unless noted)

| Source | Used for |
|---|---|
| [OpenChargeMap](https://openchargemap.org) | Charging stations *(free API key required)* |
| [OpenStreetMap Overpass](https://overpass-api.de) | Parking, maintenance, car wash |
| [Nominatim](https://nominatim.org) | Geocoding / reverse geocoding |
| [Open-Meteo](https://open-meteo.com) | Weather |

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
echo "PORT=4000\nOPENCHARGEMAP_API_KEY=your_key_here" > .env
npm run dev          # http://localhost:4000

# Client (separate terminal)
cd client
npm install
npm run dev           # http://localhost:5173, proxies /api to the server
```

## Project layout

```
server/src/
  routes/       geocode, charging, parking, maintenance, carwash, weather, reservations
  services/     nominatim, openChargeMap, overpass, weather, recommendation, botDispatch, reservation
  middleware/   errorHandler
  utils/        distance

client/src/
  pages/        Home, Charging, Parking, Maintenance, CarWash, BotFleet, BotDispatch,
                Reservation, Payment, ReservationConfirmed
  components/   TopBar, BottomNav, LocationBar, MapView, PlaceCard, MechanicCard,
                WeatherChip, StateBlocks
  context/      LocationContext (shared searched location + weather across tabs)
  api/          client.js — typed fetch wrapper for every server endpoint
```

## Notes on the simulated pieces

Two things are intentionally simulated rather than calling real external
services, since this is an MVP:

- **Payments** — `reservation.service.js` validates card shape only (Luhn-free,
  no real charge). Swap for a real processor (e.g. Stripe) before production.
- **Rollyy bot fleet/dispatch** — `botDispatch.service.js` generates a small
  in-memory fleet and simulates arrival progress over time. Swap for Rollyy's
  real dispatch API when available.

