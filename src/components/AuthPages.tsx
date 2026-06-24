import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, Globe, ArrowRight, ArrowLeft } from "lucide-react";

export function AuthPages() {
  const { login, register, oauthLogin, requestReset, resetPassword, error, setError } = useAuth();
  
  const [view, setView] = useState<"signin" | "signup" | "forgot" | "reset">("signin");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Initial Config fields (used during signup)
  const [personalTitle, setPersonalTitle] = useState("Senior React Developer");
  const [backgroundSummary, setBackgroundSummary] = useState("Results-driven engineer with expertise in building responsive frontends, optimizing build sizes, and integrating backend APIs.");
  const [activeRegion, setActiveRegion] = useState<"India" | "Global">("India");
  const [targetSectors, setTargetSectors] = useState<string[]>(["SaaS", "FinTech"]);

  // Reset flow fields
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSectorToggle = (sector: string) => {
    if (targetSectors.includes(sector)) {
      setTargetSectors(targetSectors.filter((s) => s !== sector));
    } else {
      setTargetSectors([...targetSectors, sector]);
    }
  };

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password fields.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    
    if (success) {
      setSuccessMsg("Successfully authenticated!");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setError("Full name, email, and password are required.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("For security, passwords must be at least 6 characters long.");
      return;
    }
    if (targetSectors.length === 0) {
      setError("Please select at least one target industry sector.");
      return;
    }

    setLoading(true);
    const success = await register(email, password, fullName);
    
    if (success) {
      // Save the other initial configurations (sectors, region, background, title)
      const configSuccess = await fetch("/api/auth/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": JSON.parse(localStorage.getItem("auth_user") || "{}").id
        },
        body: JSON.stringify({
          backgroundSummary,
          targetSectors,
          activeRegion,
          personalTitle,
          personalLocation: activeRegion === "India" ? "Bangalore, India" : "San Francisco, USA",
          personalPhone: activeRegion === "India" ? "+91 98765 43210" : "+1 555-0100",
          personalLinks: "linkedin.com/in/username | github.com/username"
        })
      });
      
      if (configSuccess.ok) {
        // Force refresh local config storage
        const configData = await configSuccess.json();
        localStorage.setItem("auth_config", JSON.stringify(configData.config));
        window.location.reload(); // Quick sync reload
      }
      setSuccessMsg("Account registered and seeded successfully!");
    }
    setLoading(false);
  };

  const handleGoogleOAuth = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    
    // Simulate interactive OAuth selection
    const mockEmail = `demo.oauth.${Math.floor(Math.random() * 1000)}@gmail.com`;
    const mockName = "Google SSO Demo Seeker";
    
    const success = await oauthLogin(mockEmail, mockName);
    setLoading(false);
    
    if (success) {
      setSuccessMsg("Logged in with Google single-sign-on!");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetEmail.trim() || !validateEmail(resetEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const msg = await requestReset(resetEmail);
      setSuccessMsg(msg);
      // Auto transition to reset-password form to let user try it
      setEmail(resetEmail);
      setTimeout(() => {
        setView("reset");
      }, 1500);
    } catch (e: any) {
      setError(e.message || "Could not request reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !newPassword.trim()) {
      setError("Please provide a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const success = await resetPassword(email, newPassword);
    setLoading(false);

    if (success) {
      setSuccessMsg("Password updated! You can now log in.");
      setTimeout(() => {
        setView("signin");
        setPassword("");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Brand Logo and Subtitle */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 text-white shadow-md">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="mt-4 text-3xl font-display font-extrabold text-slate-900 tracking-tight">
          TailorCraft ATS
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
          Resilient AI Resume tailor & candidate optimizer. Match your achievements with absolute zero-fabrication safety.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-md">
          
          {/* Action Header Toggles */}
          {view === "signin" && (
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Account Login</h3>
              <button 
                onClick={() => { setView("signup"); setError(null); }}
                className="text-2xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                Register a new profile →
              </button>
            </div>
          )}

          {view === "signup" && (
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Profile Registry</h3>
              <button 
                onClick={() => { setView("signin"); setError(null); }}
                className="text-2xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                ← Return to login
              </button>
            </div>
          )}

          {/* Feedback indicators */}
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-900 text-2xs leading-relaxed animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-950 text-2xs leading-relaxed animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sign In form */}
          {view === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-3xs font-mono text-slate-500 block mb-1 uppercase tracking-wider">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-3xs font-mono text-slate-500 block uppercase tracking-wider">PASSWORD</label>
                  <button 
                    type="button"
                    onClick={() => { setView("forgot"); setError(null); }}
                    className="text-3xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Authenticating..." : (
                  <>
                    Sign In
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Registration form (Initial config embedded) */}
          {view === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 mb-2 text-3xs text-slate-600 leading-normal">
                👋 Registering creates your profile and <strong>automatically seeds a completed tailoring run</strong> so your dashboard is immediately interactive.
              </div>

              <h4 className="text-3xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">
                Account Credentials
              </h4>

              <div>
                <label className="text-3xs font-mono text-slate-500 block mb-1 uppercase tracking-wider">FULL NAME</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="text-3xs font-mono text-slate-500 block mb-1 uppercase tracking-wider">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-3xs font-mono text-slate-500 block mb-1 uppercase tracking-wider">PASSWORD (MIN 6 CHARS)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <h4 className="text-3xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 pt-2">
                Initial Profile & Filters
              </h4>

              <div>
                <label className="text-3xs font-mono text-slate-500 block mb-1 uppercase tracking-wider">TARGET JOB TITLE</label>
                <input
                  type="text"
                  required
                  value={personalTitle}
                  onChange={(e) => setPersonalTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition outline-none"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>

              <div>
                <label className="text-3xs font-mono text-slate-500 block mb-1 uppercase tracking-wider">ACTIVE RECRUITMENT REGION</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveRegion("India")}
                    className={`text-2xs py-2 px-3 border rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
                      activeRegion === "India" 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    🇮🇳 India Hub
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRegion("Global")}
                    className={`text-2xs py-2 px-3 border rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
                      activeRegion === "Global" 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    🌐 Global Hub
                  </button>
                </div>
              </div>

              <div>
                <label className="text-3xs font-mono text-slate-500 block mb-1 uppercase tracking-wider">TARGET INDUSTRY SECTORS (SELECT MULTIPLE)</label>
                <div className="grid grid-cols-2 gap-2">
                  {["SaaS", "FinTech", "HealthTech", "AI / Tech", "SupplyChain"].map((sector) => {
                    const isSelected = targetSectors.includes(sector);
                    return (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => handleSectorToggle(sector)}
                        className={`text-3xs py-1.5 px-2 border rounded-md font-medium text-left transition ${
                          isSelected 
                            ? "bg-slate-900 border-slate-900 text-white" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "} {sector}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-3xs font-mono text-slate-500 block mb-1 uppercase tracking-wider">PROFESSIONAL SUMMARY OVERVIEW</label>
                <textarea
                  required
                  rows={2}
                  value={backgroundSummary}
                  onChange={(e) => setBackgroundSummary(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition outline-none resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? "Registering & Seeding..." : (
                  <>
                    Complete Registry & Seed Run
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Forgot password */}
          {view === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="mb-2">
                <button 
                  type="button"
                  onClick={() => { setView("signin"); setError(null); setSuccessMsg(null); }}
                  className="text-2xs font-semibold text-slate-600 hover:text-slate-800 transition flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to login
                </button>
              </div>

              <p className="text-2xs text-slate-500 leading-normal">
                Enter your registered email address below, and we will send you a simulated password recovery link.
              </p>

              <div>
                <label className="text-3xs font-mono text-slate-500 block mb-1 uppercase tracking-wider">REGISTERED EMAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition flex items-center justify-center cursor-pointer"
              >
                {loading ? "Sending link..." : "Request Reset Link"}
              </button>
            </form>
          )}

          {/* Reset password */}
          {view === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-2xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg leading-normal">
                ✓ Simulated password recovery link activated for <strong>{email}</strong>. Enter your desired new password below to reset.
              </p>

              <div>
                <label className="text-3xs font-mono text-slate-500 block mb-1 uppercase tracking-wider">NEW SECURE PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition flex items-center justify-center cursor-pointer"
              >
                {loading ? "Updating password..." : "Complete Reset & Login"}
              </button>
            </form>
          )}

          {/* Social Sign-In (Simulated Google OAuth Button) */}
          {(view === "signin" || view === "signup") && (
            <div className="mt-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-3xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-mono tracking-wider">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleOAuth}
                disabled={loading}
                className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 rounded-lg flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {/* SVG Google icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Sign In with Google SSO
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
