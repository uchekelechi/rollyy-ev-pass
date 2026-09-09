export function LoadingState({ label = 'Loading…' }) {
  return <div className="state-block">{label}</div>;
}

export function EmptyState({ label }) {
  return <div className="state-block muted">{label}</div>;
}

export function ErrorState({ message }) {
  return <div className="error-banner">{message}</div>;
}
