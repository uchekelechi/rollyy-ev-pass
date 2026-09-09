import { distanceKm } from '../utils/distance.js';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter'
];

// Short-lived cache so a live demo repeating the same city search doesn't re-hit rate-limited mirrors.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

function cacheKey({ lat, lon, kind, radiusKm }) {
  return `${kind}:${lat.toFixed(2)}:${lon.toFixed(2)}:${radiusKm}`;
}

const QUERY_BY_KIND = {
  parking: (radius, lat, lon) => `nwr[amenity=parking](around:${radius},${lat},${lon});`,
  carwash: (radius, lat, lon) =>
    `nwr[shop=car_wash](around:${radius},${lat},${lon});nwr[amenity=car_wash](around:${radius},${lat},${lon});`,
  maintenance: (radius, lat, lon) =>
    `nwr[shop=car_repair](around:${radius},${lat},${lon});nwr[amenity=car_repair](around:${radius},${lat},${lon});`
};

function mapElement(element, origin, kind) {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  const address = [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(' ');

  return {
    id: `osm_${element.type}_${element.id}`,
    kind,
    name: tags.name || tags.brand || defaultName(kind),
    address: address || tags['addr:city'] || 'Address unavailable',
    lat,
    lon,
    distanceKm: lat && lon ? distanceKm(origin.lat, origin.lon, lat, lon) : null,
    tags,
    source: 'OpenStreetMap'
  };
}

function defaultName(kind) {
  if (kind === 'parking') return 'Parking area';
  if (kind === 'carwash') return 'Car wash';
  return 'Car repair shop';
}

// Deterministic, clearly-labeled placeholders so a live demo never dead-ends if every public
// Overpass mirror is rate-limited. Offsets are small fixed bearings around the search origin,
// not real businesses — the UI must label these as estimated, never as a specific named POI.
function buildFallbackPlaces({ lat, lon, kind, count = 6 }) {
  const bearingsKm = [
    [0.006, 0.004], [-0.005, 0.007], [0.008, -0.003],
    [-0.007, -0.006], [0.003, 0.009], [-0.004, -0.008]
  ];
  return bearingsKm.slice(0, count).map(([dLat, dLon], index) => {
    const placeLat = lat + dLat;
    const placeLon = lon + dLon;
    return {
      id: `estimated_${kind}_${index}`,
      kind,
      name: `${defaultName(kind)} ${index + 1} (estimated)`,
      address: 'Approximate location — live map data unavailable right now',
      lat: placeLat,
      lon: placeLon,
      distanceKm: distanceKm(lat, lon, placeLat, placeLon),
      tags: {},
      source: 'Estimated',
      isEstimated: true
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

// Public Overpass mirrors are frequently overloaded, so each is tried in turn with a client-side
// timeout, and a rate-limited (429) mirror gets one short backoff-retry before moving on. If every
// mirror fails, we serve stale cache if available, otherwise transparent estimated placeholders —
// a live pitch demo must never show a raw network error.
export async function findOsmPlaces({ lat, lon, kind, radiusKm = 6, maxResults = 25 }) {
  const buildQuery = QUERY_BY_KIND[kind];
  if (!buildQuery) throw new Error(`Unsupported OSM place kind: ${kind}`);

  const key = cacheKey({ lat, lon, kind, radiusKm });
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.results.slice(0, maxResults);

  const radiusMeters = radiusKm * 1000;
  const overpassQuery = `[out:json][timeout:20];(${buildQuery(radiusMeters, lat, lon)});out center tags;`;
  const body = `data=${encodeURIComponent(overpassQuery)}`;

  async function requestOnce(endpoint) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      return await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      let response = await requestOnce(endpoint);
      if (response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        response = await requestOnce(endpoint);
      }
      if (!response.ok) {
        lastError = new Error(`OpenStreetMap error ${response.status}`);
        continue;
      }
      const data = await response.json();
      const results = data.elements
        .filter((element) => element.lat || element.center?.lat)
        .map((element) => mapElement(element, { lat, lon }, kind))
        .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
      cache.set(key, { at: Date.now(), results });
      return results.slice(0, maxResults);
    } catch (cause) {
      lastError = cause;
    }
  }

  if (cached) return cached.results.slice(0, maxResults);
  console.warn(`Overpass unavailable for "${kind}" (${lastError?.message}); serving estimated placeholders.`);
  return buildFallbackPlaces({ lat, lon, kind });
}
