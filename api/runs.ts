import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../server/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  if (req.method === "GET") {
    try {
      const runs = await db.runs.findByUserId(userId);
      return res.status(200).json(runs);
    } catch (error: any) {
      console.error("Retrieve historical runs error:", error);
      return res.status(500).json({ error: "Failed to retrieve historical runs." });
    }
  } else if (req.method === "POST") {
    try {
      const runData = req.body;
      const newRun = await db.runs.create(userId, runData);
      return res.status(200).json(newRun);
    } catch (error: any) {
      console.error("Store historical run error:", error);
      return res.status(500).json({ error: "Failed to store historical run." });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
