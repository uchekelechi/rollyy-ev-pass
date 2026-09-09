import { Router } from 'express';
import { findChargingStations } from '../services/openChargeMap.service.js';
import { getBotDispatch, findNearbyBots } from '../services/botDispatch.service.js';

const router = Router();

function requireCoords(req, res) {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    res.status(400).json({ error: 'Query parameters "lat" and "lon" are required.' });
    return null;
  }
  return { lat, lon };
}

router.get('/stations', async (req, res, next) => {
  try {
    const coords = requireCoords(req, res);
    if (!coords) return;
    const stations = await findChargingStations(coords);
    res.json({ results: stations });
  } catch (error) {
    next(error);
  }
});

// Simulated Rollyy mobile charging robot fleet — see botDispatch.service.js for details.
// Dispatch jobs are created by reservation.service.js once a bot reservation is paid,
// so the only entry point here is browsing the fleet and polling an existing job.
router.get('/bot/nearby', (req, res) => {
  const coords = requireCoords(req, res);
  if (!coords) return;
  res.json({ results: findNearbyBots(coords) });
});

router.get('/bot/dispatch/:id', (req, res) => {
  const job = getBotDispatch(req.params.id);
  if (!job) return res.status(404).json({ error: 'Dispatch job not found.' });
  res.json(job);
});

export default router;
