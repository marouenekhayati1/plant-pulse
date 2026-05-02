import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type SessionTech = {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  role: "technician" | "maintenance_manager" | "admin";
};

type Ctx = {
  tech: SessionTech | null;
  login: (t: SessionTech) => void;
  logout: () => void;
  ready: boolean;
};

const AuthCtx = createContext<Ctx | null>(null);
const KEY = "indus.session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tech, setTech] = useState<SessionTech | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setTech(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const login = (t: SessionTech) => {
    localStorage.setItem(KEY, JSON.stringify(t));
    setTech(t);
  };
  const logout = () => {
    localStorage.removeItem(KEY);
    setTech(null);
  };

  return <AuthCtx.Provider value={{ tech, login, logout, ready }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}