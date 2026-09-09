// Future contract: GET /session/{id} SSE -> {kWh, status}
// Simulated with setInterval "ticks" since there's no real WebSocket/SSE backend yet.
// Returns a controller with stop() so the UI can end the session.
export function startSessionSimulator({ targetKWh, onTick, onComplete, tickMs = 1000 }) {
  let elapsedKWh = 0;
  let elapsedSeconds = 0;
  const ratePerTick = targetKWh / 60; // reach target in ~60 ticks for a snappy demo

  const interval = setInterval(() => {
    elapsedSeconds += tickMs / 1000;
    elapsedKWh = Math.min(targetKWh, elapsedKWh + ratePerTick * (0.8 + Math.random() * 0.4));
    const status = elapsedKWh >= targetKWh ? 'completed' : 'charging';

    onTick?.({ kWh: Number(elapsedKWh.toFixed(2)), elapsedSeconds, status });

    if (status === 'completed') {
      clearInterval(interval);
      onComplete?.({ kWh: Number(elapsedKWh.toFixed(2)), elapsedSeconds });
    }
  }, tickMs);

  return {
    stop: () => clearInterval(interval)
  };
}
