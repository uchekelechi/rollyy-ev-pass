const CONDITION_ICON = {
  'Clear sky': '☀️', 'Mostly clear': '🌤️', 'Partly cloudy': '⛅', 'Overcast': '☁️',
  'Fog': '🌫️', 'Depositing rime fog': '🌫️'
};

// Shared by WeatherChip and WeatherPage so the condition → emoji mapping only lives in one place.
export function iconForCondition(condition) {
  if (CONDITION_ICON[condition]) return CONDITION_ICON[condition];
  if (/rain|drizzle|shower/i.test(condition)) return '🌧️';
  if (/snow/i.test(condition)) return '❄️';
  if (/thunder/i.test(condition)) return '⛈️';
  return '🌡️';
}
