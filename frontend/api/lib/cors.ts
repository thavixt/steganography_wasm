import type { VercelRequest, VercelResponse } from "@vercel/node";

// Frontend and API are served from the same Vercel deployment in
// production, so most real traffic is same-origin and never triggers CORS
// at all. This mainly matters for Vercel preview deployments (a different
// *.vercel.app subdomain per PR) and local dev.
function isAllowedOrigin(origin: string): boolean {
  if (!origin) {
    return false;
  }
  if (origin === process.env.PUBLIC_SITE_ORIGIN) {
    return true;
  }
  return (
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin)
  );
}

/**
 * Sets CORS headers and handles preflight requests. Returns true if the
 * caller should stop (an OPTIONS preflight was already answered).
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;
  if (typeof origin === "string" && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
