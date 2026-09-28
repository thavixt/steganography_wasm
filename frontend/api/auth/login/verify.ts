import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type WebAuthnCredential,
} from "@simplewebauthn/server";
import { applyCors } from "../../_lib/cors.js";
import { sql, type CredentialRow } from "../../_lib/db.js";
import { clearPendingChallenge, getSession } from "../../_lib/session.js";
import { EXPECTED_ORIGINS, RP_ID } from "../../_lib/webauthn.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const session = await getSession(req, res);
  const { pendingChallenge, pendingEmail, pendingName } = session;
  if (!pendingChallenge || !pendingEmail) {
    res.status(400).json({ error: "Authentication challenge not found in session" });
    return;
  }

  try {
    const response = req.body as AuthenticationResponseJSON;

    const rows = await sql<CredentialRow[]>`
      SELECT * FROM credentials WHERE credential_id = ${response.id}
    `;
    const stored = rows[0];
    if (!stored) {
      throw new Error("Credential not recognized");
    }

    const credential: WebAuthnCredential = {
      id: stored.credential_id,
      publicKey: new Uint8Array(Buffer.from(stored.public_key, "base64")),
      counter: stored.sign_count,
    };

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: pendingChallenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
      credential,
    });

    if (!verification.verified) {
      throw new Error("Authentication could not be verified");
    }

    await sql`
      UPDATE credentials SET sign_count = ${verification.authenticationInfo.newCounter}
      WHERE id = ${stored.id}
    `;
    await sql`UPDATE users SET last_login = now() WHERE id = ${stored.user_id}`;

    session.email = pendingEmail;
    session.name = pendingName;
    session.loginTime = Date.now();
    clearPendingChallenge(session);
    await session.save();

    res.status(200).json({ response: "ok" });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Authentication failed",
    });
  }
}
