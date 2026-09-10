import { useNavigate } from 'react-router-dom';

const CONDITION_ICON = {
  'Clear sky': '☀️', 'Mostly clear': '🌤️', 'Partly cloudy': '⛅', 'Overcast': '☁️',
  'Fog': '🌫️', 'Depositing rime fog': '🌫️'
};

function iconFor(condition) {
  if (CONDITION_ICON[condition]) return CONDITION_ICON[condition];
  if (/rain|drizzle|shower/i.test(condition)) return '🌧️';
  if (/snow/i.test(condition)) return '❄️';
  if (/thunder/i.test(condition)) return '⛈️';
  return '🌡️';
}

// Weather readout shown on the location bar of every service tab, and compact in the top bar.
// Clicking either variant opens the detailed weather screen for the current location.
export default function WeatherChip({ weather, compact = false }) {
  const navigate = useNavigate();
  if (!weather || weather.temperatureC == null) return null;
  return (
    <button
      type="button"
      className={compact ? 'weather-chip weather-chip-compact' : 'weather-chip'}
      onClick={() => navigate('/weather')}
      aria-label="View detailed weather"
    >
      <span aria-hidden="true">{iconFor(weather.condition)}</span>
      {Math.round(weather.temperatureC)}°C
      {!compact && ` · ${weather.condition}`}
      {!compact && weather.windSpeedKmh != null && ` · wind ${Math.round(weather.windSpeedKmh)} km/h`}
    </button>
  );
}
