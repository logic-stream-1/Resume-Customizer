import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { email, password, isGoogleOAuth, googleEmail, googleName } = req.body;

    if (isGoogleOAuth) {
      if (!googleEmail) {
        return res.status(400).json({ error: "Google email is required for OAuth login." });
      }
      const result = await db.users.findOrCreateOAuth(googleEmail, googleName || "Google User");
      return res.status(200).json(result);
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: "Password is required." });
    }

    const user = await db.users.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "No user account was found with this email." });
    }

    const passwordHash = "hash_" + password;
    if (user.passwordHash !== passwordHash) {
      return res.status(400).json({ error: "Incorrect password. Please try again." });
    }

    const config = await db.configs.findByUserId(user.id);
    return res.status(200).json({
      user: { id: user.id, email: user.email, fullName: user.fullName, createdAt: user.createdAt },
      config,
    });
  } catch (error: any) {
    console.error("Sign in error:", error);
    return res.status(500).json({ error: error.message || "An error occurred during sign in." });
  }
}
