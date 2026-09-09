import { config } from '../config';

// Maps a raw OpenChargeMap POI to the shape used by StationList/StationCard.
function mapPoi(poi) {
  const conn = poi.Connections?.[0];
  return {
    id: poi.ID,
    name: poi.AddressInfo?.Title || 'Charging Station',
    address: poi.AddressInfo?.AddressLine1 || '',
    town: poi.AddressInfo?.Town || '',
    lat: poi.AddressInfo?.Latitude,
    lon: poi.AddressInfo?.Longitude,
    distanceKm: poi.AddressInfo?.Distance ?? null,
    connections: (poi.Connections || []).map((c) => ({
      type: c.ConnectionType?.Title || 'Unknown',
      powerKw: c.PowerKW,
      status: c.StatusType?.IsOperational ? 'operational' : 'unknown'
    })),
    maxPowerKw: conn?.PowerKW || null,
    operator: poi.OperatorInfo?.Title || 'Unknown operator'
  };
}

// Finds chargers near a lat/lon. Backs off on 429s (spec section 7: error handling).
export async function findChargersNear({ lat, lon }, { distanceKm = 5, maxResults = 12 } = {}) {
  const url = new URL(`${config.openChargeMap.baseUrl}/poi`);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('distance', distanceKm);
  url.searchParams.set('distanceunit', 'KM');
  url.searchParams.set('maxresults', maxResults);
  url.searchParams.set('compact', 'true');
  url.searchParams.set('verbose', 'false');
  if (config.openChargeMap.apiKey) {
    url.searchParams.set('key', config.openChargeMap.apiKey);
  }

  let attempt = 0;
  while (attempt < 3) {
    const res = await fetch(url);
    if (res.status === 429) {
      attempt += 1;
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      continue;
    }
    if (!res.ok) {
      throw new Error(`OpenChargeMap error ${res.status}`);
    }
    const pois = await res.json();
    return pois.map(mapPoi);
  }
  throw new Error('OpenChargeMap rate limit exceeded, please retry shortly.');
}
