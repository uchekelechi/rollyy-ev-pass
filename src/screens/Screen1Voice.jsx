import { useState } from 'react';
import VoiceCapture from '../components/VoiceCapture/VoiceCapture';
import { geocode } from '../services/nominatim';
import { findChargersNear } from '../services/openChargeMap';
import { searchBundles } from '../services/rollyyOrchestration';
import { useAppState } from '../state/AppContext';

export default function Screen1Voice() {
  const { setIntent, setGeo, setStations, setBundles, setError, goTo } = useAppState();
  const [loading, setLoading] = useState(false);

  async function handleIntent(intent) {
    setIntent(intent);
    setError(null);
    setLoading(true);
    try {
      const location = intent.location || 'San Francisco';
      const geo = await geocode(location);
      if (!geo) throw new Error(`Could not find "${location}". Try a different place.`);
      setGeo(geo);

      const stations = await findChargersNear(geo);
      setStations(stations);

      const bundles = await searchBundles({
        stations,
        targetSocPercent: intent.targetSocPercent
      });
      setBundles(bundles);
      goTo(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen screen-1">
      <VoiceCapture onIntent={handleIntent} />
      {loading && <p className="loading">Finding chargers near you…</p>}
    </div>
  );
}
