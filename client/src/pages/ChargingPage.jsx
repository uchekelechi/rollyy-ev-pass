import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useLocation } from '../context/LocationContext.jsx';
import TopBar from '../components/TopBar.jsx';
import LocationBar from '../components/LocationBar.jsx';
import MapView from '../components/MapView.jsx';
import PlaceCard from '../components/PlaceCard.jsx';
import { LoadingState, EmptyState, ErrorState } from '../components/StateBlocks.jsx';

export default function ChargingPage() {
  const { coords } = useLocation();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!coords) return;
    setStatus('loading');
    setError('');
    api
      .chargingStations(coords.lat, coords.lon)
      .then((data) => {
        setStations(data.results);
        setStatus('ready');
      })
      .catch((cause) => {
        setError(cause.message);
        setStatus('error');
      });
  }, [coords]);

  return (
    <div className="screen">
      <TopBar title="Charging points" />
      <LocationBar />

      <section className="bot-callout">
        <div>
          <strong>Can't reach a station?</strong>
          <p>Compare nearby Rollyy bots and send one straight to your vehicle.</p>
        </div>
        <button type="button" className="primary-button compact" onClick={() => navigate('/charging/bot')} disabled={!coords}>
          Find a bot
        </button>
      </section>

      {status === 'ready' && stations.length > 0 && <MapView origin={coords} places={stations} kind="charging" />}

      {status === 'loading' && <LoadingState label="Finding charging stations…" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'ready' && stations.length === 0 && <EmptyState label="No charging stations found nearby." />}
      {status === 'ready' && stations.length > 0 && (
        <ul className="place-list">
          {stations.map((station) => (
            <PlaceCard
              key={station.id}
              place={station}
              meta={`${station.connectorType} · ${station.powerKw ? `${station.powerKw} kW` : 'power n/a'}`}
              badge={station.isOperational ? 'Available' : 'Check status'}
              onSelect={(place) => navigate('/charging/reserve', { state: { place } })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
