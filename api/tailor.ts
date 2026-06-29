import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

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

    // Initialize Gemini AI Client lazily per function request
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY_RC,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

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
            temperature: 0.1,
          }
        });

        if (response && response.text) {
          responseText = response.text;
          successfullyUsedModel = model;
          console.log(`[Resume Customizer] Successfully generated output using model: ${model}`);
          break;
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

    const data = JSON.parse(responseText.trim());
    data.modelUsed = successfullyUsedModel;
    return res.status(200).json(data);

  } catch (error: any) {
    console.error("Tailoring error:", error);
    return res.status(500).json({ 
      error: error.message || "An error occurred during resume tailoring. Please try again."
    });
  }
}
