import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/charging', label: 'Charge', icon: '⚡' },
  { to: '/parking', label: 'Park', icon: 'P' },
  { to: '/maintenance', label: 'Repair', icon: '🔧' },
  { to: '/carwash', label: 'Wash', icon: '💧' },
  { to: '/trips', label: 'Trips', icon: '🗒️' }
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `bottom-nav-item ${isActive ? 'is-active' : ''}`}>
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
