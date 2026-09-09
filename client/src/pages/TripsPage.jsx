import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import { LoadingState, EmptyState, ErrorState } from '../components/StateBlocks.jsx';

const KIND_META = {
  charging: { icon: '⚡', label: 'Charging' },
  parking: { icon: 'P', label: 'Parking' },
  maintenance: { icon: '🔧', label: 'Maintenance' },
  carwash: { icon: '💧', label: 'Car wash' },
  bot: { icon: '🤖', label: 'Charging bot' }
};

function formatWhen(iso) {
  return new Date(iso).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Everything you've reserved, newest first — without this, a paid reservation just vanishes from the UI.
export default function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    api
      .listReservations()
      .then((data) => {
        setTrips(data.results);
        setStatus('ready');
      })
      .catch((cause) => {
        setError(cause.message);
        setStatus('error');
      });
  }, []);

  function openTrip(trip) {
    if (trip.status === 'pending_payment') {
      navigate(`/${trip.kind}/reserve/${trip.id}/pay`);
      return;
    }
    if (trip.kind === 'bot' && trip.dispatchJobId) {
      navigate(`/charging/bot/${trip.dispatchJobId}`);
      return;
    }
    navigate(`/${trip.kind}/reserve/${trip.id}/confirmed`);
  }

  async function cancelTrip(event, trip) {
    event.stopPropagation();
    if (trip.status === 'confirmed' && !window.confirm('This trip is already paid. Cancel and refund it?')) return;
    setCancellingId(trip.id);
    try {
      const updated = await api.cancelReservation(trip.id);
      setTrips((current) => current.map((item) => (item.id === trip.id ? updated : item)));
    } catch (cause) {
      setError(cause.message);
    } finally {
      setCancellingId(null);
    }
  }

  function statusLabel(trip) {
    if (trip.status === 'confirmed') return 'Confirmed';
    if (trip.status === 'cancelled') return 'Cancelled';
    return 'Pay now';
  }

  return (
    <div className="screen">
      <TopBar title="My trips" />
      {status === 'loading' && <LoadingState label="Loading your trips…" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'ready' && trips.length === 0 && (
        <EmptyState label="No trips yet. Reserve a charger, bot, spot, or shop to see it here." />
      )}
      {status === 'ready' && trips.length > 0 && (
        <ul className="place-list">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className={`place-card trip-card ${trip.status === 'cancelled' ? 'is-cancelled' : ''}`}
              onClick={() => trip.status !== 'cancelled' && openTrip(trip)}
              role="button"
              tabIndex={0}
            >
              <div className="place-card-main">
                <p className="place-card-name">
                  {KIND_META[trip.kind]?.icon} {trip.place.name}
                </p>
                <p className="place-card-address">{KIND_META[trip.kind]?.label} · {formatWhen(trip.createdAt)}</p>
                <p className="place-card-meta">{trip.quantityLabel} · €{trip.estimatedCost.toFixed(2)}</p>
              </div>
              <div className="place-card-side">
                <span className={`badge ${trip.status === 'confirmed' ? 'badge-strong' : trip.status === 'cancelled' ? 'badge-muted' : ''}`}>
                  {statusLabel(trip)}
                </span>
                {trip.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="cancel-link"
                    onClick={(event) => cancelTrip(event, trip)}
                    disabled={cancellingId === trip.id}
                  >
                    {cancellingId === trip.id ? 'Cancelling…' : trip.status === 'confirmed' ? 'Cancel & refund' : 'Cancel'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
