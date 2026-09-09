import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import { ErrorState, LoadingState } from '../components/StateBlocks.jsx';

const STATUS_COPY = {
  dispatched: 'Rollyy bot is being dispatched…',
  en_route: 'Your Rollyy bot is on its way.',
  arrived: 'Your Rollyy bot has arrived!',
  cancelled: 'This dispatch was cancelled.'
};

export default function BotDispatchPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await api.getBotDispatch(id);
        if (cancelled) return;
        setJob(data);
        if ((data.status === 'arrived' || data.status === 'cancelled') && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } catch (cause) {
        if (!cancelled) setError(cause.message);
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [id]);

  return (
    <div className="screen">
      <TopBar title="Rollyy bot" showBack />
      {error && <ErrorState message={error} />}
      {!job && !error && <LoadingState label="Connecting to your Rollyy bot…" />}
      {job && (
        <section className="dispatch-panel">
          <p className="eyebrow">{job.botName}</p>
          <h2>{STATUS_COPY[job.status] || 'Tracking dispatch…'}</h2>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.round((job.progress ?? 0) * 100)}%` }} />
          </div>
          <p className="dispatch-meta">
            {job.status === 'arrived' ? 'Arrived at your vehicle.' : `ETA ${job.etaMinutes} min`}
          </p>
          <p className="dispatch-meta muted">Heading to {job.vehicleLocation?.label}</p>
        </section>
      )}
    </div>
  );
}
