// Central config: reads env vars (Vite exposes VITE_* at build time).
export const config = {
  openChargeMap: {
    baseUrl: 'https://api.openchargemap.io/v3',
    apiKey: import.meta.env.VITE_OPENCHARGEMAP_API_KEY || ''
  },
  nominatim: {
    baseUrl: 'https://nominatim.openstreetmap.org',
    // Nominatim usage policy: max 1 request/sec, must set a descriptive UA/referer.
    rateLimitMs: 1000
  },
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
  },
  rollyy: {
    // Simulated for the hackathon demo; swap for real endpoints post-event (see docs/roadmap.md).
    mockLatencyMs: 600,
    jwtIssuer: 'rollyy_demo'
  },
  voice: {
    listenTimeoutMs: 10000
  }
};

export default config;
