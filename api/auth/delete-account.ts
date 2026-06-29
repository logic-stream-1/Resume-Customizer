import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const success = await db.users.deleteAccount(userId);
    if (!success) {
      return res.status(400).json({ error: "Failed to delete account. User not found." });
    }

    return res.status(200).json({ success: true, message: "Account and associated data deleted permanently." });
  } catch (error: any) {
    console.error("Delete account error:", error);
    return res.status(500).json({ error: "An error occurred while deleting your account." });
  }
}
