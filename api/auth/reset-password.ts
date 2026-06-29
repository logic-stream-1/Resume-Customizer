import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required." });
    }

    const newHash = "hash_" + newPassword;
    const success = await db.users.resetPassword(email, newHash);
    if (!success) {
      return res.status(400).json({ error: "Could not reset password. User not found." });
    }

    return res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "An error occurred during password update." });
  }
}
