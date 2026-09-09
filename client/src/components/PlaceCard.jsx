function formatDistance(distanceKm) {
  if (distanceKm == null) return '';
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`;
}

// Generic result row used by Charging, Parking, and Car Wash lists.
export default function PlaceCard({ place, badge, meta, action, onSelect }) {
  const Main = onSelect ? 'button' : 'div';
  return (
    <li className={`place-card ${onSelect ? 'is-selectable' : ''}`}>
      <Main
        type={onSelect ? 'button' : undefined}
        className="place-card-main"
        onClick={onSelect ? () => onSelect(place) : undefined}
      >
        <p className="place-card-name">{place.name}</p>
        <p className="place-card-address">{place.address}</p>
        <p className="place-card-meta">
          {meta}
          {meta && place.distanceKm != null ? ' · ' : ''}
          {formatDistance(place.distanceKm)}
        </p>
      </Main>
      <div className="place-card-side">
        {place.isEstimated && <span className="badge badge-muted">Estimated</span>}
        {badge && <span className="badge">{badge}</span>}
        {action}
      </div>
    </li>
  );
}
