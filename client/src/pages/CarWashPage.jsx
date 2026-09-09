import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useLocation } from '../context/LocationContext.jsx';
import TopBar from '../components/TopBar.jsx';
import LocationBar from '../components/LocationBar.jsx';
import MapView from '../components/MapView.jsx';
import PlaceCard from '../components/PlaceCard.jsx';
import { LoadingState, EmptyState, ErrorState } from '../components/StateBlocks.jsx';

export default function CarWashPage() {
  const { coords } = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!coords) return;
    setStatus('loading');
    setError('');
    api
      .carwash(coords.lat, coords.lon)
      .then((data) => {
        setResults(data.results);
        setStatus('ready');
      })
      .catch((cause) => {
        setError(cause.message);
        setStatus('error');
      });
  }, [coords]);

  return (
    <div className="screen">
      <TopBar title="Car wash" />
      <LocationBar />
      {status === 'ready' && results.length > 0 && <MapView origin={coords} places={results} kind="carwash" />}
      {status === 'loading' && <LoadingState label="Finding car washes nearby…" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'ready' && results.length === 0 && <EmptyState label="No car washes found nearby." />}
      {status === 'ready' && results.length > 0 && (
        <ul className="place-list">
          {results.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onSelect={(selected) => navigate('/carwash/reserve', { state: { place: selected } })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
