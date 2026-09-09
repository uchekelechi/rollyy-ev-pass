import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import { ErrorState } from '../components/StateBlocks.jsx';

const SLOT_OPTIONS = [
  { label: 'Now', minutes: 0 },
  { label: 'In 15 min', minutes: 15 },
  { label: 'In 30 min', minutes: 30 },
  { label: 'In 1 hour', minutes: 60 }
];

const KIND_CONFIG = {
  charging: {
    title: 'Reserve charger',
    quantityTitle: 'Energy needed',
    quantityOptions: [10, 20, 40, 60],
    quantitySuffix: 'kWh',
    rate: 0.45,
    rateLabel: (rate) => `€${rate.toFixed(2)}/kWh`,
    meta: (place) => `${place.connectorType || 'Unknown connector'} · ${place.powerKw ? `${place.powerKw} kW` : 'power n/a'}`
  },
  parking: {
    title: 'Reserve parking',
    quantityTitle: 'Duration',
    quantityOptions: [1, 2, 4, 8],
    quantitySuffix: 'h',
    rate: 2.5,
    rateLabel: (rate) => `€${rate.toFixed(2)}/hour`,
    meta: (place) => (place.tags?.access === 'private' ? 'Private access' : 'Public access')
  },
  maintenance: {
    title: 'Book workshop visit',
    quantityTitle: null,
    quantityOptions: [],
    rate: 35,
    rateLabel: () => 'Flat callout fee',
    meta: () => 'Workshop appointment'
  },
  carwash: {
    title: 'Reserve car wash',
    quantityTitle: null,
    quantityOptions: [],
    rate: 15,
    rateLabel: () => 'Flat wash fee',
    meta: () => 'Car wash appointment'
  },
  bot: {
    title: 'Reserve charging bot',
    quantityTitle: null,
    quantityOptions: [],
    rate: 20,
    rateLabel: (rate) => `€${rate.toFixed(2)} dispatch fee`,
    meta: (place) => `ETA ${place.etaMinutes} min to your vehicle`
  }
};

export default function ReservationPage() {
  const { kind } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const place = state?.place;
  const config = KIND_CONFIG[kind];

  const [slotMinutes, setSlotMinutes] = useState(0);
  const [quantity, setQuantity] = useState(config?.quantityOptions?.[1] ?? 1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Each bot lists its own dispatch fee; every other kind uses the flat rate above.
  const rate = kind === 'bot' && typeof place?.dispatchFee === 'number' ? place.dispatchFee : config?.rate;
  const estimatedCost = useMemo(() => (config ? (rate * quantity).toFixed(2) : '0.00'), [config, rate, quantity]);

  if (!config || !place) {
    return (
      <div className="screen">
        <TopBar title="Reserve" showBack />
        <ErrorState message="This reservation link expired. Go back and select an option again." />
      </div>
    );
  }

  async function confirmSelection() {
    setSubmitting(true);
    setError('');
    try {
      const reservation = await api.createReservation({
        kind,
        place: {
          id: place.id,
          name: place.name,
          address: place.address,
          lat: place.lat,
          lon: place.lon,
          connectorType: place.connectorType,
          powerKw: place.powerKw,
          etaMinutes: place.etaMinutes,
          dispatchFee: place.dispatchFee,
          vehicleLat: place.vehicleLat,
          vehicleLon: place.vehicleLon,
          vehicleLabel: place.vehicleLabel
        },
        slotMinutesFromNow: slotMinutes,
        quantity
      });
      navigate(`/${kind}/reserve/${reservation.id}/pay`);
    } catch (cause) {
      setError(cause.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <TopBar title={config.title} showBack />

      <section className="reservation-summary">
        <p className="place-card-name">{place.name}</p>
        <p className="place-card-address">{place.address}</p>
        <p className="place-card-meta">{config.meta(place)}</p>
      </section>

      <div className="option-block">
        <p className="eyebrow">{kind === 'maintenance' ? 'Appointment time' : 'Arrival time'}</p>
        <div className="option-row">
          {SLOT_OPTIONS.map((option) => (
            <button
              key={option.minutes}
              type="button"
              className={`option-chip ${slotMinutes === option.minutes ? 'is-active' : ''}`}
              onClick={() => setSlotMinutes(option.minutes)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {config.quantityTitle && (
        <div className="option-block">
          <p className="eyebrow">{config.quantityTitle}</p>
          <div className="option-row">
            {config.quantityOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={`option-chip ${quantity === value ? 'is-active' : ''}`}
                onClick={() => setQuantity(value)}
              >
                {value} {config.quantitySuffix}
              </button>
            ))}
          </div>
        </div>
      )}

      <section className="cost-summary">
        <span>Estimated cost</span>
        <strong>€{estimatedCost}</strong>
        <span className="dispatch-meta muted">{config.rateLabel(rate)}</span>
      </section>

      {error && <ErrorState message={error} />}

      <button type="button" className="primary-button full-width" onClick={confirmSelection} disabled={submitting}>
        {submitting ? 'Reserving…' : `Continue to payment · €${estimatedCost}`}
      </button>
    </div>
  );
}

