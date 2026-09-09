import { loadStripe } from '@stripe/stripe-js';
import { config } from '../config';

let stripePromise;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(config.stripe.publishableKey);
  }
  return stripePromise;
}

// Demo "server" call — in production this hits your backend, which calls
// Stripe's PaymentIntents API with the secret key. Here we simulate the
// server round trip so the flow is wireable without a real backend.
export async function createMockPaymentIntent({ amount, currency = 'usd' }) {
  await new Promise((r) => setTimeout(r, config.mockLatencyMs ?? 500));
  return {
    id: `pi_demo_${Date.now()}`,
    clientSecret: `demo_secret_${Math.random().toString(36).slice(2)}`,
    amount,
    currency,
    status: 'requires_confirmation'
  };
}

export async function confirmMockPayment(paymentIntentId, cardNumberLast4 = '4242') {
  await new Promise((r) => setTimeout(r, 400));
  return {
    id: paymentIntentId,
    status: 'succeeded',
    last4: cardNumberLast4
  };
}
