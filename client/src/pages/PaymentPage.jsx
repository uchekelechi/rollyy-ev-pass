import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import { ErrorState, LoadingState } from '../components/StateBlocks.jsx';

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ cardNumber: '', expiry: '', cvc: '', name: '' });
  const [payError, setPayError] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api
      .getReservation(id)
      .then(setReservation)
      .catch((cause) => setLoadError(cause.message));
  }, [id]);

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function pay(event) {
    event.preventDefault();
    setPaying(true);
    setPayError('');
    try {
      await api.payReservation(id, form);
      navigate(`/${reservation.kind}/reserve/${id}/confirmed`);
    } catch (cause) {
      setPayError(cause.message);
      setPaying(false);
    }
  }

  if (loadError) {
    return (
      <div className="screen">
        <TopBar title="Payment" showBack />
        <ErrorState message={loadError} />
      </div>
    );
  }
  if (!reservation) {
    return (
      <div className="screen">
        <TopBar title="Payment" showBack />
        <LoadingState label="Loading reservation…" />
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar title="Payment" showBack />

      <section className="cost-summary">
        <span>{reservation.place.name}</span>
        <strong>€{reservation.estimatedCost.toFixed(2)}</strong>
        <span className="dispatch-meta muted">{reservation.quantityLabel}</span>
      </section>

      <p className="dispatch-meta muted payment-notice">Simulated payment for this demo — no real card network is contacted.</p>

      <form className="issue-form payment-form" onSubmit={pay}>
        <label htmlFor="name">Cardholder name</label>
        <input id="name" required value={form.name} onChange={updateField('name')} placeholder="Jane Doe" />

        <label htmlFor="cardNumber">Card number</label>
        <input
          id="cardNumber"
          required
          inputMode="numeric"
          value={form.cardNumber}
          onChange={updateField('cardNumber')}
          placeholder="4242 4242 4242 4242"
        />

        <div className="option-row">
          <div className="field-group">
            <label htmlFor="expiry">Expiry</label>
            <input id="expiry" required value={form.expiry} onChange={updateField('expiry')} placeholder="MM/YY" />
          </div>
          <div className="field-group">
            <label htmlFor="cvc">CVC</label>
            <input id="cvc" required inputMode="numeric" value={form.cvc} onChange={updateField('cvc')} placeholder="123" />
          </div>
        </div>

        {payError && <ErrorState message={payError} />}

        <button type="submit" className="primary-button full-width" disabled={paying}>
          {paying ? 'Processing…' : `Pay €${reservation.estimatedCost.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
