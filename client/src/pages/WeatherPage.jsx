import TopBar from '../components/TopBar.jsx';
import { EmptyState } from '../components/StateBlocks.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { iconForCondition } from '../utils/weatherIcon.js';

// Detailed weather readout for the current searched/device location; reuses the shared
// LocationContext value so it always matches what's shown as a chip elsewhere in the app.
export default function WeatherPage() {
  const { label, weather } = useLocation();

  return (
    <div className="screen">
      <TopBar title="Weather" showBack />
      {!weather || weather.temperatureC == null ? (
        <EmptyState label="Weather isn't available for this location right now." />
      ) : (
        <div className="weather-detail">
          <p className="weather-detail-place">{label}</p>
          <div className="weather-detail-hero">
            <span aria-hidden="true">{iconForCondition(weather.condition)}</span>
            <span className="weather-detail-temp">{Math.round(weather.temperatureC)}°C</span>
          </div>
          <p className="weather-detail-condition">{weather.condition}</p>
          <div className="weather-detail-grid">
            <div className="weather-detail-card">
              <span className="weather-detail-card-label">Feels like</span>
              <span className="weather-detail-card-value">
                {weather.feelsLikeC != null ? `${Math.round(weather.feelsLikeC)}°C` : '—'}
              </span>
            </div>
            <div className="weather-detail-card">
              <span className="weather-detail-card-label">Wind</span>
              <span className="weather-detail-card-value">
                {weather.windSpeedKmh != null ? `${Math.round(weather.windSpeedKmh)} km/h` : '—'}
              </span>
            </div>
            <div className="weather-detail-card">
              <span className="weather-detail-card-label">Precipitation</span>
              <span className="weather-detail-card-value">
                {weather.precipitationMm != null ? `${weather.precipitationMm} mm` : '—'}
              </span>
            </div>
          </div>
          {weather.observedAt && (
            <p className="weather-detail-observed">Last observed {new Date(weather.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          )}
        </div>
      )}
    </div>
  );
}
