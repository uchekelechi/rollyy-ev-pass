// Open-Meteo: free, keyless weather API — no account or token required.
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const WEATHER_CODE_LABELS = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Heavy freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Showers', 82: 'Violent showers',
  85: 'Light snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm with hail'
};

function cacheKey(lat, lon) {
  return `${lat.toFixed(2)}:${lon.toFixed(2)}`;
}

export async function getWeather({ lat, lon }) {
  const key = cacheKey(lat, lon);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation');
  url.searchParams.set('timezone', 'auto');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Weather service error ${response.status}`);
    const payload = await response.json();
    const current = payload.current || {};
    const data = {
      temperatureC: current.temperature_2m ?? null,
      feelsLikeC: current.apparent_temperature ?? null,
      windSpeedKmh: current.wind_speed_10m ?? null,
      precipitationMm: current.precipitation ?? null,
      condition: WEATHER_CODE_LABELS[current.weather_code] ?? 'Unknown conditions',
      code: current.weather_code ?? null,
      observedAt: current.time ?? null
    };
    cache.set(key, { at: Date.now(), data });
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
