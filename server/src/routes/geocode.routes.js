import { Router } from 'express';
import { geocode, reverseGeocode } from '../services/nominatim.service.js';

const router = Router();

router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required.' });
    const result = await geocode(q);
    if (!result) return res.status(404).json({ error: `No location found for "${q}".` });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/reverse', async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Query parameters "lat" and "lon" are required.' });
    const label = await reverseGeocode(Number(lat), Number(lon));
    res.json({ label });
  } catch (error) {
    next(error);
  }
});

export default router;
