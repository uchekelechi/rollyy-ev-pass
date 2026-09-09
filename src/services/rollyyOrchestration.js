import { config } from '../config';

const delay = (ms = config.rollyy.mockLatencyMs) => new Promise((r) => setTimeout(r, ms));

// Future contract: POST /bundles/search {location, prefs} -> [{stationId, price}]
export async function searchBundles({ stations, targetSocPercent = 80 }) {
  await delay();
  return stations.map((station) => {
    const kWhEstimate = Math.max(5, Math.round((targetSocPercent / 100) * 40));
    const pricePerKwh = 0.32 + Math.random() * 0.1;
    return {
      bundleId: `bundle_${station.id}`,
      stationId: station.id,
      stationName: station.name,
      kWhEstimate,
      pricePerKwh: Number(pricePerKwh.toFixed(2)),
      price: Number((kWhEstimate * pricePerKwh).toFixed(2)),
      etaMinutes: 5 + Math.round(Math.random() * 15)
    };
  });
}

// Future contract: POST /booking {bundleId, pmToken} -> {bookingId, qr, expires}
export async function createBooking({ bundle, paymentIntentId }) {
  await delay();
  const bookingId = `bk_${Date.now()}`;
  const expires = Date.now() + 1000 * 60 * 60; // 1 hour
  return {
    bookingId,
    stationId: bundle.stationId,
    stationName: bundle.stationName,
    kWh: bundle.kWhEstimate,
    price: bundle.price,
    paymentIntentId,
    expires
  };
}
