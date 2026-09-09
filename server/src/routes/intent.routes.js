import { Router } from 'express';
import { classifyIntent } from '../services/intent.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required.' });
    res.json(await classifyIntent(q));
  } catch (error) {
    next(error);
  }
});

export default router;
