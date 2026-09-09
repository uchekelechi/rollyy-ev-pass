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

// Compact inline weather readout shown on the location bar of every service tab.
export default function WeatherChip({ weather }) {
  if (!weather || weather.temperatureC == null) return null;
  return (
    <p className="weather-chip">
      <span aria-hidden="true">{iconFor(weather.condition)}</span>
      {Math.round(weather.temperatureC)}°C · {weather.condition}
      {weather.windSpeedKmh != null && ` · wind ${Math.round(weather.windSpeedKmh)} km/h`}
    </p>
  );
}
