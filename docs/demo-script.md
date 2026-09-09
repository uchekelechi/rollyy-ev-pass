# Demo Script

1. Say: "Charge to 80% near Salesforce Tower at 6pm." (Screen 1)
2. Show network tab: geocode (Nominatim) → chargers (OpenChargeMap) → bundle (Rollyy orchestration, mocked). (Screen 1→2)
3. Select a station, pay with test card `4242 4242 4242 4242`. (Screen 3)
4. Display the EV Pass QR code and pass link. (Screen 4)
5. Trigger the session simulator; highlight live kWh/cost updates. (Screen 5)
6. End the session; open the CSV receipt; stress the future Rollyy integration
   points (real booking/session/settlement APIs). (Screen 6)

## Error/edge cases to demonstrate
- Backoff on OpenChargeMap 429s (automatic retry with exponential backoff)
- No-results modal when geocoding/search returns nothing
- Voice retry prompt on Web Speech API timeout/error
- Stripe error display for a non-4242 test card
- Reload the page mid-session to show auto-resume via localStorage
