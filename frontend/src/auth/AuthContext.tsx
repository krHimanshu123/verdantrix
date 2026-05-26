import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, login as apiLogin, register as apiRegister } from "../services/api";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  storeSession,
  updateStoredUser,
} from "../services/auth";
import type { AuthUser } from "../types";

type RegisterPayload = {
  organization_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [ready, setReady] = useState(false);

  const hasSession = Boolean(getAccessToken() || getRefreshToken());

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!hasSession) {
        if (!cancelled) {
          setUser(null);
          setReady(true);
        }
        return;
      }

      const stored = getStoredUser();
      if (stored) {
        if (!cancelled) {
          setUser(stored);
          setReady(true);
        }
        return;
      }

      try {
        const response = await fetchCurrentUser();
        if (!cancelled) {
          updateStoredUser(response.data);
          setUser(response.data);
        }
      } catch {
        clearSession();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [hasSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: hasSession,
      ready,
      login: async (username: string, password: string) => {
        const response = await apiLogin(username, password);
        storeSession(response.data.access, response.data.refresh, response.data.user);
        setUser(response.data.user);
      },
      register: async (payload: RegisterPayload) => {
        const response = await apiRegister(payload);
        storeSession(response.data.access, response.data.refresh, response.data.user);
        setUser(response.data.user);
      },
      logout: () => {
        clearSession();
        setUser(null);
      },
    }),
    [user, hasSession, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
