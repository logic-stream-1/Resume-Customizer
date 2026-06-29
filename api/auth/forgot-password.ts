import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await db.users.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "No account matches this email address." });
    }

    return res.status(200).json({ success: true, message: `Simulated reset link sent to ${email}!` });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "An error occurred during password reset request." });
  }
}
