import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { applyCors } from "../../_lib/cors.js";
import { sql } from "../../_lib/db.js";
import { getSession } from "../../_lib/session.js";
import { RP_ID } from "../../_lib/webauthn.js";

const RP_NAME = "WASM Steganograpy by thavixt@github";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email, name } = (req.body ?? {}) as { email?: string; name?: string };
  if (!email || !name) {
    res.status(400).json({ error: "email and name are required" });
    return;
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    res
      .status(400)
      .json({ error: "Registration failed: email address is already in use." });
    return;
  }

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: email,
    userDisplayName: name,
    userID: new TextEncoder().encode(email),
    attestationType: "none",
  });

  // Temporary keys, promoted to the real session only after verify()
  // succeeds - mirrors the old PHP flow's "don't pre-log the user in".
  const session = await getSession(req, res);
  session.pendingChallenge = options.challenge;
  session.pendingEmail = email;
  session.pendingName = name;
  await session.save();

  res.status(200).json({ response: { publicKey: options } });
}
