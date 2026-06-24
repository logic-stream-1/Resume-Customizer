import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserConfig, HistoricalRun, Opportunity } from "../types";

interface AuthContextType {
  user: User | null;
  config: UserConfig | null;
  loading: boolean;
  error: string | null;
  runs: HistoricalRun[];
  opportunities: Opportunity[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  oauthLogin: (email: string, name: string) => Promise<boolean>;
  logout: () => void;
  requestReset: (email: string) => Promise<string>;
  resetPassword: (email: string, newPassword: string) => Promise<boolean>;
  updateConfig: (updates: Partial<UserConfig>) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  loadRuns: () => Promise<void>;
  loadOpportunities: () => Promise<void>;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [runs, setRuns] = useState<HistoricalRun[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setLocalError] = useState<string | null>(null);

  // Restore session on startup
  useEffect(() => {
    async function initSession() {
      const storedUser = localStorage.getItem("auth_user");
      const storedConfig = localStorage.getItem("auth_config");
      
      if (storedUser && storedConfig) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const parsedConfig = JSON.parse(storedConfig);
          setUser(parsedUser);
          setConfig(parsedConfig);
          
          // Verify with server & load dependencies
          const userId = parsedUser.id;
          const configRes = await fetch("/api/auth/config", {
            headers: { "x-user-id": userId }
          });
          
          if (configRes.ok) {
            const data = await configRes.json();
            if (data.config) {
              setConfig(data.config);
              localStorage.setItem("auth_config", JSON.stringify(data.config));
            }
          }
        } catch (e) {
          console.error("Session restore error:", e);
          logout();
        }
      }
      setLoading(false);
    }
    
    initSession();
  }, []);

  // Fetch runs & opportunities automatically when user is logged in
  useEffect(() => {
    if (user) {
      loadRuns();
      loadOpportunities();
    } else {
      setRuns([]);
      setOpportunities([]);
    }
  }, [user, config?.activeRegion, config?.targetSectors]);

  const loadRuns = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/runs", {
        headers: { "x-user-id": user.id }
      });
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (e) {
      console.error("Load runs failed:", e);
    }
  };

  const loadOpportunities = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/opportunities", {
        headers: { "x-user-id": user.id }
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
      }
    } catch (e) {
      console.error("Load opportunities failed:", e);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLocalError(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || "Login credentials verification failed.");
        return false;
      }
      
      setUser(data.user);
      setConfig(data.config);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      localStorage.setItem("auth_config", JSON.stringify(data.config));
      return true;
    } catch (e: any) {
      setLocalError("Network error: Server is currently unreachable.");
      return false;
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    setLocalError(null);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || "User registration failed.");
        return false;
      }
      
      setUser(data.user);
      setConfig(data.config);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      localStorage.setItem("auth_config", JSON.stringify(data.config));
      return true;
    } catch (e: any) {
      setLocalError("Network error: Server is currently unreachable.");
      return false;
    }
  };

  const oauthLogin = async (email: string, name: string): Promise<boolean> => {
    setLocalError(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGoogleOAuth: true, googleEmail: email, googleName: name })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || "Google Single-Sign-On simulation failed.");
        return false;
      }
      
      setUser(data.user);
      setConfig(data.config);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      localStorage.setItem("auth_config", JSON.stringify(data.config));
      return true;
    } catch (e: any) {
      setLocalError("Network error: Google OAuth portal is unreachable.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setConfig(null);
    setRuns([]);
    setOpportunities([]);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_config");
  };

  const requestReset = async (email: string): Promise<string> => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Reset password request failed.");
      }
      return data.message;
    } catch (e: any) {
      throw new Error(e.message || "Failed to trigger password recovery. Please check your network connection.");
    }
  };

  const resetPassword = async (email: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || "Failed to reset password.");
        return false;
      }
      return true;
    } catch (e: any) {
      setLocalError("Network error: Password update failed.");
      return false;
    }
  };

  const updateConfig = async (updates: Partial<UserConfig>): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch("/api/auth/config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify(updates)
      });
      
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || "Failed to save configuration settings.");
        return false;
      }
      
      setConfig(data.config);
      localStorage.setItem("auth_config", JSON.stringify(data.config));
      return true;
    } catch (e: any) {
      setLocalError("Network error: Server is currently offline.");
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (res.ok) {
        logout();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Delete account error:", e);
      return false;
    }
  };

  const setError = (err: string | null) => {
    setLocalError(err);
  };

  return (
    <AuthContext.Provider value={{
      user,
      config,
      loading,
      error,
      runs,
      opportunities,
      login,
      register,
      oauthLogin,
      logout,
      requestReset,
      resetPassword,
      updateConfig,
      deleteAccount,
      loadRuns,
      loadOpportunities,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(Auth);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Global reference fix to avoid TS issues
const Auth = AuthContext;
