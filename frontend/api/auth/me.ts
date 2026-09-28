import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "../lib/cors.js";
import { sql, type UserRow } from "../lib/db.js";
import { getSession } from "../lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const session = await getSession(req, res);
  if (!session.email || !session.loginTime) {
    res.status(200).json({ response: {} });
    return;
  }

  const users = await sql<UserRow[]>`
    SELECT * FROM users WHERE email = ${session.email}
  `;
  const user = users[0];
  if (!user) {
    res.status(200).json({ response: {} });
    return;
  }

  res.status(200).json({
    response: {
      user_data: {
        email: user.email,
        name: user.name,
        created: user.created,
        lastLogin: user.last_login
          ? user.last_login.getTime()
          : session.loginTime,
      },
    },
  });
}
