import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../server/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  try {
    const opportunities = await db.opportunities.findByUserId(userId);
    return res.status(200).json(opportunities);
  } catch (error: any) {
    console.error("Retrieve opportunities error:", error);
    return res.status(500).json({ error: "Failed to retrieve matching opportunities." });
  }
}
