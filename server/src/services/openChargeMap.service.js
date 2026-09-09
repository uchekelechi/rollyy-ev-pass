const OPENCHARGEMAP_KEY = process.env.OPENCHARGEMAP_API_KEY || '';
const OPENCHARGEMAP_BASE = 'https://api.openchargemap.io/v3/poi';

function mapStation(poi) {
  const primaryConnection = poi.Connections?.[0];
  return {
    id: `ocm_${poi.ID}`,
    name: poi.AddressInfo?.Title || 'Charging station',
    address: [poi.AddressInfo?.AddressLine1, poi.AddressInfo?.Town].filter(Boolean).join(', '),
    lat: poi.AddressInfo?.Latitude,
    lon: poi.AddressInfo?.Longitude,
    distanceKm: poi.AddressInfo?.Distance ?? null,
    operator: poi.OperatorInfo?.Title || 'Independent operator',
    connectorType: primaryConnection?.ConnectionType?.Title || 'Type 2',
    powerKw: primaryConnection?.PowerKW || null,
    connectorCount: poi.Connections?.length || 1,
    isOperational: poi.StatusType?.IsOperational !== false,
    source: 'OpenChargeMap'
  };
}

// Live EV charging station lookup via OpenChargeMap's public EU-wide dataset.
export async function findChargingStations({ lat, lon, radiusKm = 8, maxResults = 25 }) {
  const url = new URL(OPENCHARGEMAP_BASE);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('distance', radiusKm);
  url.searchParams.set('distanceunit', 'KM');
  url.searchParams.set('maxresults', maxResults);
  url.searchParams.set('compact', 'true');
  url.searchParams.set('verbose', 'false');
  if (OPENCHARGEMAP_KEY) url.searchParams.set('key', OPENCHARGEMAP_KEY);

  const response = await fetch(url, { headers: { 'User-Agent': 'RollyyApp/1.0' } });
  if (!response.ok) throw new Error(`OpenChargeMap error ${response.status}`);
  const pois = await response.json();
  return pois.map(mapStation).sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
}
