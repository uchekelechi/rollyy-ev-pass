import { Router } from 'express';
import { findOsmPlaces } from '../services/overpass.service.js';
import { rankMechanics, rankMechanicsBySpecialties } from '../services/recommendation.service.js';
import { classifyIssueWithAI } from '../services/ai.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const issue = (req.query.issue || '').toString();
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'Query parameters "lat" and "lon" are required.' });
    }
    const shops = await findOsmPlaces({ lat, lon, kind: 'maintenance', radiusKm: 10 });

    if (!issue.trim()) {
      return res.json({ results: shops.map((shop) => ({ ...shop, matchScore: 0, matchReasons: [] })), usedAi: false });
    }

    // Try the AI triage classifier first; silently fall back to keyword matching if it's
    // not configured or fails, so maintenance search never breaks on an AI outage.
    const aiResult = await classifyIssueWithAI(issue);
    if (aiResult) {
      return res.json({
        results: rankMechanicsBySpecialties(shops, aiResult.specialties),
        usedAi: true,
        aiSummary: aiResult.summary,
        urgency: aiResult.urgency
      });
    }

    res.json({ results: rankMechanics(shops, issue), usedAi: false });
  } catch (error) {
    next(error);
  }
});

export default router;
