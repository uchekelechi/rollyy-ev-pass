import SessionMonitor from '../components/SessionMonitor/SessionMonitor';
import { useAppState } from '../state/AppContext';

export default function Screen5Session() {
  const { state, completeSession, goTo } = useAppState();

  function handleComplete(final) {
    completeSession(final);
    goTo(6);
  }

  return (
    <div className="screen screen-5">
      <SessionMonitor booking={state.booking} onComplete={handleComplete} />
    </div>
  );
}
