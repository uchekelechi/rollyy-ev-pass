# Roadmap

## Hackathon (this scaffold)
- [ ] Wire OpenChargeMap + Nominatim end to end
- [ ] Voice/NLP capture with text fallback
- [ ] Stripe test-mode payment UI
- [ ] Live session simulator with cost ticking
- [ ] Error flows (429 backoff, offline cache, no-results, reload resume)
- [ ] Docs & demo video

## Post-event
- Swap `src/services/rollyy*.js` mocks for real Rollyy APIs
  (`/bundles/search`, `/booking`, `/session/{id}` SSE, `/settlement`)
- Move Nominatim/OpenChargeMap calls behind a Node API proxy to hide keys and
  add caching/rate limiting
- Production Stripe payments (server-side PaymentIntents, webhooks)
- Real JWT signing (server-issued, asymmetric keys) instead of the demo
  unsigned token in `utils/jwt.js`
- Fleet dashboard for operators
- Usage analytics
- Internationalization (i18n)
