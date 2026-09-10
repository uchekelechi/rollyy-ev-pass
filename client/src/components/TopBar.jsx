import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useLocation } from '../context/LocationContext.jsx';
import WeatherChip from './WeatherChip.jsx';

// Shared page header with an optional back action; keeps every screen's top bar consistent.
export default function TopBar({ title, showBack = false }) {
  const navigate = useNavigate();
  const { weather } = useLocation();
  return (
    <header className="top-bar">
      {showBack ? (
        <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="Go back">
          ←
        </button>
      ) : (
        <button type="button" className="icon-button brand-mark-button" onClick={() => navigate('/')} aria-label="Go to home">
          <img className="brand-mark" src={logo} alt="Rollyy" />
        </button>
      )}
      <h1>{title}</h1>
      <WeatherChip weather={weather} compact />
    </header>
  );
}
