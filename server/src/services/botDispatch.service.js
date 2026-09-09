import { randomUUID } from 'node:crypto';
import { distanceKm } from '../utils/distance.js';

// In-memory simulation of Rollyy's mobile charging robot fleet for demo purposes.
// A real integration would call Rollyy's dispatch API instead of generating this locally.
const jobs = new Map();

const BOT_NAMES = ['Rollyy Unit 214', 'Rollyy Unit 358', 'Rollyy Unit 471', 'Rollyy Unit 526'];

// Small deterministic-ish fleet of nearby bots the driver can compare and pick from,
// each with its own distance/ETA/battery/price so the choice is meaningful.
export function findNearbyBots({ lat, lon }) {
  const bearingsKm = [[0.01, 0.006], [-0.008, 0.012], [0.014, -0.009], [-0.011, -0.007]];
  return bearingsKm.map(([dLat, dLon], index) => {
    const botLat = lat + dLat;
    const botLon = lon + dLon;
    const dist = distanceKm(lat, lon, botLat, botLon);
    return {
      id: `bot_${index}`,
      name: BOT_NAMES[index],
      lat: botLat,
      lon: botLon,
      distanceKm: dist,
      etaMinutes: Math.max(4, Math.round(dist * 6) + index * 2),
      batteryPercent: 60 + index * 10,
      chargeSpeedKw: 22 + index * 6,
      dispatchFee: Number((12 + dist * 4 + index * 3).toFixed(2))
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

export function createBotDispatch({ lat, lon, label, botName, etaMinutes }) {
  const id = randomUUID();
  const job = {
    id,
    status: 'dispatched',
    vehicleLocation: { lat, lon, label },
    etaMinutes: etaMinutes ?? 8 + Math.floor(Math.random() * 12),
    createdAt: new Date().toISOString(),
    botName: botName || `Rollyy Unit ${Math.floor(100 + Math.random() * 900)}`
  };
  jobs.set(id, job);
  return job;
}

export function getBotDispatch(id) {
  const job = jobs.get(id);
  if (!job) return null;
  if (job.cancelledAt) return { ...job, status: 'cancelled', progress: job.progressAtCancel };

  const elapsedMinutes = (Date.now() - new Date(job.createdAt).getTime()) / 60000;
  const progress = Math.min(1, elapsedMinutes / job.etaMinutes);
  const status = progress >= 1 ? 'arrived' : progress > 0.15 ? 'en_route' : 'dispatched';
  return { ...job, status, progress: Number(progress.toFixed(2)) };
}

// Freezes the job so it stops progressing toward "arrived" once its reservation is cancelled.
export function cancelBotDispatch(id) {
  const job = jobs.get(id);
  if (!job) return null;
  const current = getBotDispatch(id);
  job.cancelledAt = new Date().toISOString();
  job.progressAtCancel = current.progress;
  return job;
}

