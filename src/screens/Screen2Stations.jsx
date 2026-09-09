import StationList from '../components/StationList/StationList';
import { useAppState } from '../state/AppContext';

export default function Screen2Stations() {
  const { state, selectBundle, goTo } = useAppState();

  function handleSelect(bundle) {
    selectBundle(bundle);
    goTo(3);
  }

  return (
    <div className="screen screen-2">
      <h2>Chargers near {state.geo?.label ?? 'you'}</h2>
      <StationList bundles={state.bundles} onSelect={handleSelect} />
    </div>
  );
}
