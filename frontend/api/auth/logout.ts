import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "../_lib/cors.js";
import { getSession } from "../_lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const session = await getSession(req, res);
  session.destroy();

  res.status(200).json({ response: "" });
}
