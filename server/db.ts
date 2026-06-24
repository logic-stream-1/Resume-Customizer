import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { User, UserConfig, HistoricalRun, Opportunity, BulletItem, KeywordItem } from "../src/types.ts";

const STORE_PATH = path.join(process.cwd(), "server_db_store.json");

interface DBStore {
  users: Record<string, User & { passwordHash: string }>;
  configs: Record<string, UserConfig>;
  runs: Record<string, HistoricalRun[]>;
  opportunities: Record<string, Opportunity[]>;
}

const initialStore: DBStore = {
  users: {},
  configs: {},
  runs: {},
  opportunities: {},
};

function loadLocalDB(): DBStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("[DB Store] Failed to read store file:", error);
  }
  return initialStore;
}

function saveLocalDB(store: DBStore) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (error) {
    console.error("[DB Store] Failed to write store file:", error);
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseSchema = process.env.SUPABASE_SCHEMA || "resume_custom";

export let supabase: any = null;
export let isUsingLocalFallback = true;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: supabaseSchema },
      auth: { persistSession: false }
    });
    isUsingLocalFallback = false;
    console.log(`[DB Service] Initialized Supabase on schema: ${supabaseSchema}`);
  } catch (err) {
    console.error("[DB Service] Supabase load error:", err);
    isUsingLocalFallback = true;
  }
} else {
  console.warn("[DB Service] Missing keys. Running in offline file fallback mode.");
  isUsingLocalFallback = true;
}

function mapDbUser(row: any): User & { passwordHash: string } {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  };
}

function mapDbConfig(row: any): UserConfig {
  return {
    id: row.id,
    userId: row.user_id,
    backgroundSummary: row.background_summary,
    targetSectors: row.target_sectors || [],
    activeRegion: row.active_region,
    personalPhone: row.personal_phone,
    personalLocation: row.personal_location,
    personalLinks: row.personal_links,
    personalTitle: row.personal_title,
  };
}

function mapDbRun(row: any): HistoricalRun {
  return {
    id: row.id,
    userId: row.user_id,
    jobDescription: row.job_description,
    originalResume: row.original_resume,
    rewrittenSummary: row.rewritten_summary,
    rewrittenBullets: row.rewritten_bullets || [],
    keywordAnalysis: row.keyword_analysis || [],
    atsScoreBefore: row.ats_score_before,
    atsScoreAfter: row.ats_score_after,
    createdAt: row.created_at,
  };
}

function mapDbOpportunity(row: any): Opportunity {
  return {
    id: row.id,
    company: row.company,
    title: row.title,
    sector: row.sector,
    region: row.region,
    score: row.score,
    wayInAngle: row.way_in_angle,
    newsDomain: row.news_domain,
    newsTitle: row.news_title,
    newsUrl: row.news_url,
  };
}

