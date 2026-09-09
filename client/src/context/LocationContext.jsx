import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const LocationContext = createContext(null);

const DEFAULT_LABEL = 'Helsinki, Finland';

// Shared across every tab so switching between Charging/Parking/etc. keeps the same searched place.
export function LocationProvider({ children }) {
  const [label, setLabel] = useState(DEFAULT_LABEL);
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const searchByText = useCallback(async (query) => {
    setStatus('loading');
    setError('');
    try {
      const result = await api.geocodeSearch(query);
      setCoords({ lat: result.lat, lon: result.lon });
      setLabel(result.label);
      setStatus('ready');
    } catch (cause) {
      setError(cause.message);
      setStatus('error');
    }
  }, []);

  const useDeviceLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Location is not supported on this device.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: position }) => {
        const point = { lat: position.latitude, lon: position.longitude };
        setCoords(point);
        try {
          const { label: reverseLabel } = await api.geocodeReverse(point.lat, point.lon);
          setLabel(reverseLabel);
        } catch {
          setLabel(`${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}`);
        }
        setStatus('ready');
      },
      () => {
        setError('Location permission was not granted.');
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  const [weather, setWeather] = useState(null);

  // Refetch weather whenever the searched coordinates change; failures are non-fatal (chip just hides).
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    api
      .weather(coords.lat, coords.lon)
      .then((data) => { if (!cancelled) setWeather(data); })
      .catch(() => { if (!cancelled) setWeather(null); });
    return () => { cancelled = true; };
  }, [coords]);

  const value = useMemo(
    () => ({ label, setLabel, coords, status, error, searchByText, useDeviceLocation, weather }),
    [label, coords, status, error, searchByText, useDeviceLocation, weather]
  );

  // Try the device's real location first so a user in Stockholm isn't silently shown Helsinki
  // results; fall back to the default city quietly (no error banner) if permission is denied.
  useEffect(() => {
    if (!navigator.geolocation) {
      searchByText(DEFAULT_LABEL);
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: position }) => {
        const point = { lat: position.latitude, lon: position.longitude };
        setCoords(point);
        try {
          const { label: reverseLabel } = await api.geocodeReverse(point.lat, point.lon);
          setLabel(reverseLabel);
        } catch {
          setLabel(`${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}`);
        }
        setStatus('ready');
      },
      () => searchByText(DEFAULT_LABEL),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
