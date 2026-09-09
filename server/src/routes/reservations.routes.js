import { Router } from 'express';
import {
  cancelReservation,
  createReservation,
  getReservation,
  listReservations,
  payReservation
} from '../services/reservation.service.js';

const router = Router();

const VALID_KINDS = new Set(['charging', 'parking', 'maintenance', 'carwash', 'bot']);

router.get('/', (req, res) => {
  res.json({ results: listReservations() });
});

router.post('/', (req, res) => {
  const { kind, place, slotMinutesFromNow, quantity } = req.body || {};
  if (!VALID_KINDS.has(kind)) {
    return res.status(400).json({ error: '"kind" must be one of charging, parking, maintenance, carwash, bot.' });
  }
  if (!place?.name || typeof place.lat !== 'number' || typeof place.lon !== 'number') {
    return res.status(400).json({ error: 'A valid "place" object is required.' });
  }
  if (kind !== 'maintenance' && kind !== 'carwash' && kind !== 'bot' && (typeof quantity !== 'number' || quantity <= 0)) {
    return res.status(400).json({ error: '"quantity" must be a positive number.' });
  }
  const { reservation, error } = createReservation({
    kind,
    place,
    slotMinutesFromNow: Number(slotMinutesFromNow) || 0,
    quantity
  });
  if (error) return res.status(400).json({ error: 'Unsupported reservation kind.' });
  res.status(201).json(reservation);
});

router.get('/:id', (req, res) => {
  const reservation = getReservation(req.params.id);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });
  res.json(reservation);
});

// Simulated payment confirmation — see reservation.service.js. No real card network is contacted.
router.post('/:id/pay', (req, res) => {
  const { cardNumber, expiry, cvc } = req.body || {};
  const result = payReservation(req.params.id, { cardNumber, expiry, cvc });
  if (result.error === 'not_found') return res.status(404).json({ error: 'Reservation not found.' });
  if (result.error === 'invalid_card') return res.status(400).json({ error: result.message });
  res.json(result.reservation);
});

router.post('/:id/cancel', (req, res) => {
  const result = cancelReservation(req.params.id);
  if (result.error === 'not_found') return res.status(404).json({ error: 'Reservation not found.' });
  res.json(result.reservation);
});

export default router;

