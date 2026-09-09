const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
let lastRequestAt = 0;

// Nominatim usage policy caps free lookups at ~1 request/second.
async function throttle() {
  const wait = 1000 - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
}

export async function geocode(query) {
  await throttle();
  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, { headers: { 'User-Agent': 'RollyyApp/1.0 (contact@rollyy.com)' } });
  if (!response.ok) throw new Error(`Geocoding error ${response.status}`);
  const results = await response.json();
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), label: results[0].display_name };
}

export async function reverseGeocode(lat, lon) {
  await throttle();
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('format', 'jsonv2');

  const response = await fetch(url, { headers: { 'User-Agent': 'RollyyApp/1.0 (contact@rollyy.com)' } });
  if (!response.ok) throw new Error(`Reverse geocoding error ${response.status}`);
  const result = await response.json();
  return result.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
