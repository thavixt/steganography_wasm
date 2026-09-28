import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "../../lib/cors.js";
import { sql, type CredentialRow, type UserRow } from "../../lib/db.js";
import { getSession } from "../../lib/session.js";
import { RP_ID } from "../../lib/webauthn.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email } = (req.body ?? {}) as { email?: string };
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const users = await sql<
    UserRow[]
  >`SELECT * FROM users WHERE email = ${email}`;
  const user = users[0];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const credentials = await sql<CredentialRow[]>`
    SELECT credential_id FROM credentials WHERE user_id = ${user.id}
  `;
  if (credentials.length === 0) {
    res.status(400).json({ error: "No credentials registered for this user" });
    return;
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: credentials.map((c) => ({ id: c.credential_id })),
  });

  const session = await getSession(req, res);
  session.pendingChallenge = options.challenge;
  session.pendingEmail = email;
  session.pendingName = user.name;
  await session.save();

  res.status(200).json({ response: { publicKey: options } });
}
