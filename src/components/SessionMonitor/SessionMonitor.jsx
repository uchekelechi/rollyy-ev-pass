import { useEffect, useRef, useState } from 'react';
import { startSessionSimulator } from '../../services/rollyySession';
import { formatDuration, formatKwh, formatCurrency } from '../../utils/format';

export default function SessionMonitor({ booking, onComplete }) {
  const [tick, setTick] = useState({ kWh: 0, elapsedSeconds: 0, status: 'charging' });
  const controllerRef = useRef(null);

  useEffect(() => {
    controllerRef.current = startSessionSimulator({
      targetKWh: booking.kWh,
      onTick: setTick,
      onComplete: (final) => onComplete(final)
    });
    return () => controllerRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.bookingId]);

  const pricePerKwh = booking.price / booking.kWh;
  const costSoFar = tick.kWh * pricePerKwh;

  return (
    <div className="session-monitor">
      <h2>Charging Session</h2>
      <p>{booking.stationName}</p>
      <div className="session-stats">
        <div>
          <span className="stat-label">Delivered</span>
          <strong>{formatKwh(tick.kWh)}</strong>
        </div>
        <div>
          <span className="stat-label">Elapsed</span>
          <strong>{formatDuration(tick.elapsedSeconds)}</strong>
        </div>
        <div>
          <span className="stat-label">Cost so far</span>
          <strong>{formatCurrency(costSoFar)}</strong>
        </div>
      </div>
      <progress value={tick.kWh} max={booking.kWh} />
      <button
        onClick={() => {
          controllerRef.current?.stop();
          onComplete(tick);
        }}
      >
        End Session
      </button>
    </div>
  );
}
