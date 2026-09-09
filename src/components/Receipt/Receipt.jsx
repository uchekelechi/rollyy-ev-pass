import { useEffect, useState } from 'react';
import { settleSession } from '../../services/rollyySettlement';
import { formatCurrency, formatKwh } from '../../utils/format';

export default function Receipt({ booking, session, onRestart }) {
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    settleSession({ booking, session }).then(setReceipt);
  }, [booking, session]);

  return (
    <div className="receipt">
      <h2>Session Complete ✅</h2>
      <p>
        {booking.stationName} · {formatKwh(session.kWh)} · {formatCurrency(booking.price)}
      </p>
      {receipt ? (
        <a className="receipt-link" href={receipt.receiptUrl} download={`${receipt.receiptId}.csv`}>
          Download receipt (CSV)
        </a>
      ) : (
        <p>Generating receipt…</p>
      )}
      <button onClick={onRestart}>Book Another Session</button>
    </div>
  );
}
