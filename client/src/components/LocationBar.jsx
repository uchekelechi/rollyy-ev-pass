import { useState } from 'react';
import { useLocation } from '../context/LocationContext.jsx';
import WeatherChip from './WeatherChip.jsx';

// Reused at the top of every service tab: text search + "use my location" + shared status feedback.
export default function LocationBar() {
  const { label, status, error, searchByText, useDeviceLocation, weather } = useLocation();
  const [query, setQuery] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (query.trim()) searchByText(query.trim());
  }

  return (
    <form className="location-bar" onSubmit={handleSubmit}>
      <div className="location-bar-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={label}
          aria-label="Search location"
          autoComplete="off"
        />
        <button type="button" className="icon-button" onClick={useDeviceLocation} aria-label="Use current location" title="Use current location">
          ⌖
        </button>
        <button type="submit" className="primary-button compact" disabled={status === 'loading'}>
          {status === 'loading' ? '…' : 'Go'}
        </button>
      </div>
      <WeatherChip weather={weather} />
      {status === 'error' && error && <p className="error-banner">{error}</p>}
    </form>
  );
}
