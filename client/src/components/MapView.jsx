import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function pin(label, tone) {
  return L.divIcon({
    className: 'map-pin-wrap',
    html: `<span class="map-pin ${tone}"><b>${label}</b></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

const PLACE_PIN_ICON = { maintenance: '🔧', bot: '🤖' };

// Free, keyless map built on Leaflet + the public OpenStreetMap tile server.
export default function MapView({ origin, places = [], kind }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !origin) return undefined;
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [origin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origin) return;
    layerRef.current?.clearLayers();
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    const points = [[origin.lat, origin.lon]];
    L.marker(points[0], { icon: pin('V', 'origin-pin') }).addTo(layer).bindPopup('You are here');

    places.forEach((place) => {
      if (place.lat == null || place.lon == null) return;
      points.push([place.lat, place.lon]);
      L.marker([place.lat, place.lon], { icon: pin(PLACE_PIN_ICON[kind] || '•', 'place-pin') })
        .addTo(layer)
        .bindPopup(place.name);
    });

    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 16 });
  }, [origin, places, kind]);

  return <div className="map-view" ref={containerRef} aria-label="Map of nearby results" />;
}
