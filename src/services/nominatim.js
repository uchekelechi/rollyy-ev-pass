import { config } from '../config';

let lastRequestAt = 0;

// Rate-limits to 1 req/sec per Nominatim usage policy (spec section 3).
async function rateLimit() {
  const elapsed = Date.now() - lastRequestAt;
  const wait = config.nominatim.rateLimitMs - elapsed;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

// Geocodes a free-text place (e.g. "Salesforce Tower") into { lat, lon, label }.
export async function geocode(query) {
  await rateLimit();
  const url = new URL(`${config.nominatim.baseUrl}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' }
  });
  if (!res.ok) {
    const err = new Error(`Nominatim error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const results = await res.json();
  if (!results.length) return null;
  const [first] = results;
  return {
    lat: parseFloat(first.lat),
    lon: parseFloat(first.lon),
    label: first.display_name
  };
}
