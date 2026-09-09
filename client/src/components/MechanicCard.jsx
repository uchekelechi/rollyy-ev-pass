function formatDistance(distanceKm) {
  if (distanceKm == null) return 'distance unknown';
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`;
}

// Maintenance-specific card: shows why a shop was recommended for the driver's described issue.
export default function MechanicCard({ shop, onSelect }) {
  const hasScore = shop.matchScore > 0;
  const Main = onSelect ? 'button' : 'div';
  return (
    <li className={`place-card mechanic-card ${hasScore ? 'is-recommended' : ''} ${onSelect ? 'is-selectable' : ''}`}>
      <Main type={onSelect ? 'button' : undefined} className="place-card-main" onClick={onSelect ? () => onSelect(shop) : undefined}>
        <p className="place-card-name">{shop.name}</p>
        <p className="place-card-address">{shop.address}</p>
        <p className="place-card-meta">{formatDistance(shop.distanceKm)}</p>
        {shop.matchReasons?.length > 0 && (
          <ul className="match-reasons">
            {shop.matchReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </Main>
      {hasScore && <span className="badge badge-strong">{shop.matchScore}% match</span>}
      {shop.isEstimated && <span className="badge badge-muted">Estimated</span>}
    </li>
  );
}
