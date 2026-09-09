import { useState } from 'react';
import { createMockPaymentIntent, confirmMockPayment } from '../../services/stripe';
import { createBooking } from '../../services/rollyyOrchestration';
import { formatCurrency } from '../../utils/format';

// Demo payment form (test card 4242 4242 4242 4242). In production this renders
// Stripe Elements (@stripe/react-stripe-js CardElement) instead of a plain input.
export default function BookingFlow({ bundle, onBooked, onError }) {
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [processing, setProcessing] = useState(false);

  async function handlePay(e) {
    e.preventDefault();
    setProcessing(true);
    try {
      const last4 = cardNumber.replace(/\s/g, '').slice(-4);
      if (last4 !== '4242') {
        throw new Error('Demo only accepts test card ending in 4242.');
      }
      const intent = await createMockPaymentIntent({ amount: bundle.price * 100 });
      const confirmed = await confirmMockPayment(intent.id, last4);
      if (confirmed.status !== 'succeeded') {
        throw new Error('Payment failed, please try another card.');
      }
      const booking = await createBooking({ bundle, paymentIntentId: confirmed.id });
      onBooked(booking);
    } catch (err) {
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form className="booking-form" onSubmit={handlePay}>
      <h2>Confirm &amp; Pay</h2>
      <p>
        {bundle.stationName} · {bundle.kWhEstimate} kWh · {formatCurrency(bundle.price)}
      </p>
      <label>
        Card number
        <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
      </label>
      <button type="submit" disabled={processing}>
        {processing ? 'Processing…' : `Pay ${formatCurrency(bundle.price)}`}
      </button>
    </form>
  );
}
