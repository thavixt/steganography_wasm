import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { applyCors } from "../../_lib/cors.js";
import { sql } from "../../_lib/db.js";
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
  if (!pendingChallenge || !pendingEmail || !pendingName) {
    res
      .status(400)
      .json({ error: "No registration in progress for this session" });
    return;
  }

  try {
    const response = req.body as RegistrationResponseJSON;
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: pendingChallenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error("Registration could not be verified");
    }
    const { credential, fmt } = verification.registrationInfo;

    await sql.begin(async (tx) => {
      const inserted = await tx<{ id: number }[]>`
        INSERT INTO users (email, name, data)
        VALUES (${pendingEmail}, ${pendingName}, '{}'::json)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `;
      const userId =
        inserted[0]?.id ??
        (
          await tx<{ id: number }[]>`
            SELECT id FROM users WHERE email = ${pendingEmail}
          `
        )[0].id;

      await tx`
        INSERT INTO credentials
          (user_id, credential_id, public_key, attestation_format, sign_count)
        VALUES (
          ${userId},
          ${credential.id},
          ${Buffer.from(credential.publicKey).toString("base64")},
          ${fmt},
          ${credential.counter}
        )
      `;

      await tx`UPDATE users SET last_login = now() WHERE id = ${userId}`;
    });

    // Finalize login: promote the pending ceremony into the real session.
    session.email = pendingEmail;
    session.name = pendingName;
    session.loginTime = Date.now();
    clearPendingChallenge(session);
    await session.save();

    res.status(200).json({ response: "ok" });
  } catch (err) {
    session.destroy();
    res.status(400).json({
      error: err instanceof Error ? err.message : "Registration failed",
    });
  }
}
