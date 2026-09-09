// Demo-only JWT encoder (base64url header.payload.signature). NOT cryptographically
// secure — real Rollyy passes must be signed server-side. Good enough to demonstrate
// the wallet/QR credential flow described in docs/architecture.md (Screen 4).

function base64url(input) {
  const json = typeof input === 'string' ? input : JSON.stringify(input);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function encodeEvPassJwt({ bookingId, kWh, stationId, expiresAt, issuer = 'rollyy_demo' }) {
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    iss: issuer,
    sub: bookingId,
    bookingId,
    kWh,
    stationId,
    iat: Math.floor(Date.now() / 1000),
    exp: expiresAt ? Math.floor(expiresAt / 1000) : Math.floor(Date.now() / 1000) + 3600
  };
  const encodedHeader = base64url(header);
  const encodedPayload = base64url(payload);
  // No real signature in demo mode; placeholder keeps the JWT shape valid.
  const signature = base64url(`${issuer}.demo-signature`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function decodeEvPassJwt(token) {
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch {
    return null;
  }
}
