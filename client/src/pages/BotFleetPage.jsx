import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useLocation } from '../context/LocationContext.jsx';
import TopBar from '../components/TopBar.jsx';
import MapView from '../components/MapView.jsx';
import PlaceCard from '../components/PlaceCard.jsx';
import { LoadingState, EmptyState, ErrorState } from '../components/StateBlocks.jsx';

const SORT_OPTIONS = [
  { key: 'distance', label: 'Nearest', compare: (a, b) => a.distanceKm - b.distanceKm },
  { key: 'eta', label: 'Fastest', compare: (a, b) => a.etaMinutes - b.etaMinutes },
  { key: 'price', label: 'Cheapest', compare: (a, b) => a.dispatchFee - b.dispatchFee }
];

// Lets the driver compare nearby Rollyy bots (distance, ETA, battery, price) and pick one,
// instead of a single blind "send bot" click.
export default function BotFleetPage() {
  const { coords, label } = useLocation();
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState('distance');

  useEffect(() => {
    if (!coords) return;
    setStatus('loading');
    setError('');
    api
      .nearbyBots(coords.lat, coords.lon)
      .then((data) => {
        setBots(data.results.map((bot) => ({ ...bot, address: 'Currently roaming nearby' })));
        setStatus('ready');
      })
      .catch((cause) => {
        setError(cause.message);
        setStatus('error');
      });
  }, [coords]);

  const sortedBots = useMemo(() => {
    const compare = SORT_OPTIONS.find((option) => option.key === sortKey)?.compare;
    return compare ? [...bots].sort(compare) : bots;
  }, [bots, sortKey]);

  function selectBot(bot) {
    navigate('/bot/reserve', {
      state: {
        place: {
          id: bot.id,
          name: bot.name,
          address: `${bot.etaMinutes} min away · ${bot.batteryPercent}% battery · ${bot.chargeSpeedKw} kW`,
          lat: bot.lat,
          lon: bot.lon,
          etaMinutes: bot.etaMinutes,
          dispatchFee: bot.dispatchFee,
          vehicleLat: coords.lat,
          vehicleLon: coords.lon,
          vehicleLabel: label
        }
      }
    });
  }

  return (
    <div className="screen">
      <TopBar title="Choose a Rollyy bot" showBack />
      <p className="dispatch-meta muted" style={{ padding: '0 16px 12px' }}>
        Pick the bot you want, reserve it, and it starts driving to your vehicle once paid.
      </p>
      {status === 'loading' && <LoadingState label="Finding nearby Rollyy bots…" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'ready' && bots.length === 0 && <EmptyState label="No Rollyy bots available nearby right now." />}
      {status === 'ready' && bots.length > 0 && (
        <div className="option-row" style={{ padding: '0 16px 14px' }}>
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`option-chip ${sortKey === option.key ? 'is-active' : ''}`}
              onClick={() => setSortKey(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {status === 'ready' && bots.length > 0 && <MapView origin={coords} places={sortedBots} kind="bot" />}
      {status === 'ready' && bots.length > 0 && (
        <ul className="place-list">
          {sortedBots.map((bot) => (
            <PlaceCard
              key={bot.id}
              place={bot}
              meta={`ETA ${bot.etaMinutes} min · ${bot.batteryPercent}% battery`}
              badge={`€${bot.dispatchFee.toFixed(2)}`}
              onSelect={() => selectBot(bot)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
