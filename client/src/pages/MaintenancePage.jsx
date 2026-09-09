import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useLocation } from '../context/LocationContext.jsx';
import TopBar from '../components/TopBar.jsx';
import LocationBar from '../components/LocationBar.jsx';
import MapView from '../components/MapView.jsx';
import MechanicCard from '../components/MechanicCard.jsx';
import { LoadingState, EmptyState, ErrorState } from '../components/StateBlocks.jsx';

export default function MaintenancePage() {
  const { coords } = useLocation();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const autoIssue = routerLocation.state?.issue || '';
  const autoRanRef = useRef(false);
  const [issue, setIssue] = useState(autoIssue);
  const [results, setResults] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const runSearch = useCallback(
    async (issueText) => {
      if (!coords) return;
      setStatus('loading');
      setError('');
      setAiSummary('');
      try {
        const data = await api.maintenance(coords.lat, coords.lon, issueText.trim());
        setResults(data.results);
        setAiSummary(data.usedAi ? data.aiSummary : '');
        setStatus('ready');
      } catch (cause) {
        setError(cause.message);
        setStatus('error');
      }
    },
    [coords]
  );

  function handleSearch(event) {
    event.preventDefault();
    runSearch(issue);
  }

  // Arriving here from the home voice/text prompt already describes the issue — search right away.
  useEffect(() => {
    if (autoIssue && coords && !autoRanRef.current) {
      autoRanRef.current = true;
      runSearch(autoIssue);
    }
  }, [autoIssue, coords, runSearch]);

  return (
    <div className="screen">
      <TopBar title="Maintenance" />
      <LocationBar />

      <form className="issue-form" onSubmit={handleSearch}>
        <label htmlFor="issue">What's wrong with your car?</label>
        <textarea
          id="issue"
          rows={3}
          value={issue}
          onChange={(event) => setIssue(event.target.value)}
          placeholder="e.g. squeaking brakes and a flat tyre"
        />
        <button type="submit" className="primary-button" disabled={!coords || status === 'loading'}>
          {status === 'loading' ? 'Searching…' : 'Find a mechanic'}
        </button>
      </form>

      {status === 'ready' && aiSummary && (
        <p className="ai-diagnosis"><span>🤖 AI diagnosis</span> {aiSummary}</p>
      )}
      {status === 'ready' && results.length > 0 && <MapView origin={coords} places={results} kind="maintenance" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'loading' && <LoadingState label="Matching you with nearby mechanics…" />}
      {status === 'ready' && results.length === 0 && <EmptyState label="No repair shops found nearby." />}
      {status === 'ready' && results.length > 0 && (
        <ul className="place-list">
          {results.map((shop) => (
            <MechanicCard
              key={shop.id}
              shop={shop}
              onSelect={(selected) => navigate('/maintenance/reserve', { state: { place: selected } })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
