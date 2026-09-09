import { useNavigate } from 'react-router-dom';

// Shared page header with an optional back action; keeps every screen's top bar consistent.
export default function TopBar({ title, showBack = false }) {
  const navigate = useNavigate();
  return (
    <header className="top-bar">
      {showBack ? (
        <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="Go back">
          ←
        </button>
      ) : (
        <span className="brand-mark">R</span>
      )}
      <h1>{title}</h1>
      <span className="top-bar-spacer" />
    </header>
  );
}
