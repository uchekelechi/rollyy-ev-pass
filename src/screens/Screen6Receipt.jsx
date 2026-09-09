import Receipt from '../components/Receipt/Receipt';
import { useAppState } from '../state/AppContext';

export default function Screen6Receipt() {
  const { state, reset } = useAppState();

  return (
    <div className="screen screen-6">
      <Receipt booking={state.booking} session={state.session} onRestart={reset} />
    </div>
  );
}
