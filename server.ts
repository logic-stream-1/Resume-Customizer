import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.ts";

// Load environment variables
dotenv.config();

// Ensure Gemini API key is available
if (!process.env.GEMINI_API_KEY_RC) {
  console.warn("WARNING: GEMINI_API_KEY_RC environment variable is missing.");
}

const app = express();
const PORT = 3000;

// Enable JSON bodies with generous limits
app.use(express.json({ limit: "15mb" }));

// User authentication, registration, profile configuration, and seeding routes
app.post("/api/auth/sign-up", async (req, res) => {
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
    res.json(result);
  } catch (error: any) {
    console.error("Sign up error:", error);
    res.status(500).json({ error: error.message || "An error occurred during sign up." });
  }
});

app.post("/api/auth/sign-in", async (req, res) => {
  try {
    const { email, password, isGoogleOAuth, googleEmail, googleName } = req.body;

    if (isGoogleOAuth) {
      if (!googleEmail) {
        return res.status(400).json({ error: "Google email is required for OAuth login." });
      }
      const result = await db.users.findOrCreateOAuth(googleEmail, googleName || "Google User");
      return res.json(result);
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
    res.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, createdAt: user.createdAt },
      config,
    });
  } catch (error: any) {
    console.error("Sign in error:", error);
    res.status(500).json({ error: error.message || "An error occurred during sign in." });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await db.users.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "No account matches this email address." });
    }

    res.json({ success: true, message: `Simulated reset link sent to ${email}!` });
  } catch (error: any) {
    res.status(500).json({ error: "An error occurred during password reset request." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
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

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (error: any) {
    res.status(500).json({ error: "An error occurred during password update." });
  }
});

app.post("/api/auth/delete-account", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const success = await db.users.deleteAccount(userId);
    if (!success) {
      return res.status(400).json({ error: "Failed to delete account. User not found." });
    }

    res.json({ success: true, message: "Account and associated data deleted permanently." });
  } catch (error: any) {
    res.status(500).json({ error: "An error occurred while deleting your account." });
  }
});

app.get("/api/auth/config", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }
    const config = await db.configs.findByUserId(userId);
    res.json({ config });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch user configuration." });
  }
});

app.post("/api/auth/config", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }
    const updates = req.body;
    const config = await db.configs.update(userId, updates);
    res.json({ config });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update configuration settings." });
  }
});

app.get("/api/runs", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }
    const runs = await db.runs.findByUserId(userId);
    res.json(runs);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve historical runs." });
  }
});

app.post("/api/runs", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }
    const runData = req.body;
    const newRun = await db.runs.create(userId, runData);
    res.json(newRun);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to store historical run." });
  }
});

app.get("/api/opportunities", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }
    const opportunities = await db.opportunities.findByUserId(userId);
    res.json(opportunities);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve matching opportunities." });
  }
});



// Initialize the shared server-side Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY_RC,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// JSON Schema for structured output
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    rewrittenSummary: {
      type: Type.STRING,
      description: "A tailored, highly compelling professional summary/profile adjusted to highlight experience matching the JD using its language, based ONLY on actual facts in the input resume."
    },
    rewrittenBullets: {
      type: Type.ARRAY,
      items: {
         type: Type.OBJECT,
         properties: {
           original: {
             type: Type.STRING,
             description: "The original bullet point or statement extracted from the input resume."
           },
           rewritten: {
             type: Type.STRING,
             description: "The rewritten bullet point incorporating relevant job description language and keywords. If no rephrasing is suitable or it would require fabricating experience, keep it identical. Crucially, NEVER fabricate, embellish, or invent metrics, job duration, tools, or achievements."
           },
           explanation: {
             type: Type.STRING,
             description: "Briefly explain the change or why it aligns with specific JD requirements (1 brief sentence)."
           }
         },
         required: ["original", "rewritten", "explanation"]
      },
      description: "List of bullets/achievements extracted from the input resume, each mapped to its rewritten version."
    },
    keywordAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          keyword: {
            type: Type.STRING,
            description: "The keyword or skill extracted from the Job Description."
          },
          status: {
            type: Type.STRING,
            description: "Must be exactly one of: 'Genuine Gap' (requested in JD but completely absent/unsupported in resume), 'Rephrase Opportunity' (present in resume under different wording, and tailored accordingly), or 'Matched' (already present and well-represented in the resume)."
          },
          context: {
            type: Type.STRING,
            description: "Brief connection explanation, e.g., 'Not mentioned in resume' or 'Replaced [old term] with [new term]' or 'Matched present skill'."
          }
        },
        required: ["keyword", "status", "context"]
      },
      description: "An analysis of the high-impact keywords and skills present in the JD, comparing them against the original resume."
    },
    atsScoreBefore: {
      type: Type.INTEGER,
      description: "An estimated match percentage (0 to 100) of the original resume against the JD, based on keyword coverage and phrasing."
    },
    atsScoreAfter: {
      type: Type.INTEGER,
      description: "An estimated match percentage (0 to 100) of the tailored resume against the JD, showing the optimization gain. This must be higher than the before score."
    }
  },
  required: ["rewrittenSummary", "rewrittenBullets", "keywordAnalysis", "atsScoreBefore", "atsScoreAfter"]
};

