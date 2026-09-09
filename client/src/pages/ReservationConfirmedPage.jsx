import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import { ErrorState, LoadingState } from '../components/StateBlocks.jsx';

export default function ReservationConfirmedPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getReservation(id)
      .then(setReservation)
      .catch((cause) => setError(cause.message));
  }, [id]);

  if (error) {
    return (
      <div className="screen">
        <TopBar title="Reservation" showBack />
        <ErrorState message={error} />
      </div>
    );
  }
  if (!reservation) {
    return (
      <div className="screen">
        <TopBar title="Reservation" showBack />
        <LoadingState label="Loading reservation…" />
      </div>
    );
  }

  const isBot = reservation.kind === 'bot' && reservation.dispatchJobId;

  return (
    <div className="screen">
      <TopBar title="Reservation confirmed" />
      <section className="dispatch-panel">
        <p className="eyebrow">Confirmation code</p>
        <h2>{reservation.confirmationCode}</h2>
        <p className="dispatch-meta">{reservation.place.name}</p>
        <p className="dispatch-meta muted">{reservation.place.address}</p>
        <p className="dispatch-meta muted">
          {reservation.quantityLabel} · €{reservation.estimatedCost.toFixed(2)} paid with card ending {reservation.cardLast4}
        </p>
      </section>
      <button
        type="button"
        className="primary-button full-width"
        onClick={() => navigate(isBot ? `/charging/bot/${reservation.dispatchJobId}` : `/${reservation.kind}`)}
      >
        {isBot ? 'Track my bot' : 'Done'}
      </button>
    </div>
  );
}
