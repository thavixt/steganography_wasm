import { getIronSession, type IronSession } from "iron-session";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Replaces PHP's file-backed $_SESSION (which doesn't survive Vercel's
// ephemeral, horizontally-scaled function filesystem) with an encrypted,
// signed HttpOnly cookie. No server-side session storage at all - holds
// both the transient WebAuthn challenge for an in-progress ceremony
// (mirroring the old $_SESSION['temp_webauthn_challenge'] etc.) and the
// final logged-in session once auth completes.
export interface SessionData {
  email?: string;
  name?: string;
  loginTime?: number;
  pendingChallenge?: string;
  pendingEmail?: string;
  pendingName?: string;
}

const password: string = (() => {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "SESSION_SECRET environment variable must be set to a string of at least 32 characters",
    );
  }
  return value;
})();

export function getSession(
  req: VercelRequest,
  res: VercelResponse,
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, {
    cookieName: "stego_session",
    password,
    // 7 days, matching the old PHP session.cookie_lifetime.
    ttl: 60 * 60 * 24 * 7,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      // Vercel production deployments are always HTTPS; `vercel dev` runs
      // over plain HTTP locally and sets NODE_ENV=development - so this
      // mirrors the old backend's "only mark Secure when actually on
      // HTTPS" logic without needing to inspect per-request headers.
      secure: process.env.NODE_ENV === "production",
    },
  });
}

export function clearPendingChallenge(session: IronSession<SessionData>) {
  session.pendingChallenge = undefined;
  session.pendingEmail = undefined;
  session.pendingName = undefined;
}
