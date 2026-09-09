import { randomUUID } from 'node:crypto';
import { cancelBotDispatch, createBotDispatch } from './botDispatch.service.js';

// In-memory simulation of a reservation + payment across all bookable services. A production
// build would call a real payment processor (e.g. Stripe) and each provider's real booking API.
const reservations = new Map();

// Pricing/quantity rules per kind. Maintenance/car wash/bot are flat fees (not metered).
const PRICING = {
  charging: { unit: 'kWh', rate: 0.45, label: (qty) => `${qty} kWh reserved` },
  parking: { unit: 'hour', rate: 2.5, label: (qty) => `${qty} ${qty === 1 ? 'hour' : 'hours'} parking` },
  maintenance: { unit: 'visit', rate: 35, label: () => 'Workshop callout fee' },
  carwash: { unit: 'visit', rate: 15, label: () => 'Car wash service' },
  bot: { unit: 'dispatch', rate: 20, label: () => 'Bot dispatch fee' }
};

// Each bot in the fleet lists its own dispatch fee, so prefer that over the flat fallback rate.
function effectiveRate(kind, place) {
  if (kind === 'bot' && typeof place?.dispatchFee === 'number') return place.dispatchFee;
  return PRICING[kind].rate;
}

function estimateCost(rate, quantity) {
  return Number((rate * quantity).toFixed(2));
}

export function createReservation({ kind, place, slotMinutesFromNow, quantity }) {
  const pricing = PRICING[kind];
  if (!pricing) return { error: 'invalid_kind' };

  const normalisedQuantity = ['maintenance', 'carwash', 'bot'].includes(kind) ? 1 : quantity;
  const rate = effectiveRate(kind, place);
  const id = randomUUID();
  const reservation = {
    id,
    status: 'pending_payment',
    kind,
    place,
    slotMinutesFromNow,
    quantity: normalisedQuantity,
    quantityUnit: pricing.unit,
    quantityLabel: pricing.label(normalisedQuantity),
    rate,
    estimatedCost: estimateCost(rate, normalisedQuantity),
    createdAt: new Date().toISOString()
  };
  reservations.set(id, reservation);
  return { reservation };
}

export function getReservation(id) {
  return reservations.get(id) || null;
}

// Newest first, so the trips list reads like a normal booking history.
export function listReservations() {
  return [...reservations.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Cancelling a confirmed reservation simulates a refund (no real payment is ever contacted).
// A cancelled bot reservation also freezes its dispatch job so it stops driving toward "arrived".
export function cancelReservation(id) {
  const reservation = reservations.get(id);
  if (!reservation) return { error: 'not_found' };
  if (reservation.status === 'cancelled') return { reservation };

  const wasConfirmed = reservation.status === 'confirmed';
  reservation.status = 'cancelled';
  reservation.cancelledAt = new Date().toISOString();
  if (wasConfirmed) reservation.refunded = true;
  if (reservation.dispatchJobId) cancelBotDispatch(reservation.dispatchJobId);

  return { reservation };
}

// Lightweight shape validation only — this never contacts a real card network.
function validateCard({ cardNumber, expiry, cvc }) {
  const digitsOnly = String(cardNumber || '').replace(/\s+/g, '');
  if (!/^\d{15,16}$/.test(digitsOnly)) return 'Enter a valid card number.';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(expiry || '').trim())) return 'Enter expiry as MM/YY.';
  if (!/^\d{3,4}$/.test(String(cvc || '').trim())) return 'Enter a valid security code.';
  return null;
}

export function payReservation(id, card) {
  const reservation = reservations.get(id);
  if (!reservation) return { error: 'not_found' };
  if (reservation.status === 'confirmed') return { reservation };

  const validationError = validateCard(card);
  if (validationError) return { error: 'invalid_card', message: validationError };

  reservation.status = 'confirmed';
  reservation.paidAt = new Date().toISOString();
  reservation.cardLast4 = String(card.cardNumber).replace(/\s+/g, '').slice(-4);
  reservation.confirmationCode = randomUUID().slice(0, 8).toUpperCase();

  // Paying for a bot reservation is what actually starts it driving to the vehicle.
  if (reservation.kind === 'bot') {
    const { place } = reservation;
    const dispatchJob = createBotDispatch({
      lat: place.vehicleLat,
      lon: place.vehicleLon,
      label: place.vehicleLabel,
      botName: place.name,
      etaMinutes: place.etaMinutes
    });
    reservation.dispatchJobId = dispatchJob.id;
  }

  return { reservation };
}

