import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { email, password, fullName } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: "Password is required." });
    }
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: "Full name is required." });
    }

    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    // Hash password simply for demonstration
    const passwordHash = "hash_" + password;
    const result = await db.users.create(email, passwordHash, fullName);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Sign up error:", error);
    return res.status(500).json({ error: error.message || "An error occurred during sign up." });
  }
}
