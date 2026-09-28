// Shared WebAuthn RP config. WEBAUTHN_RP_ID must be the bare domain (no
// scheme/port) the app is actually served from - "localhost" for local dev,
// the real domain in production (must match what's in PUBLIC_SITE_ORIGIN).
export const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";

export const EXPECTED_ORIGINS = [
  process.env.PUBLIC_SITE_ORIGIN,
  "http://localhost:3001", // `vercel dev`'s default port
].filter((value): value is string => Boolean(value));