export async function seedDefaultRunForUser(userId: string, region: "India" | "Global", fullName: string): Promise<{ run: HistoricalRun; opportunities: Opportunity[] }> {
  const defaultResume = `
NAME: ${fullName}
TITLE: Senior React & TypeScript Engineer
EMAIL: user@example.com
PHONE: +91 98765 43210
LOCATION: ${region === "India" ? "Bangalore, India" : "San Francisco, USA"}

PROFESSIONAL SUMMARY:
Results-driven software engineer with 5+ years of experience building high-performance web applications using React, TypeScript, and modern JS stacks. Proven track record of optimizing client UI bundles and integrating backend APIs.

KEY ACHIEVEMENTS:
• Optimized bundle load speeds of the primary client dashboard by rewriting legacy routers and introducing modern compilation, reducing initial paint by 40%.
• Built dynamic data ingestion pipelines that parse and map thousands of JSON files to high-performance d3.js dashboards in real-time.
• Implemented robust client-side verification and strict type validation structures, decreasing form submit failure rates.
  `.trim();

  const defaultJD = region === "India" 
    ? "We are looking for a Senior React Developer in Bangalore to scale our merchant platform UI, optimize React components for fast loads, map payment transactional metrics onto real-time charts, and write strict TypeScript validation."
    : "We are looking for a Full-Stack Frontend Engineer to design interactive SaaS dashboards, optimize client bundling processes, build validation pipelines, and leverage React state management models.";

  const rewrittenSummary = region === "India"
    ? `Highly analytical and performance-focused Senior React & TypeScript Developer with 5+ years of software engineering experience. Proven history of scaling merchant platform UI structures, optimizing bundle loading speeds by 40%, and designing real-time data ingestion pipelines. Adept at building strict TypeScript validation rules and mapping complex transactional metrics onto responsive web dashboards to maximize system transparency and client success.`
    : `Performance-focused Senior Software Engineer with 5+ years of experience specialized in building SaaS applications and high-fidelity React/TypeScript dashboards. Proven history of driving visual precision, streamlining bundler compilation pipelines to shave 40% off initial paint, and engineering robust JSON/TypeScript data validation schemes to ensure data reliability across full-stack applications.`;

  const rewrittenBullets: BulletItem[] = [
    {
      original: "Optimized bundle load speeds of the primary client dashboard by rewriting legacy routers and introducing modern compilation, reducing initial paint by 40%.",
      rewritten: region === "India" 
        ? "Streamlined merchant platform UI bundle loads by refactoring routers and introducing modern compilation, reducing initial paint latency by 40%." 
        : "Engineered high-performance bundling pipelines to speed up SaaS UI delivery, reducing initial paint paint by 40% for active enterprise accounts.",
      explanation: "Better highlights the target platform context matching the Job Description requirements."
    },
    {
      original: "Built dynamic data ingestion pipelines that parse and map thousands of JSON files to high-performance d3.js dashboards in real-time.",
      rewritten: region === "India"
        ? "Engineered dynamic ingestion pipelines mapping thousands of transaction ledger files to interactive charts for live merchant metrics."
        : "Designed rich data dashboards displaying heavy data packets in real-time using robust React state models and lightweight canvas loaders.",
      explanation: "Emphasizes specific metric visualization and chart rendering requested in the JD."
    },
    {
      original: "Implemented robust client-side verification and strict type validation structures, decreasing form submit failure rates.",
      rewritten: "Architected bulletproof client-side verification engines and strict TypeScript validation structures, decreasing form errors.",
      explanation: "Highlights exact developer skills matching requested typing systems and validation standards."
    }
  ];

  const keywordAnalysis: KeywordItem[] = [
    { keyword: "React", status: "Matched", context: "Strongly demonstrated in history profile and custom hooks usage." },
    { keyword: "TypeScript", status: "Matched", context: "Utilized for strict structural typing and state mapping." },
    { keyword: "SaaS Dashboards", status: region === "Global" ? "Matched" : "Rephrase Opportunity", context: region === "Global" ? "Directly referenced in previous bullet points." : "Can highlight dashboard design accomplishments." },
    { keyword: "Transaction Metrics", status: region === "India" ? "Matched" : "Genuine Gap", context: region === "India" ? "Directly aligned with payment ledger rewrites." : "JD did not request this skill, keeping resume clean." },
    { keyword: "ATS Optimization", status: "Rephrase Opportunity", context: "Can highlight parsing and standard styling standards." }
  ];

  const runId = "seed_" + generateId();
  const seededRun: HistoricalRun = {
    id: runId,
    userId: userId,
    jobDescription: defaultJD,
    originalResume: defaultResume,
    rewrittenSummary: rewrittenSummary,
    rewrittenBullets: rewrittenBullets,
    keywordAnalysis: keywordAnalysis,
    atsScoreBefore: 68,
    atsScoreAfter: 94,
    createdAt: new Date().toISOString(),
  };

  const localOpportunities: Opportunity[] = [
    {
      id: "opp_1",
      company: region === "India" ? "RupeePay" : "Stripe",
      title: "Senior React Engineer - Payment Interface Group",
      sector: "FinTech",
      region: region,
      score: 94,
      wayInAngle: region === "India"
        ? "Direct experience optimizing transactional ledger bullet points matches RupeePay's payment systems expansion in Bangalore."
        : "Demonstrated ledger consistency and optimized API responses align directly with Stripe's global routing infrastructure.",
      newsDomain: region === "India" ? "YourStory" : "TechCrunch",
      newsTitle: region === "India" 
        ? "RupeePay raises $45M in Series B to expand regional merchant lending network"
        : "Stripe launches unified checkout API suite for platform developers",
      newsUrl: "#"
    },
    {
      id: "opp_2",
      company: region === "India" ? "MedScribe India" : "DeepHealth",
      title: "Front-End Developer - Clinical UI Solutions",
      sector: "HealthTech",
      region: region,
      score: 88,
      wayInAngle: region === "India"
        ? "Leverage React frontends and prompt engineering to match MedScribe's voice-to-text medical charting tools."
        : "Experience building high-fidelity client forms and validation fits perfectly into DeepHealth's patient intake interface team.",
      newsDomain: region === "India" ? "Inc42" : "Wired",
      newsTitle: region === "India"
        ? "MedScribe India secures CDSCO compliance for AI medical clinical transcription tools"
        : "DeepHealth partners with Mayo Clinic for predictive oncology diagnostic workflows",
      newsUrl: "#"
    },
    {
      id: "opp_3",
      company: region === "India" ? "NeuralIndic" : "Vercel",
      title: "Core Platform UI Architect (TypeScript)",
      sector: "SaaS",
      region: region,
      score: 91,
      wayInAngle: region === "India"
        ? "Your expertise with structured LLM JSON outputs directly supports NeuralIndic's localized Indic LLM orchestration layer."
        : "Advanced Vite setup and state management experience matches Vercel's Edge configuration interface group.",
      newsDomain: region === "India" ? "Inc42" : "TechCrunch",
      newsTitle: region === "India"
        ? "NeuralIndic secures strategic government backing for multi-lingual models"
        : "Vercel introduces Next.js server actions integration with Vite local devs",
      newsUrl: "#"
    },
    {
      id: "opp_4",
      company: region === "India" ? "LogiFast" : "PromptLayer",
      title: "Senior Product Engineer - Cloud Systems",
      sector: "SaaS",
      region: region,
      score: 85,
      wayInAngle: region === "India"
        ? "Optimizing tracking and dispatch systems with Vite UI perfectly solves LogiFast's live logistics panel load issues."
        : "Building full-stack validation loops for Gemini outputs matches PromptLayer's prompt management middleware platform.",
      newsDomain: region === "India" ? "YourStory" : "VentureBeat",
      newsTitle: region === "India"
        ? "LogiFast expands fast-delivery automated hubs to 50 tier-2 cities across India"
        : "PromptLayer secures $8M seed to monitor live LLM operations",
      newsUrl: "#"
    }
  ];

  if (!isUsingLocalFallback && supabase) {
    try {
      await supabase.from("runs").insert({
        id: seededRun.id,
        user_id: seededRun.userId,
        job_description: seededRun.jobDescription,
        original_resume: seededRun.originalResume,
        rewritten_summary: seededRun.rewrittenSummary,
        rewritten_bullets: seededRun.rewrittenBullets,
        keyword_analysis: seededRun.keywordAnalysis,
        ats_score_before: seededRun.atsScoreBefore,
        ats_score_after: seededRun.atsScoreAfter,
        created_at: seededRun.createdAt,
      });

      for (const opp of localOpportunities) {
        await supabase.from("opportunities").insert({
          id: opp.id,
          user_id: userId,
          company: opp.company,
          title: opp.title,
          sector: opp.sector,
          region: opp.region,
          score: opp.score,
          way_in_angle: opp.wayInAngle,
          news_domain: opp.newsDomain,
          news_title: opp.newsTitle,
          news_url: opp.newsUrl,
        });
      }
    } catch (e) {
      console.error("[Supabase Seeding Error] Falling back to local storage:", e);
    }
  }

  const store = loadLocalDB();
  store.runs[userId] = [seededRun];
  store.opportunities[userId] = localOpportunities;
  saveLocalDB(store);

  return { run: seededRun, opportunities: localOpportunities };
}

