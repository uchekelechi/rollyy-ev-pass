import { QRCodeSVG } from 'qrcode.react';

export default function EvPassQr({ booking, jwt, onStartSession }) {
  const passLink = `https://rollyy.demo/pass/${booking.bookingId}#${jwt}`;

  return (
    <div className="ev-pass">
      <h2>Your EV Pass</h2>
      <QRCodeSVG value={passLink} size={220} includeMargin />
      <p className="pass-meta">
        Booking {booking.bookingId} · {booking.stationName} · {booking.kWh} kWh
      </p>
      <a className="pass-link" href={passLink} target="_blank" rel="noreferrer">
        Open pass link
      </a>
      <button onClick={onStartSession}>Start Charging Session</button>
    </div>
  );
}
