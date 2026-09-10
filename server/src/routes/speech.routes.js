import { Router } from 'express';
import { synthesizeSpeech } from '../services/speech.service.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const text = (req.body?.text || '').toString().trim();
    if (!text) return res.status(400).json({ error: '"text" is required.' });

    const audio = await synthesizeSpeech(text);
    if (!audio) return res.status(503).json({ error: 'Speech synthesis is not available right now.' });

    res.set('Content-Type', 'audio/mpeg');
    res.send(audio);
  } catch (error) {
    next(error);
  }
});

export default router;
