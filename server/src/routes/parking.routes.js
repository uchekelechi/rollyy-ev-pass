import { Router } from 'express';
import { findOsmPlaces } from '../services/overpass.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'Query parameters "lat" and "lon" are required.' });
    }
    const results = await findOsmPlaces({ lat, lon, kind: 'parking' });
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

export default router;
