import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  if (req.method === "GET") {
    try {
      const config = await db.configs.findByUserId(userId);
      return res.status(200).json({ config });
    } catch (error: any) {
      console.error("Fetch user config error:", error);
      return res.status(500).json({ error: "Failed to fetch user configuration." });
    }
  } else if (req.method === "POST") {
    try {
      const updates = req.body;
      const config = await db.configs.update(userId, updates);
      return res.status(200).json({ config });
    } catch (error: any) {
      console.error("Update user config error:", error);
      return res.status(500).json({ error: "Failed to update configuration settings." });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
