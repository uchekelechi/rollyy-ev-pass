import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'rollyy_ev_pass_state_v1';

const initialState = {
  screen: 1,
  intent: null, // { raw, targetSocPercent, location, time }
  geo: null, // { lat, lon, label }
  stations: [],
  bundles: [],
  selectedBundle: null,
  paymentIntent: null,
  booking: null,
  passJwt: null,
  session: null, // { kWh, elapsedSeconds, status }
  history: [],
  error: null
};

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return { ...initialState, ...parsed, error: null };
  } catch {
    return initialState;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(loadPersisted);

  useEffect(() => {
    const { history, booking, passJwt, session, screen } = state;
    // Persist only what's needed to auto-resume a session on reload (spec section 7).
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ history, booking, passJwt, session, screen })
    );
  }, [state]);

  const actions = useMemo(
    () => ({
      goTo: (screen) => setState((s) => ({ ...s, screen })),
      setIntent: (intent) => setState((s) => ({ ...s, intent })),
      setGeo: (geo) => setState((s) => ({ ...s, geo })),
      setStations: (stations) => setState((s) => ({ ...s, stations })),
      setBundles: (bundles) => setState((s) => ({ ...s, bundles })),
      selectBundle: (selectedBundle) => setState((s) => ({ ...s, selectedBundle })),
      setPaymentIntent: (paymentIntent) => setState((s) => ({ ...s, paymentIntent })),
      setBooking: (booking) => setState((s) => ({ ...s, booking })),
      setPassJwt: (passJwt) => setState((s) => ({ ...s, passJwt })),
      updateSession: (session) => setState((s) => ({ ...s, session })),
      completeSession: (session) =>
        setState((s) => ({
          ...s,
          session,
          history: [
            ...s.history,
            { booking: s.booking, session, completedAt: new Date().toISOString() }
          ]
        })),
      setError: (error) => setState((s) => ({ ...s, error })),
      reset: () => setState(initialState)
    }),
    []
  );

  const value = useMemo(() => ({ state, ...actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
