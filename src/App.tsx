import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Clipboard, 
  Download, 
  Check, 
  AlertCircle, 
  AlertTriangle,
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  Search, 
  Info, 
  Trash2, 
  ThumbsUp,
  FileCheck2,
  RefreshCw,
  Eye,
  MinusCircle,
  PlusCircle,
  HelpCircle,
  LogOut,
  Settings,
  User as UserIcon,
  Building,
  ExternalLink,
  Calendar,
  Plus,
  LayoutDashboard,
  Briefcase,
  FileSignature,
  ShieldAlert,
  Save
} from "lucide-react";
import { sampleJobDescription, sampleResume } from "./sampleData";
import { TailoredResponse, BulletItem, KeywordItem } from "./types";
import { useAuth } from "./context/AuthContext";
import { AuthPages } from "./components/AuthPages";

export default function App() {
  const { user, config, loading: authLoading, logout, updateConfig, deleteAccount, runs, opportunities, loadRuns } = useAuth();

  // Navigation states
  const [currentView, setCurrentView] = useState<"dashboard" | "workspace" | "profile">("dashboard");

  // Input states
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  
  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Response state
  const [result, setResult] = useState<TailoredResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "bullets" | "keywords" | "preview">("summary");

  // Editable personal/contact details for instant resume assembly & formatting
  const [personalName, setPersonalName] = useState("John Doe");
  const [personalTitle, setPersonalTitle] = useState("Senior React Engineer");
  const [personalEmail, setPersonalEmail] = useState("john.doe@email.com");
  const [personalPhone, setPersonalPhone] = useState("+91 98765 43210");
  const [personalLocation, setPersonalLocation] = useState("Bangalore, India");
  const [personalLinks, setPersonalLinks] = useState("linkedin.com/in/johndoe | github.com/johndoe");
  const [copiedRichText, setCopiedRichText] = useState(false);

  // Profile configuration editing states
  const [profName, setProfName] = useState("");
  const [profTitle, setProfTitle] = useState("");
  const [profPhone, setProfPhone] = useState("");
  const [profLocation, setProfLocation] = useState("");
  const [profLinks, setProfLinks] = useState("");
  const [profSummary, setProfSummary] = useState("");
  const [profRegion, setProfRegion] = useState<"India" | "Global">("India");
  const [profSectors, setProfSectors] = useState<string[]>([]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Synchronize layout with current user configuration
  useEffect(() => {
    if (config && user) {
      setPersonalName(user.fullName || "John Doe");
      setPersonalTitle(config.personalTitle || "Senior React Developer");
      setPersonalEmail(user.email || "user@example.com");
      setPersonalPhone(config.personalPhone || "+91 98765 43210");
      setPersonalLocation(config.personalLocation || "Bangalore, India");
      setPersonalLinks(config.personalLinks || "linkedin.com/in/username | github.com/username");

      // Set profile form states
      setProfName(user.fullName);
      setProfTitle(config.personalTitle || "");
      setProfPhone(config.personalPhone || "");
      setProfLocation(config.personalLocation || "");
      setProfLinks(config.personalLinks || "");
      setProfSummary(config.backgroundSummary || "");
      setProfRegion(config.activeRegion || "India");
      setProfSectors(config.targetSectors || []);
    }
  }, [config, user]);

  // Visual state enhancers
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedBulletIndex, setCopiedBulletIndex] = useState<number | null>(null);
  const [approvedBullets, setApprovedBullets] = useState<Record<number, boolean>>({});
  const [editedSummary, setEditedSummary] = useState("");

  // Loading steps animation rotation
  const loadingSteps = [
    "Aligning with Applicant Tracking System (ATS) protocols...",
    "Extracting core competencies and active verbs from the Job Description...",
    "Scanning original resume achievements and metrics...",
    "Identifying 'Rephrase Opportunities' via semantic matching...",
    "Grooming professional summary to align layout language...",
    "Synthesizing customized bullets without introducing any fabrication...",
    "Auditing output against absolute safety compliance filters..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load sample data trigger
  const handleLoadSample = () => {
    setJobDescription(sampleJobDescription);
    setResume(sampleResume);
    setPersonalName("John Doe");
    setPersonalTitle("Senior React Engineer");
    setPersonalEmail("john.doe@email.com");
    setPersonalPhone("+91 98765 43210");
    setPersonalLocation("Bangalore, India");
    setPersonalLinks("linkedin.com/in/johndoe | github.com/johndoe");
    setError(null);
  };

  const handleClear = () => {
    setJobDescription("");
    setResume("");
    setResult(null);
    setError(null);
    setPersonalName("");
    setPersonalTitle("");
    setPersonalEmail("");
    setPersonalPhone("");
    setPersonalLocation("");
    setPersonalLinks("");
  };

  // Tailor Resume API Call
  const handleTailor = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a Job Description before proceeding.");
      return;
    }
    if (!resume.trim()) {
      setError("Please paste your original resume content before proceeding.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setApprovedBullets({});

    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription,
          resume,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${response.status}`);
      }

      const data: TailoredResponse = await response.json();
      setResult(data);
      setEditedSummary(data.rewrittenSummary);
      setActiveTab("summary");

      // Save this successful run to backend history
      if (user) {
        await fetch("/api/runs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id
          },
          body: JSON.stringify({
            jobDescription,
            originalResume: resume,
            rewrittenSummary: data.rewrittenSummary,
            rewrittenBullets: data.rewrittenBullets,
            keywordAnalysis: data.keywordAnalysis,
            atsScoreBefore: data.atsScoreBefore,
            atsScoreAfter: data.atsScoreAfter
          })
        }).catch((e) => console.error("Failed to persist tailoring run:", e));
        
        loadRuns(); // Refresh runs list
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during processing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Copy whole resume helper
  const handleCopyAll = () => {
    if (!result) return;
    
    // Format a high-fidelity plain-text resume
    const bulletsText = result.rewrittenBullets
      .map((b, i) => `${approvedBullets[i] !== false ? "• " + b.rewritten : "• " + b.original}`)
      .join("\n");
      
    const fullText = 
`${personalName.toUpperCase()}
${personalTitle.toUpperCase()}
${personalEmail} | ${personalPhone} | ${personalLocation}
${personalLinks}

PROFESSIONAL SUMMARY:
${editedSummary || result.rewrittenSummary}

PROFESSIONAL EXPERIENCE & KEY BULLETS:
${bulletsText}

---
Generated professionally with Resume Customizer`;

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Download plain text file helper
  const handleDownload = () => {
    if (!result) return;

    const bulletsText = result.rewrittenBullets
      .map((b, i) => `${approvedBullets[i] !== false ? "• " + b.rewritten : "• " + b.original}`)
      .join("\n");

    const fileContent = 
`${personalName.toUpperCase()}
${personalTitle.toUpperCase()}
${personalEmail} | ${personalPhone} | ${personalLocation}
${personalLinks}

======================
PROFESSIONAL SUMMARY
======================
${editedSummary || result.rewrittenSummary}

======================
PROFESSIONAL EXPERIENCE & ACHIEVEMENTS
======================
${bulletsText}

----------------------
Generated honestly via Resume Customizer. No experience, years, tools or metrics were fabricated.
`;

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${personalName.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const handleCopyMarkdown = () => {
    if (!result) return;
    const summaryText = editedSummary || result.rewrittenSummary;
    const bulletsText = result.rewrittenBullets
      .map((b, i) => `* ${approvedBullets[i] !== false ? b.rewritten : b.original}`)
      .join("\n");

    const markdownText = `
# ${personalName}
### ${personalTitle}
${personalEmail} | ${personalPhone} | ${personalLocation}
${personalLinks}

## Professional Profile
${summaryText}

## Key Professional Achievements
${bulletsText}
    `.trim();

    navigator.clipboard.writeText(markdownText);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleCopyRichTextHTML = () => {
    if (!result) return;
    
    const summaryText = editedSummary || result.rewrittenSummary;
    const bulletsHtml = result.rewrittenBullets
      .map((b, i) => {
        const text = approvedBullets[i] !== false ? b.rewritten : b.original;
        return `<li style="margin-bottom: 7px; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #333333;">${text}</li>`;
      })
      .join("");

    const htmlString = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #111111; line-height: 1.4;">
        <div style="text-align: center; border-bottom: 2px solid #333333; padding-bottom: 12px; margin-bottom: 16px;">
          <h1 style="margin: 0 0 4px 0; font-size: 26px; font-family: Helvetica, Arial, sans-serif; font-weight: bold; text-transform: uppercase; color: #111111; tracking: -0.5px;">${personalName}</h1>
          <p style="margin: 0 0 6px 0; font-size: 14px; font-family: Helvetica, Arial, sans-serif; font-weight: 500; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">${personalTitle}</p>
          <p style="margin: 0; font-size: 12px; color: #555555;">
            ${personalEmail} &nbsp;|&nbsp; ${personalPhone} &nbsp;|&nbsp; ${personalLocation}
          </p>
          ${personalLinks ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #555555;">${personalLinks}</p>` : ""}
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="margin: 0 0 8px 0; font-size: 15px; font-family: Helvetica, Arial, sans-serif; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; color: #1a202c; letter-spacing: 0.5px;">Professional Profile</h2>
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #2d3748; text-align: justify;">${summaryText}</p>
        </div>

        <div>
          <h2 style="margin: 0 0 8px 0; font-size: 15px; font-family: Helvetica, Arial, sans-serif; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; color: #1a202c; letter-spacing: 0.5px;">Key Professional Achievements</h2>
          <ul style="margin: 0; padding-left: 20px;">
            ${bulletsHtml}
          </ul>
        </div>
      </div>
    `;

    const blob = new Blob([htmlString], { type: "text/html" });
    const textBlob = new Blob([
`${personalName.toUpperCase()}
${personalTitle.toUpperCase()}
${personalEmail} | ${personalPhone} | ${personalLocation}
${personalLinks}

PROFESSIONAL PROFILE
${summaryText}

KEY PROFESSIONAL ACHIEVEMENTS
${result.rewrittenBullets.map((b, i) => `• ${approvedBullets[i] !== false ? b.rewritten : b.original}`).join("\n")}
`], { type: "text/plain" });

    try {
      const data = [
        new ClipboardItem({
          "text/html": blob,
          "text/plain": textBlob,
        })
      ];

      navigator.clipboard.write(data).then(() => {
        setCopiedRichText(true);
        setTimeout(() => setCopiedRichText(false), 2000);
      }).catch(err => {
        console.error("ClipboardItem failed fallback to text", err);
        navigator.clipboard.writeText(summaryText);
      });
    } catch (e) {
      // Fallback
      navigator.clipboard.writeText(summaryText);
    }
  };

  const handlePrintResume = () => {
    const summaryText = editedSummary || result.rewrittenSummary;
    const bulletsHtml = result.rewrittenBullets
      .map((b, i) => {
        const text = approvedBullets[i] !== false ? b.rewritten : b.original;
        return `<li>${text}</li>`;
      })
      .join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${personalName} - Resume</title>
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #2d3748;
                line-height: 1.6;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                background: #ffffff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #2d3748;
                padding-bottom: 12px;
                margin-bottom: 20px;
              }
              h1 {
                margin: 0 0 4px 0;
                font-size: 26px;
                font-weight: 700;
                text-transform: uppercase;
                color: #1a202c;
              }
              .title {
                margin: 0 0 6px 0;
                font-size: 13px;
                font-weight: 600;
                color: #4f46e5;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .contact {
                margin: 0;
                font-size: 11px;
                color: #4a5568;
              }
              h2 {
                margin: 24px 0 10px 0;
                font-size: 13px;
                font-weight: 700;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 5px;
                text-transform: uppercase;
                color: #1a202c;
                letter-spacing: 0.5px;
              }
              p {
                margin: 0 0 10px 0;
                font-size: 11.5px;
                text-align: justify;
                color: #2d3748;
              }
              ul {
                margin: 0;
                padding-left: 20px;
              }
              li {
                margin-bottom: 7px;
                font-size: 11.5px;
                color: #2d3748;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${personalName}</h1>
              <div class="title">${personalTitle}</div>
              <div class="contact">
                ${personalEmail} &nbsp;|&nbsp; ${personalPhone} &nbsp;|&nbsp; ${personalLocation}
              </div>
              ${personalLinks ? `<div class="contact" style="margin-top: 3px;">${personalLinks}</div>` : ""}
            </div>
            
            <div>
              <h2>Professional Profile</h2>
              <p>${summaryText}</p>
            </div>

            <div>
              <h2>Key Professional Achievements</h2>
              <ul>
                ${bulletsHtml}
              </ul>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = function() {
        printWindow.print();
      };
    }
  };

  // Individual copy helpers
  const handleCopySummary = () => {
    navigator.clipboard.writeText(editedSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBulletIndex(index);
    setTimeout(() => setCopiedBulletIndex(null), 2000);
  };

  const toggleApproveBullet = (index: number) => {
    setApprovedBullets((prev) => ({
      ...prev,
      [index]: prev[index] === false ? true : false,
    }));
  };

  // Profile management handlers (Point 8)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setError(null);

    if (!profName.trim()) {
      setError("Name cannot be empty.");
      setProfileSaving(false);
      return;
    }

    try {
      const success = await updateConfig({
        personalTitle: profTitle,
        personalPhone: profPhone,
        personalLocation: profLocation,
        personalLinks: profLinks,
        backgroundSummary: profSummary,
        activeRegion: profRegion,
        targetSectors: profSectors
      });

      if (success) {
        setProfileSuccess("Profile settings successfully updated and saved!");
        // Update user fullname in local session if possible
        if (user) {
          const updatedUser = { ...user, fullName: profName };
          localStorage.setItem("auth_user", JSON.stringify(updatedUser));
        }
      } else {
        setError("Could not update profile settings.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure you want to delete your account permanently? This action is irreversible and all your tailored runs and matched opportunities will be lost forever.")) {
      const success = await deleteAccount();
      if (success) {
        window.alert("Your account has been successfully deleted.");
        window.location.reload();
      } else {
        setError("Failed to delete account. Please try again.");
      }
    }
  };

  const handleProfileSectorToggle = (sector: string) => {
    if (profSectors.includes(sector)) {
      setProfSectors(profSectors.filter((s) => s !== sector));
    } else {
      setProfSectors([...profSectors, sector]);
    }
  };

  // Restore previous run handler (Point 7)
  const handleRestoreRun = (run: any) => {
    setJobDescription(run.jobDescription);
    setResume(run.originalResume);
    setResult({
      rewrittenSummary: run.rewrittenSummary,
      rewrittenBullets: run.rewrittenBullets,
      keywordAnalysis: run.keywordAnalysis,
      atsScoreBefore: run.atsScoreBefore,
      atsScoreAfter: run.atsScoreAfter
    });
    setEditedSummary(run.rewrittenSummary);
    setApprovedBullets({});
    setActiveTab("preview");
    setCurrentView("workspace"); // Switch to workspace view to let user see it!
  };

  // Handle credentials verification loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" id="auth_spinner" />
          <p className="text-xs text-slate-500 font-mono">Verifying user credentials...</p>
        </div>
      </div>
    );
  }

  // Handle authentication login/registry requirements
  if (!user) {
    return <AuthPages />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app_root">
      {/* Top Header & Navigation (Point 5) */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 py-3 shadow-xs" id="app_header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 py-1.5 bg-indigo-600 rounded-lg text-white font-display font-bold text-lg leading-none tracking-tight flex items-center justify-center">
              JD
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                TailorCraft ATS
                <span className="text-3xs px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full font-sans font-medium">
                  v2.0 Full-Stack
                </span>
              </h1>
              <p className="text-3xs text-slate-500 font-sans mt-0.5">
                Optimize summary & achievements honestly to clear applicant filters.
              </p>
            </div>
          </div>

          {/* Navigation Bar & Auth Status (Point 5) */}
          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex items-center bg-slate-100 p-1 rounded-lg" id="app_nav">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === "dashboard"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                id="nav_btn_dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView("workspace")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === "workspace"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                id="nav_btn_workspace"
              >
                <FileSignature className="w-3.5 h-3.5" />
                Workspace
              </button>
              <button
                onClick={() => setCurrentView("profile")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === "profile"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                id="nav_btn_profile"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </button>
            </nav>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800">{user.fullName}</div>
                <div className="text-3xs text-indigo-600 font-mono uppercase font-semibold">{config?.activeRegion || "India"} Sector Hub</div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Log Out Session"
                id="nav_btn_logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6" id="app_workspace">
        
        {/* VIEW 1: DASHBOARD HUB (Points 6 & 7) */}
        {currentView === "dashboard" && (
          <div className="space-y-6" id="dashboard_view">
            {/* Quick stats panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats_panel">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Completed Runs</div>
                  <div className="text-lg font-extrabold text-slate-800">{runs.length} Runs</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Recruitment Region</div>
                  <div className="text-lg font-extrabold text-slate-800">{config?.activeRegion || "India"}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Target Sectors</div>
                  <div className="text-sm font-bold text-slate-700 truncate max-w-[160px]">
                    {config?.targetSectors?.join(", ") || "None selected"}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Target Job Title</div>
                  <div className="text-sm font-bold text-slate-700 truncate max-w-[160px]">
                    {config?.personalTitle || "Developer"}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* HISTORICAL OPTIMIZATION RUNS (Point 7 - Left Column) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      ATS Optimization History
                    </h3>
                    <span className="text-2xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                      {runs.length} Saved
                    </span>
                  </div>

                  {runs.length === 0 ? (
                    <div className="text-center py-8 px-4 space-y-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <FileSignature className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600">No optimized runs found yet</p>
                        <p className="text-3xs text-slate-400 mt-1">Ready to align your resume with a JD? Head over to the workspace!</p>
                      </div>
                      <button
                        onClick={() => setCurrentView("workspace")}
                        className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Start Customizing
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                      {runs.map((run) => (
                        <div key={run.id} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-800 truncate max-w-[160px] md:max-w-[190px]">
                                {run.jobDescription.split("\n")[0].substring(0, 50) || "Job Customization"}...
                              </h4>
                              <p className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                                <Calendar className="w-3 h-3 shrink-0" />
                                {new Date(run.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                {run.atsScoreAfter}% Match
                              </span>
                              <div className="text-[9px] text-slate-400 mt-0.5 font-mono">gain +{run.atsScoreAfter - run.atsScoreBefore}%</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRestoreRun(run)}
                            className="w-full py-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-3xs font-bold text-slate-600 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Restore to Workspace
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* MATCHED OPPORTUNITIES FINDER (Point 6 - Right Column) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-emerald-500" />
                      Matched Opportunities Finder
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-3xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                        {config?.activeRegion}
                      </span>
                    </div>
                  </div>

                  {opportunities.length === 0 ? (
                    <div className="text-center py-12 px-4 space-y-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600">No matching jobs found in current filters</p>
                        <p className="text-3xs text-slate-400 mt-1">
                          Try adding more target industry sectors (like FinTech or SaaS) in your Profile Settings to view matching regional positions!
                        </p>
                      </div>
                      <button
                        onClick={() => setCurrentView("profile")}
                        className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Adjust Sector Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-3xs text-indigo-900 leading-normal">
                        ⚡ <strong>Warm Outreach Matcher:</strong> The system automatically extracts custom "Way-In" talking points matching your resume profile and links them with recent business news. Mention these in your cold outreach to dramatically increase response rates!
                      </div>

                      {opportunities.map((opp) => (
                        <div key={opp.id} className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-all space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                {opp.sector}
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-800 mt-1.5">{opp.title}</h4>
                              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                {opp.company}
                              </p>
                            </div>
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full shrink-0">
                              {opp.score}% Match
                            </span>
                          </div>

                          {/* Way-in outreach angle snippet */}
                          <div className="p-3 bg-slate-50 rounded-lg border-l-2 border-indigo-500 space-y-1">
                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Suggested Outreach Angle:</h5>
                            <p className="text-3xs text-slate-700 leading-relaxed italic">
                              "{opp.wayInAngle}"
                            </p>
                          </div>

                          {/* Industry Insight Feed */}
                          {opp.newsTitle && (
                            <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                                  Business Intel ({opp.newsDomain})
                                </span>
                              </div>
                              <a
                                href={opp.newsUrl}
                                className="text-3xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1 leading-snug hover:underline"
                              >
                                {opp.newsTitle}
                                <ExternalLink className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: CUSTOMIZER WORKSPACE (Standard Resume Customizer) */}
        {currentView === "workspace" && (
          <div className="space-y-6" id="workspace_view">
            {/* Top Split-Panel Section: Inputs on Left, Section Customizers on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="top_workspace_grid">
          
          {/* Left Side: paste panel */}
          <section className="flex flex-col gap-6" id="left_panel">
          
          {/* Informational Guidelines Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-900 shadow-xs">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5 leading-relaxed">
              <span className="font-bold block">Strict Safety Integrity Guard Active:</span>
              <p>
                Our alignment algorithm enforces 100% honesty. It identifies rephrase opportunities for your skills but <strong>never invents metrics, tools, or roles</strong>. It categorizes unmet items transparently as <span className="font-semibold text-amber-800">Genuine Gaps</span> so you write with absolute confidence.
              </p>
            </div>
          </div>

          {/* Job Description Card Area */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="jd_textarea" className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-indigo-500" />
                1. Target Job Description (JD)
              </label>
              <span className="text-2xs font-mono text-slate-400">
                {jobDescription.length > 0 ? `${jobDescription.length} chars` : "Required"}
              </span>
            </div>
            <textarea
              id="jd_textarea"
              placeholder="Paste the complete job posting description, required qualifications, and details here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-44 text-sm bg-slate-50/60 p-3 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring focus:ring-indigo-100 transition-all font-sans leading-relaxed resize-none"
            />
          </div>

          {/* Resume Card Area */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="resume_textarea" className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                2. Your Base Resume Details
              </label>
              <span className="text-2xs font-mono text-slate-400">
                {resume.length > 0 ? `${resume.length} chars` : "Required"}
              </span>
            </div>
            <textarea
              id="resume_textarea"
              placeholder="Paste your professional summary, bullet points, and work experience content here..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="w-full h-56 text-sm bg-slate-50/60 p-3 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring focus:ring-indigo-100 transition-all font-sans leading-relaxed resize-none"
            />
          </div>

          <button
            onClick={handleTailor}
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${
              loading 
                ? "bg-slate-300 text-slate-600 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-lg"
            }`}
            id="btn_tailor"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processing Resume Alignment...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Tailor Resume & Analyze Gaps
              </>
            )}
          </button>
          
          <div className="text-center">
            <span className="text-2xs text-slate-400 font-mono">
              ⚡ Powered by {result?.modelUsed || "Gemini 3.5 Flash"} | Structured Output Engine
            </span>
          </div>

        </section>

        {/* Right Side: Tailored output result panel */}
        <section className="flex flex-col" id="right_panel">
          
          {/* Initial State (Result Empty & Not Loading) */}
          {!result && !loading && !error && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center my-auto flex flex-col items-center justify-center gap-4 shadow-2xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
                <FileCheck2 className="w-10 h-10" />
              </div>
              <h3 className="text-base font-display font-bold text-slate-800">
                Awaiting Customization Inputs
              </h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Paste the target job description and your work history details to the left, then trigger tailoring to start optimizing.
              </p>
              <button 
                onClick={handleLoadSample}
                className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-lg transition-all"
              >
                1-Click Preset Test Run
              </button>
            </div>
          )}

          {/* Loading Animation States */}
          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-auto flex flex-col items-center justify-center gap-6 shadow-sm min-h-[500px]">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-indigo-500 absolute animate-pulse" />
              </div>
              
              <div className="space-y-2 max-w-sm">
                <h4 className="text-sm font-bold text-slate-800 animate-pulse">
                  Analyzing & Aligning Resumes
                </h4>
                <div className="h-10 flex items-center justify-center">
                  <p className="text-xs text-slate-500 italic text-center transition-all duration-300">
                    "{loadingSteps[loadingStep]}"
                  </p>
                </div>
              </div>

              {/* Progress Indicator Track Bar */}
              <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Message Panel */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center my-auto flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-10 h-10 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">Alignment Attempt Failed</h3>
              <p className="text-xs text-red-700 max-w-md leading-relaxed">{error}</p>
              <button
                onClick={handleTailor}
                className="text-xs font-semibold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Success Response Panel */}
          {result && !loading && !error && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden" id="tailored_result_view">
              
              {/* ATS Confidence Score Meter Container */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-3xs font-mono font-medium text-slate-400 uppercase tracking-widest block">
                      Compliance Analytics
                    </span>
                    <h3 className="text-sm font-display font-medium text-slate-100">
                      Estimated ATS Compatibility Index
                    </h3>
                  </div>
                </div>

                {/* Score Comparison Display Block */}
                <div className="flex items-center gap-4 bg-slate-800/80 p-2.5 px-4 rounded-xl border border-slate-750 shrink-0">
                  <div className="text-center">
                    <span className="text-3xs text-slate-400 uppercase block">Original</span>
                    <span className="text-sm font-mono font-bold text-slate-400">{result.atsScoreBefore}%</span>
                  </div>
                  <div className="text-indigo-400">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="text-center">
                    <span className="text-3xs text-emerald-400 uppercase block">Optimized</span>
                    <span className="text-base font-mono font-bold text-emerald-400">{result.atsScoreAfter}%</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full text-emerald-400 font-display font-bold text-2xs uppercase tracking-tight">
                    +{result.atsScoreAfter - result.atsScoreBefore}%
                  </div>
                </div>
              </div>

              {/* Action Ribbon Bar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
                <span className="text-2xs text-slate-500 italic block">
                  Preserving your exact years of experience, labels, & metrics.
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyAll}
                    className="text-2xs px-2.5 py-1.5 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition"
                    title="Copy tailored summary and active bullets"
                    id="btn_copy_all_tailored"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-3 h-3 text-indigo-600" />
                        Copied Plain Text!
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3 h-3" />
                        Copy Entire Output
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="text-2xs px-2.5 py-1.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 transition shadow-2xs"
                    title="Download as Plain Text (.txt)"
                    id="btn_download_txt"
                  >
                    <Download className="w-3 h-3" />
                    Download File
                  </button>
                </div>
              </div>

              {/* Tab Selector Navs */}
              <nav className="flex border-b border-slate-200 bg-slate-50/50" id="result_tabs_navigation">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`flex-1 text-center py-3 text-xs font-semibold border-b-2 transition ${
                    activeTab === "summary"
                      ? "border-indigo-600 text-indigo-600 bg-white font-semibold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab_summary"
                >
                  1. Summary & Profile
                </button>
                <button
                  onClick={() => setActiveTab("bullets")}
                  className={`flex-1 text-center py-3 text-xs font-semibold border-b-2 transition ${
                    activeTab === "bullets"
                      ? "border-indigo-600 text-indigo-600 bg-white font-semibold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab_bullets"
                >
                  2. Bullet Achievements ({result.rewrittenBullets.length})
                </button>
                <button
                  onClick={() => setActiveTab("keywords")}
                  className={`flex-1 text-center py-3 text-xs font-semibold border-b-2 transition ${
                    activeTab === "keywords"
                      ? "border-indigo-600 text-indigo-600 bg-white font-semibold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab_keywords"
                >
                  3. Keyword Gaps ({result.keywordAnalysis.length})
                </button>
              </nav>

              {/* Tab Content Display */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5" id="output_tabs_content">
                
                {/* 1. Summary Tab View */}
                {activeTab === "summary" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xs text-indigo-600 font-mono tracking-widest font-bold uppercase block">
                        Aligned Profile/Summary
                      </span>
                      <button 
                        onClick={handleCopySummary}
                        className="text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition"
                        title="Copy Summary To Clipboard"
                      >
                        {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        className="w-full min-h-[160px] text-sm leading-relaxed p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-800"
                        placeholder="Customize summary further..."
                      />
                      <span className="absolute bottom-2 right-2 text-3xs font-mono text-slate-400">
                        Editable Canvas Textbox
                      </span>
                    </div>

                    <div className="rounded-lg bg-indigo-50/50 p-3 border border-indigo-100 text-3xs flex gap-2.5 leading-relaxed text-indigo-900">
                      <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <p>
                        This summary balances your professional history with semantic phrasing matched precisely to the target company's objectives. Add/edit as needed before extracting!
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Bullets Tab View (Interactive Comparator) */}
                {activeTab === "bullets" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-2xs text-slate-500 italic">
                      <p>Review and toggle each suggestion. Exclude rewrites that feel unfitting.</p>
                      <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-sans font-semibold shrink-0">
                        Safeguarded Engine
                      </span>
                    </div>

                    <div className="space-y-5">
                      {result.rewrittenBullets.map((bullet: BulletItem, idx: number) => {
                        const isExcluded = approvedBullets[idx] === false;
                        return (
                          <div 
                            key={idx}
                            className={`p-4 rounded-xl border transition-all ${
                              isExcluded 
                                ? "bg-slate-50 border-slate-200 opacity-60" 
                                : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2 p-1 bg-slate-50 rounded-lg">
                              <span className="text-3xs font-mono font-medium text-slate-500 uppercase tracking-widest pl-1">
                                Experiences Bullet {idx+1}
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleCopyBullet(isExcluded ? bullet.original : bullet.rewritten, idx)}
                                  className="text-3xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded transition flex items-center gap-1 font-sans"
                                  title="Copy current active bullet"
                                >
                                  {copiedBulletIndex === idx ? (
                                    <>
                                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Clipboard className="w-2.5 h-2.5 text-slate-400" />
                                      Copy Unit
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => toggleApproveBullet(idx)}
                                  className={`text-3xs px-2 py-1 border rounded transition font-medium flex items-center gap-1 font-sans ${
                                    isExcluded 
                                      ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100" 
                                      : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                  }`}
                                  title={isExcluded ? "Accept optimized revision" : "Keep original bullet"}
                                >
                                  {isExcluded ? (
                                    <>
                                      <PlusCircle className="w-2.5 h-2.5" />
                                      Use Optimize
                                    </>
                                  ) : (
                                    <>
                                      <MinusCircle className="w-2.5 h-2.5" />
                                      Reset Original
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Dual Side-By-Side Comparison Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {/* Left column: Original content */}
                              <div className="p-3 bg-slate-50/60 rounded-lg text-slate-500 text-xs leading-relaxed border-l-3 border-slate-300">
                                <span className="text-3xs font-mono font-bold block text-slate-400 uppercase tracking-tight mb-1">
                                  Original Text
                                </span>
                                <p className={isExcluded ? "font-medium text-slate-700" : ""}>{bullet.original}</p>
                              </div>

                              {/* Right column: Tailored optimized content */}
                              <div className={`p-3 rounded-lg text-xs leading-relaxed transition ${
                                isExcluded 
                                  ? "bg-slate-50 text-slate-400 border-l-3 border-slate-300" 
                                  : "bg-emerald-50/40 text-slate-800 border-l-3 border-emerald-500"
                              }`}>
                                <span className="text-3xs font-mono font-bold block text-slate-400 uppercase tracking-tight mb-1">
                                  Tailored Revision
                                </span>
                                <p className={isExcluded ? "" : "font-medium text-emerald-950"}>{bullet.rewritten}</p>
                              </div>
                            </div>

                            {/* Bullet modification rationale */}
                            {bullet.explanation && (
                              <div className="mt-2.5 pl-3 border-l-2 border-indigo-200 text-3xs text-slate-500 italic font-sans">
                                <strong>Alignment Reason:</strong> {bullet.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Keywords/Gaps Tab View */}
                {activeTab === "keywords" && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 shrink-0 leading-normal text-xs text-slate-600 space-y-1">
                      <span className="font-bold block text-slate-800">Reading the Keyword Audit Matrix:</span>
                      <p>
                        We extract critical terms requested by the employer from the job description and compare them directly with your original experiences:
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2">
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold text-3xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Matched: Already fully present.
                        </span>
                        <span className="inline-flex items-center gap-1 text-blue-800 font-semibold text-3xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Rephrase Opportunity: Present using synonyms. Align it.
                        </span>
                        <span className="inline-flex items-center gap-1 text-rose-800 font-semibold text-3xs font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Genuine Gap: Absolutely missing. Add if true.
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {result.keywordAnalysis.map((item: KeywordItem, i: number) => {
                        const statusColors = {
                          "Matched": "bg-emerald-50 border-emerald-150 text-emerald-900 border-l-4 border-l-emerald-500",
                          "Rephrase Opportunity": "bg-blue-50 border-blue-150 text-indigo-900 border-l-4 border-l-blue-500",
                          "Genuine Gap": "bg-rose-50/70 border-rose-150 text-rose-950 border-l-4 border-l-rose-500 font-sans"
                        };

                        const badgeColors = {
                          "Matched": "bg-emerald-100 text-emerald-800",
                          "Rephrase Opportunity": "bg-indigo-100 text-indigo-800",
                          "Genuine Gap": "bg-rose-100 text-rose-800 font-sans"
                        };

                        return (
                          <div 
                            key={i}
                            className={`p-3.5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-relaxed transition ${statusColors[item.status] || "bg-slate-50"}`}
                          >
                            <div className="space-y-1">
                              <span className="font-mono font-bold tracking-tight text-sm">
                                {item.keyword}
                              </span>
                              <p className="text-3xs text-slate-500 leading-snug">{item.context}</p>
                            </div>
                            
                            <span className={`text-3xs font-semibold px-2.5 py-1 rounded-full text-center shrink-0 w-fit ${badgeColors[item.status]}`}>
                              {item.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ready-to-Send Resume Tip inside tabs */}
                {activeTab === "summary" && (
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-2xs text-indigo-900 leading-normal">
                    💡 <strong>Live Resume Sync:</strong> Any updates you save to your profile summary here are immediately compiled into the complete ready-to-send formatted document in the frame below.
                  </div>
                )}
                {activeTab === "bullets" && (
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-2xs text-indigo-900 leading-normal">
                    💡 <strong>Interactive Bullet Sorter:</strong> Toggling achievements on/off here live-swaps them inside the formatted resume preview frame below in real-time.
                  </div>
                )}

              </div>
            </div>
          )}

        </section>

        </div> {/* End of top_workspace_grid */}

        {/* NEW: Continuous Live Formatted Ready-to-Send Resume Preview Frame below the columns */}
        {result && !loading && !error && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col" id="bottom_live_preview">
            
            {/* Header section with live indicator & actions */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                  <FileCheck2 className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-display font-bold text-slate-100 tracking-tight">
                      Ready-to-Send Resume Document
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      ● Live Sync Active
                    </span>
                  </div>
                  <p className="text-2xs text-slate-400 font-sans mt-0.5">
                    This frame automatically reflects your summary edits and checked achievements in real-time. Use the options below to copy or print!
                  </p>
                </div>
              </div>

              {/* Toolbar button controls */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                <button
                  onClick={handleCopyRichTextHTML}
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                  id="bottom_btn_copy_rich_text"
                >
                  {copiedRichText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      Ready for Google Docs/Word!
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5" />
                      Copy for Google Docs / Word
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrintResume}
                  className="text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-750 hover:text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  id="bottom_btn_print_pdf"
                >
                  <Download className="w-3.5 h-3.5" />
                  Print / Save as PDF
                </button>

                <button
                  onClick={handleCopyMarkdown}
                  className="text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-750 hover:text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition active:scale-95"
                  id="bottom_btn_copy_markdown"
                >
                  {copiedMarkdown ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Markdown Copied
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Copy Markdown
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Config & Frame split grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              
              {/* Header Details Settings form */}
              <div className="lg:col-span-1 p-5 bg-slate-50/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Resume Header Config
                  </h4>
                  <span className="text-[10px] text-slate-400 italic">Syncs instantly</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-3xs font-mono text-slate-500 block mb-1">YOUR NAME</label>
                    <input
                      type="text"
                      value={personalName}
                      onChange={(e) => setPersonalName(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div>
                    <label className="text-3xs font-mono text-slate-500 block mb-1">TARGET JOB TITLE</label>
                    <input
                      type="text"
                      value={personalTitle}
                      onChange={(e) => setPersonalTitle(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                      placeholder="e.g. Senior Frontend Engineer"
                    />
                  </div>

                  <div>
                    <label className="text-3xs font-mono text-slate-500 block mb-1">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                      placeholder="e.g. email@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-3xs font-mono text-slate-500 block mb-1">PHONE NUMBER</label>
                    <input
                      type="text"
                      value={personalPhone}
                      onChange={(e) => setPersonalPhone(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                      placeholder="e.g. +1 555-0100"
                    />
                  </div>

                  <div>
                    <label className="text-3xs font-mono text-slate-500 block mb-1">LOCATION / REGION</label>
                    <input
                      type="text"
                      value={personalLocation}
                      onChange={(e) => setPersonalLocation(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                      placeholder="e.g. Bangalore, India"
                    />
                  </div>

                  <div>
                    <label className="text-3xs font-mono text-slate-500 block mb-1">LINKS / PORTFOLIO</label>
                    <input
                      type="text"
                      value={personalLinks}
                      onChange={(e) => setPersonalLinks(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                      placeholder="e.g. linkedin.com/in/username"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-3xs text-indigo-900 leading-normal">
                  📌 <strong>Formatting Hint:</strong> The "Copy for Google Docs" feature copies real HTML clipboard vectors. When you paste it into Google Docs, Word, or Apple Pages, it retains the modern font hierarchies, clean line separators, and tidy bullet paddings!
                </div>
              </div>

              {/* The Live Document Sheet Preview */}
              <div className="lg:col-span-2 p-6 bg-slate-100/50 flex flex-col justify-start">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase block">
                    Interactive Resume Canvas
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded font-mono">
                    A4 Clean Format
                  </span>
                </div>

                {/* Simulated Sheet of Paper */}
                <div 
                  className="bg-white p-8 border border-slate-200 shadow-sm rounded-lg text-slate-800 space-y-6 max-h-[500px] overflow-y-auto"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  {/* Centered Professional Header */}
                  <div className="text-center border-b-2 border-slate-800 pb-4">
                    <h3 className="text-2xl font-bold tracking-tight uppercase text-slate-900 m-0 leading-none">
                      {personalName || "YOUR NAME"}
                    </h3>
                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mt-1.5 mb-2 m-0">
                      {personalTitle || "YOUR TARGET JOB TITLE"}
                    </p>
                    <p className="text-2xs text-slate-500 m-0 leading-normal">
                      {[personalEmail, personalPhone, personalLocation].filter(Boolean).join("  |  ")}
                    </p>
                    {personalLinks && (
                      <p className="text-2xs text-slate-500 mt-1 m-0">
                        {personalLinks}
                      </p>
                    )}
                  </div>

                  {/* Profile Summary Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 m-0 tracking-wider">
                      Professional Summary
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed text-justify m-0">
                      {editedSummary || result.rewrittenSummary}
                    </p>
                  </div>

                  {/* Bullet History Achievements Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 m-0 tracking-wider">
                      Key Experience Achievements & Competencies
                    </h4>
                    <ul className="list-disc pl-5 space-y-2 m-0">
                      {result.rewrittenBullets.map((bullet: BulletItem, idx: number) => {
                        const bulletText = approvedBullets[idx] !== false ? bullet.rewritten : bullet.original;
                        return (
                          <li key={idx} className="text-xs text-slate-700 leading-relaxed">
                            {bulletText}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                </div>

                {/* Helpful tips */}
                <p className="text-center text-[10px] text-slate-400 mt-3 italic">
                  Scroll the canvas to read the entire resume. Toggle achievements above to swap between original or custom revisions.
                </p>
              </div>

            </div>

          </div>
        )}
          </div>
        )}

        {/* VIEW 3: PROFILE SETTINGS (Point 8) */}
        {currentView === "profile" && (
          <div className="max-w-3xl mx-auto w-full bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6" id="profile_view">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Profile Settings & Recruitment Preferences
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your persistent regional hub, target industries, and default contact details to feed the automated outreach opportunity finder.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                {profileSuccess}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                {error}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Main Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-3xs font-mono text-slate-500 block">FULL NAME</label>
                  <input
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                    placeholder="Jane Doe"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-mono text-slate-500 block">TARGET JOB TITLE</label>
                  <input
                    type="text"
                    value={profTitle}
                    onChange={(e) => setProfTitle(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-mono text-slate-500 block">PHONE NUMBER</label>
                  <input
                    type="text"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-mono text-slate-500 block">LOCATION</label>
                  <input
                    type="text"
                    value={profLocation}
                    onChange={(e) => setProfLocation(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                    placeholder="e.g. Mumbai, India"
                  />
                </div>
              </div>

              {/* Links & Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-3xs font-mono text-slate-500 block">LINKS / PORTFOLIO</label>
                  <input
                    type="text"
                    value={profLinks}
                    onChange={(e) => setProfLinks(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                    placeholder="e.g. linkedin.com/in/username"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-mono text-slate-500 block">ACTIVE RECRUITING REGION</label>
                  <select
                    value={profRegion}
                    onChange={(e) => setProfRegion(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                  >
                    <option value="India">India Hub (Bangalore, Mumbai, Delhi)</option>
                    <option value="US">United States (SF, NY, Austin)</option>
                    <option value="Singapore">Singapore / SE Asia</option>
                    <option value="Europe">Europe / UK Hub</option>
                  </select>
                </div>
              </div>

              {/* Summary text */}
              <div className="space-y-1">
                <label className="text-3xs font-mono text-slate-500 block">DEFAULT PROFESSIONAL SUMMARY</label>
                <textarea
                  value={profSummary}
                  onChange={(e) => setProfSummary(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                  placeholder="Paste your standard executive resume bio..."
                />
              </div>

              {/* Sectors list selection */}
              <div className="space-y-2">
                <label className="text-3xs font-mono text-slate-500 block">TARGET INDUSTRY SECTORS (SELECT CORRESPONDING MATCHES)</label>
                <div className="flex flex-wrap gap-2">
                  {["FinTech", "HealthTech", "SaaS", "E-Commerce", "DeepTech", "AI/ML"].map((sector) => {
                    const isSelected = profSectors.includes(sector);
                    return (
                      <button
                        type="button"
                        key={sector}
                        onClick={() => handleProfileSectorToggle(sector)}
                        className={`px-3 py-1.5 rounded-full text-2xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {sector}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-450 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {profileSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving preferences...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Preferences
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Permanently Delete My Account
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Resume Customizer — Safe ATS optimization. Zero facts generated.
          </p>
          <div className="flex gap-4">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-600 transition">GitHub</a>
            <span>•</span>
            <a href="https://ai.studio" target="_blank" rel="noreferrer" className="hover:text-slate-600 transition">Google AI Studio</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
