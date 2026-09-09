import BookingFlow from '../components/Booking/BookingFlow';
import { useAppState } from '../state/AppContext';

export default function Screen3Booking() {
  const { state, setBooking, setError, goTo } = useAppState();

  function handleBooked(booking) {
    setBooking(booking);
    goTo(4);
  }

  return (
    <div className="screen screen-3">
      <BookingFlow bundle={state.selectedBundle} onBooked={handleBooked} onError={setError} />
      {state.error && <p className="error">{state.error}</p>}
    </div>
  );
}
