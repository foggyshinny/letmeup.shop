"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { PublicUser } from "@/lib/types";

interface AuthValue {
  user: PublicUser | null;
  ready: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  async function refresh() {
    try {
      const r = await fetch("/api/auth/me");
      const d = await r.json();
      setUser(d.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
