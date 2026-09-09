import { useEffect } from 'react';
import EvPassQr from '../components/Pass/EvPassQr';
import { encodeEvPassJwt } from '../utils/jwt';
import { config } from '../config';
import { useAppState } from '../state/AppContext';

export default function Screen4Pass() {
  const { state, setPassJwt, goTo } = useAppState();
  const { booking } = state;

  useEffect(() => {
    if (booking && !state.passJwt) {
      const jwt = encodeEvPassJwt({
        bookingId: booking.bookingId,
        kWh: booking.kWh,
        stationId: booking.stationId,
        expiresAt: booking.expires,
        issuer: config.rollyy.jwtIssuer
      });
      setPassJwt(jwt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  if (!booking || !state.passJwt) return null;

  return (
    <div className="screen screen-4">
      <EvPassQr booking={booking} jwt={state.passJwt} onStartSession={() => goTo(5)} />
    </div>
  );
}
