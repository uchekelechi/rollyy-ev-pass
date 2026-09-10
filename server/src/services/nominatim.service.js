const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
let lastRequestAt = 0;

// Nominatim usage policy caps free lookups at ~1 request/second.
async function throttle() {
  const wait = 1000 - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
}

// display_name lists parts most-specific-first (POI name, house number, road, …) which reads
// backwards for a normal address, so build a natural "Road 12, Area" label from the structured
// address object instead; falls back to a trimmed display_name if that's all we have.
function buildLabel(result) {
  const address = result.address || {};
  const street = [address.road, address.house_number].filter(Boolean).join(' ');
  const area = address.suburb || address.neighbourhood || address.city_district || address.city
    || address.town || address.village;
  const parts = [street, area].filter(Boolean);
  if (parts.length) return parts.join(', ');
  if (!result.display_name) return result.display_name;
  return result.display_name.split(',').slice(0, 3).map((part) => part.trim()).join(', ');
}

export async function geocode(query) {
  await throttle();
  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url, { headers: { 'User-Agent': 'RollyyApp/1.0 (contact@rollyy.com)' } });
  if (!response.ok) throw new Error(`Geocoding error ${response.status}`);
  const results = await response.json();
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), label: buildLabel(results[0]) };
}

export async function reverseGeocode(lat, lon) {
  await throttle();
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url, { headers: { 'User-Agent': 'RollyyApp/1.0 (contact@rollyy.com)' } });
  if (!response.ok) throw new Error(`Reverse geocoding error ${response.status}`);
  const result = await response.json();
  return buildLabel(result) || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
