const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status}).`);
  return body;
}

function query(params) {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
  return search.toString() ? `?${search}` : '';
}

export const api = {
  geocodeSearch: (q) => request(`/geocode/search${query({ q })}`),
  geocodeReverse: (lat, lon) => request(`/geocode/reverse${query({ lat, lon })}`),
  chargingStations: (lat, lon) => request(`/charging/stations${query({ lat, lon })}`),
  nearbyBots: (lat, lon) => request(`/charging/bot/nearby${query({ lat, lon })}`),
  getBotDispatch: (id) => request(`/charging/bot/dispatch/${id}`),
  parking: (lat, lon) => request(`/parking${query({ lat, lon })}`),
  maintenance: (lat, lon, issue) => request(`/maintenance${query({ lat, lon, issue })}`),
  carwash: (lat, lon) => request(`/carwash${query({ lat, lon })}`),
  weather: (lat, lon) => request(`/weather${query({ lat, lon })}`),
  classifyIntent: (q) => request(`/intent${query({ q })}`),
  // Raw audio, not JSON, and never throws — callers fall back to browser speech on any failure.
  synthesizeSpeech: async (text) => {
    try {
      const response = await fetch(`${BASE_URL}/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!response.ok) return null;
      return await response.blob();
    } catch {
      return null;
    }
  },
  createReservation: (payload) =>
    request('/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  getReservation: (id) => request(`/reservations/${id}`),
  listReservations: () => request('/reservations'),
  cancelReservation: (id) => request(`/reservations/${id}/cancel`, { method: 'POST' }),
  payReservation: (id, payload) =>
    request(`/reservations/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
};