// POST route /api/tailor
app.post("/api/tailor", async (req, res) => {
  try {
    const { jobDescription, resume } = req.body;

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ error: "Job description is required." });
    }
    if (!resume || !resume.trim()) {
      return res.status(400).json({ error: "Original resume content is required." });
    }

    if (!process.env.GEMINI_API_KEY_RC) {
      return res.status(500).json({
        error: "Gemini API key is not configured in environment. Please add GEMINI_API_KEY_RC in Settings > Secrets."
      });
    }

    const systemInstruction = 
      "You are an expert recruitment consultant and ATS optimization engine.\n" +
      "Your core task is to tailor a user's resume for a specific Job Description (JD) without EVER fabricating experience.\n\n" +
      "CRITICAL SAFETY GAUNTLET & RULES:\n" +
      "1. NO FABRICATION: Under no circumstances should you invent, expand, embellish, or imply any job responsibilities, skills, tools, job titles, or metrics (e.g. percentages, dollar figures, team sizes) not explicitly stated in the source resume.\n" +
      "2. TEXT-TO-TEXT MAPPING: Extract bullet points/claims from the original resume. Rewrite them to align closer to the JD's phrasing and terminology ONLY if the user's actual underlying experience supports it. If a bullet point cannot be rephrased naturally or contextually without lying, keep it identical.\n" +
      "3. SUMMARY ALIGNMENT: Craft a compelling professional summary. It must only draw on details fully supported by the source resume, but highlight angles most beneficial for this specific JD. Crucially, the rewritten summary must NEVER contain the words 'tailor', 'tailored', 'tailoring', 'optimized', 'customized', 'matching', or 'aligned' when referring to this customization process. It must sound 100% natural, organic, and direct, as if written by the job seeker for their actual resume.\n" +
      "4. KEYWORD ANALYSIS: Extract the high-impact keywords and technical terms from the JD. Contrast them to the original resume. Mark each as:\n" +
      "   - 'Matched': The user's original resume already contains this keyword or equivalent.\n" +
      "   - 'Rephrase Opportunity': The user's resume has the exact skill/experience but uses separate wording. It can be rephrased.\n" +
      "   - 'Genuine Gap': The JD specifies this skill/tool, but there is absolutely no evidence of it in the resume. Crucially, do NOT add this keyword to any of the rewritten bullets or summaries if it is a Genuine Gap.\n" +
      "5. ESTIMATE ATS MATCH SCORES: Estimate a realistic ATS score before tailoring and after tailoring, to demonstrate progress from the keyword optimization.";

    const promptText = 
      "### JOB DESCRIPTION:\n" +
      `${jobDescription}\n\n` +
      "### ORIGINAL RESUME:\n" +
      `${resume}\n\n` +
      "Please parse, rewrite, and analyze keeping the no-fabrication rule as an absolute constraint.";

    // Attempt with fallback models to recover from temporary 503 / 429 high demand issues
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];

    let lastError: any = null;
    let responseText = "";
    let successfullyUsedModel = "";

    for (const model of modelsToTry) {
      try {
        console.log(`[Resume Customizer] Attempting resume tailoring using model: ${model}...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.1, // low temperature for high precision and compliance
          }
        });

        if (response && response.text) {
          responseText = response.text;
          successfullyUsedModel = model;
          console.log(`[Resume Customizer] Successfully generated output using model: ${model}`);
          break; // Exit loop on success
        }
      } catch (err: any) {
        console.error(`[Resume Customizer] Model ${model} failed:`, err.message || err);
        lastError = err;
      }
    }

    if (!responseText) {
      const errorMsg = lastError?.message || lastError || "All attempted models returned empty content.";
      throw new Error(`The Gemini API is currently experiencing a temporary high demand peak across all fallback models. Details: ${errorMsg}`);
    }

    // Parse safety check
    const data = JSON.parse(responseText.trim());
    // Attach model metadata for diagnostic transparency in the UI
    data.modelUsed = successfullyUsedModel;
    res.json(data);

  } catch (error: any) {
    console.error("Tailoring error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred during resume tailoring. Please try again."
    });
  }
});

// Middleware & routing settings
async function startServer() {
  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite dev server integrating...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Listen on port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Resume Customizer] Server listening on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
