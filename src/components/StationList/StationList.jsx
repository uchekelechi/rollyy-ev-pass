import { formatDistance } from '../../utils/geo';
import { formatCurrency } from '../../utils/format';

export default function StationList({ bundles, onSelect }) {
  if (!bundles.length) {
    return (
      <div className="no-results">
        <p>No chargers found nearby. Try a different location.</p>
      </div>
    );
  }

  return (
    <ul className="station-list">
      {bundles.map((bundle) => (
        <li key={bundle.bundleId} className="station-card">
          <div className="station-card-main">
            <h3>{bundle.stationName}</h3>
            <p>
              {bundle.kWhEstimate} kWh est. · {bundle.etaMinutes} min ETA
            </p>
            {bundle.distanceKm != null && <p>{formatDistance(bundle.distanceKm)} away</p>}
          </div>
          <div className="station-card-price">
            <strong>{formatCurrency(bundle.price)}</strong>
            <button onClick={() => onSelect(bundle)}>Select</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