export const db = {
  users: {
    findByEmail: async (email: string) => {
      const normEmail = email.toLowerCase().trim();
      
      if (!isUsingLocalFallback && supabase) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", normEmail)
            .maybeSingle();

          if (error) throw error;
          if (data) return mapDbUser(data);
          return null;
        } catch (e) {
          console.error("[Supabase db.users.findByEmail Error] Falling back:", e);
        }
      }

      const store = loadLocalDB();
      return Object.values(store.users).find((u) => u.email.toLowerCase() === normEmail) || null;
    },

    create: async (email: string, passwordHash: string, fullName: string) => {
      const id = generateId();
      const normEmail = email.toLowerCase().trim();
      const createdAt = new Date().toISOString();

      const newUser = {
        id,
        email: normEmail,
        fullName,
        createdAt,
        passwordHash,
      };

      const configId = generateId();
      const newConfig: UserConfig = {
        id: configId,
        userId: id,
        backgroundSummary: "Experienced web developer focused on front-end scalability and UI efficiency.",
        targetSectors: ["SaaS", "FinTech"],
        activeRegion: "India",
        personalPhone: "+91 98765 43210",
        personalLocation: "Bangalore, India",
        personalLinks: "linkedin.com/in/username | github.com/username",
        personalTitle: "Senior React Developer",
      };

      if (!isUsingLocalFallback && supabase) {
        try {
          const { error: userErr } = await supabase.from("users").insert({
            id,
            email: normEmail,
            password_hash: passwordHash,
            full_name: fullName,
            created_at: createdAt,
          });
          if (userErr) throw userErr;

          const { error: configErr } = await supabase.from("user_configs").insert({
            id: configId,
            user_id: id,
            background_summary: newConfig.backgroundSummary,
            target_sectors: newConfig.targetSectors,
            active_region: newConfig.activeRegion,
            personal_phone: newConfig.personalPhone,
            personal_location: newConfig.personalLocation,
            personal_links: newConfig.personalLinks,
            personal_title: newConfig.personalTitle,
          });
          if (configErr) throw configErr;

          await seedDefaultRunForUser(id, "India", fullName);

          return { user: { id, email: normEmail, fullName, createdAt }, config: newConfig };
        } catch (e) {
          console.error("[Supabase db.users.create Error] Falling back:", e);
        }
      }

      const store = loadLocalDB();
      store.users[id] = newUser;
      store.configs[id] = newConfig;
      saveLocalDB(store);

      await seedDefaultRunForUser(id, "India", fullName);

      return { 
        user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, createdAt: newUser.createdAt }, 
        config: newConfig 
      };
    },

    findOrCreateOAuth: async (email: string, fullName: string) => {
      const normEmail = email.toLowerCase().trim();

      if (!isUsingLocalFallback && supabase) {
        try {
          const { data: existingUser, error: findErr } = await supabase
            .from("users")
            .select("*")
            .eq("email", normEmail)
            .maybeSingle();

          if (findErr) throw findErr;

          if (existingUser) {
            const { data: existingConfig, error: configErr } = await supabase
              .from("user_configs")
              .select("*")
              .eq("user_id", existingUser.id)
              .maybeSingle();

            if (configErr) throw configErr;

            return {
              user: { id: existingUser.id, email: existingUser.email, fullName: existingUser.full_name, createdAt: existingUser.created_at },
              config: existingConfig ? mapDbConfig(existingConfig) : null
            };
          }

          const id = generateId();
          const createdAt = new Date().toISOString();
          const dummyPassword = "oauth_simulated_password_hash_" + Math.random().toString();

          const { error: insertUserErr } = await supabase.from("users").insert({
            id,
            email: normEmail,
            password_hash: dummyPassword,
            full_name: fullName,
            created_at: createdAt,
          });
          if (insertUserErr) throw insertUserErr;

          const configId = generateId();
          const newConfig: UserConfig = {
            id: configId,
            userId: id,
            backgroundSummary: "Experienced engineer logged in via single-sign-on.",
            targetSectors: ["SaaS", "FinTech"],
            activeRegion: "Global",
            personalPhone: "+1 555-0100",
            personalLocation: "San Francisco, USA",
            personalLinks: "linkedin.com/in/oauth-profile",
            personalTitle: "Senior Software Engineer",
          };

          const { error: insertConfigErr } = await supabase.from("user_configs").insert({
            id: configId,
            user_id: id,
            background_summary: newConfig.backgroundSummary,
            target_sectors: newConfig.targetSectors,
            active_region: newConfig.activeRegion,
            personal_phone: newConfig.personalPhone,
            personal_location: newConfig.personalLocation,
            personal_links: newConfig.personalLinks,
            personal_title: newConfig.personalTitle,
          });
          if (insertConfigErr) throw insertConfigErr;

          await seedDefaultRunForUser(id, "Global", fullName);

          return { user: { id, email: normEmail, fullName, createdAt }, config: newConfig };
        } catch (e) {
          console.error("[Supabase db.users.findOrCreateOAuth Error] Falling back:", e);
        }
      }

      const store = loadLocalDB();
      const existing = Object.values(store.users).find((u) => u.email.toLowerCase() === normEmail);
      if (existing) {
        const config = store.configs[existing.id] || null;
        return { user: { id: existing.id, email: existing.email, fullName: existing.fullName, createdAt: existing.createdAt }, config };
      }

      const id = generateId();
      const newUser = {
        id,
        email: normEmail,
        fullName,
        createdAt: new Date().toISOString(),
        passwordHash: "oauth_simulated_password_hash_" + Math.random().toString(),
      };
      store.users[id] = newUser;

      const configId = generateId();
      const newConfig: UserConfig = {
        id: configId,
        userId: id,
        backgroundSummary: "Experienced engineer logged in via single-sign-on.",
        targetSectors: ["SaaS", "FinTech"],
        activeRegion: "Global",
        personalPhone: "+1 555-0100",
        personalLocation: "San Francisco, USA",
        personalLinks: "linkedin.com/in/oauth-profile",
        personalTitle: "Senior Software Engineer",
      };
      store.configs[id] = newConfig;
      saveLocalDB(store);

      await seedDefaultRunForUser(id, "Global", fullName);

      return { user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, createdAt: newUser.createdAt }, config: newConfig };
    },

    resetPassword: async (email: string, newPasswordHash: string) => {
      const normEmail = email.toLowerCase().trim();

      if (!isUsingLocalFallback && supabase) {
        try {
          const { data: user, error: findErr } = await supabase
            .from("users")
            .select("*")
            .eq("email", normEmail)
            .maybeSingle();

          if (findErr) throw findErr;

          if (user) {
            const { error: updateErr } = await supabase
              .from("users")
              .update({ password_hash: newPasswordHash })
              .eq("id", user.id);

            if (updateErr) throw updateErr;
            return true;
          }
          return false;
        } catch (e) {
          console.error("[Supabase db.users.resetPassword Error] Falling back:", e);
        }
      }

      const store = loadLocalDB();
      const user = Object.values(store.users).find((u) => u.email.toLowerCase() === normEmail);
      if (!user) return false;
      
      store.users[user.id].passwordHash = newPasswordHash;
      saveLocalDB(store);
      return true;
    },

    deleteAccount: async (userId: string) => {
      if (!isUsingLocalFallback && supabase) {
        try {
          const { error: delErr } = await supabase
            .from("users")
            .delete()
            .eq("id", userId);

          if (delErr) throw delErr;
          return true;
        } catch (e) {
          console.error("[Supabase db.users.deleteAccount Error] Falling back:", e);
        }
      }

      const store = loadLocalDB();
      if (!store.users[userId]) return false;

      delete store.users[userId];
      delete store.configs[userId];
      delete store.runs[userId];
      delete store.opportunities[userId];

      saveLocalDB(store);
      return true;
    },
  },

  configs: {
    findByUserId: async (userId: string) => {
      if (!isUsingLocalFallback && supabase) {
        try {
          const { data, error } = await supabase
            .from("user_configs")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (error) throw error;
          if (data) return mapDbConfig(data);
        } catch (e) {
          console.error("[Supabase db.configs.findByUserId Error] Falling back:", e);
        }
      }

      const store = loadLocalDB();
      return store.configs[userId] || null;
    },

    update: async (userId: string, updates: Partial<UserConfig>) => {
      const store = loadLocalDB();
      const existingConfig = store.configs[userId] || null;
      const prevRegion = existingConfig ? existingConfig.activeRegion : "India";

      if (!isUsingLocalFallback && supabase) {
        try {
          const dbPayload: Record<string, any> = {};
          if (updates.backgroundSummary !== undefined) dbPayload.background_summary = updates.backgroundSummary;
          if (updates.targetSectors !== undefined) dbPayload.target_sectors = updates.targetSectors;
          if (updates.activeRegion !== undefined) dbPayload.active_region = updates.activeRegion;
          if (updates.personalPhone !== undefined) dbPayload.personal_phone = updates.personalPhone;
          if (updates.personalLocation !== undefined) dbPayload.personal_location = updates.personalLocation;
          if (updates.personalLinks !== undefined) dbPayload.personal_links = updates.personalLinks;
          if (updates.personalTitle !== undefined) dbPayload.personal_title = updates.personalTitle;
          dbPayload.updated_at = new Date().toISOString();

          const { data, error } = await supabase
            .from("user_configs")
            .update(dbPayload)
            .eq("user_id", userId)
            .select()
            .maybeSingle();

          if (error) throw error;

          if (updates.activeRegion && updates.activeRegion !== prevRegion) {
            const { data: userRow } = await supabase.from("users").select("full_name").eq("id", userId).maybeSingle();
            const fullName = userRow ? userRow.full_name : "User";
            await seedDefaultRunForUser(userId, updates.activeRegion as "India" | "Global", fullName);
          }

          if (data) {
            store.configs[userId] = mapDbConfig(data);
            saveLocalDB(store);
            return mapDbConfig(data);
          }
        } catch (e) {
          console.error("[Supabase db.configs.update Error] Falling back:", e);
        }
      }

      if (!store.configs[userId]) return null;
      
      store.configs[userId] = { ...store.configs[userId], ...updates };
      saveLocalDB(store);

      const user = store.users[userId];
      if (updates.activeRegion && updates.activeRegion !== prevRegion && user) {
        await seedDefaultRunForUser(userId, updates.activeRegion as "India" | "Global", user.fullName);
      }

      return store.configs[userId];
    },
  },

  runs: {
    findByUserId: async (userId: string) => {
      if (!isUsingLocalFallback && supabase) {
        try {
          const { data, error } = await supabase
            .from("runs")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (error) throw error;
          if (data) return data.map(mapDbRun);
        } catch (e) {
          console.error("[Supabase db.runs.findByUserId Error] Falling back:", e);
        }
      }

      const store = loadLocalDB();
      return store.runs[userId] || [];
    },

    create: async (userId: string, run: Omit<HistoricalRun, "id" | "userId" | "createdAt">) => {
      const id = "run_" + generateId();
      const createdAt = new Date().toISOString();

      const newRun: HistoricalRun = {
        ...run,
        id,
        userId,
        createdAt,
      };

      if (!isUsingLocalFallback && supabase) {
        try {
          const { error } = await supabase.from("runs").insert({
            id,
            user_id: userId,
            job_description: run.jobDescription,
            original_resume: run.originalResume,
            rewritten_summary: run.rewrittenSummary,
            rewritten_bullets: run.rewrittenBullets,
            keyword_analysis: run.keywordAnalysis,
            ats_score_before: run.atsScoreBefore,
            ats_score_after: run.atsScoreAfter,
            created_at: createdAt,
          });

          if (error) throw error;
        } catch (e) {
          console.error("[Supabase db.runs.create Error] Falling back:", e);
        }
      }

      const store = loadLocalDB();
      if (!store.runs[userId]) {
        store.runs[userId] = [];
      }
      store.runs[userId].unshift(newRun);
      saveLocalDB(store);
      return newRun;
    },
  },

  opportunities: {
    findByUserId: async (userId: string) => {
      if (!isUsingLocalFallback && supabase) {
        try {
          const { data: oppsData, error: oppsErr } = await supabase
            .from("opportunities")
            .select("*")
            .eq("user_id", userId);

          if (oppsErr) throw oppsErr;

          const { data: configData, error: configErr } = await supabase
            .from("user_configs")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (configErr) throw configErr;

          if (oppsData) {
            const opps = oppsData.map(mapDbOpportunity);
            if (!configData) return opps;

            const config = mapDbConfig(configData);
            const targetSectorsLower = config.targetSectors.map((s) => s.toLowerCase());

            return opps.filter((opp) => {
              const matchesRegion = opp.region.toLowerCase() === config.activeRegion.toLowerCase();
              const matchesSector = targetSectorsLower.length === 0 || 
                targetSectorsLower.includes(opp.sector.toLowerCase()) ||
                opp.sector.toLowerCase() === "saas";
              return matchesRegion && matchesSector;
            });
          }
        } catch (e) {
          console.error("[Supabase db.opportunities.findByUserId Error] Falling back:", e);
        }
      }

      const store = loadLocalDB();
      const opps = store.opportunities[userId] || [];
      const config = store.configs[userId];
      if (!config) return opps;

      const targetSectorsLower = config.targetSectors.map((s) => s.toLowerCase());
      
      return opps.filter((opp) => {
        const matchesRegion = opp.region.toLowerCase() === config.activeRegion.toLowerCase();
        const matchesSector = targetSectorsLower.length === 0 || 
          targetSectorsLower.includes(opp.sector.toLowerCase()) ||
          opp.sector.toLowerCase() === "saas";
        return matchesRegion && matchesSector;
      });
    },
  },
};
