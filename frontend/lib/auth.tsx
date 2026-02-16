/**
 * Authentication context — manages tokens, user profile, and role-based routing.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSegments } from "expo-router";

import * as storage from "@/lib/storage";

import { api, ApiError } from "@/lib/api";
import type {
  AuthTokenResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile,
  UserRole,
} from "@/lib/types";

// ── Types ────────────────────────────────────────

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  role: UserRole | null;
}

interface AuthContextValue extends AuthState {
  register: (data: RegisterRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ── Context ──────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// ── Provider ─────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    role: null,
  });

  const router = useRouter();
  const segments = useSegments();

  // ── Persist / restore tokens ───────────────────
  const saveTokens = useCallback(async (tokens: AuthTokenResponse) => {
    await storage.setItem("access_token", tokens.access_token);
    await storage.setItem("refresh_token", tokens.refresh_token);
    await storage.setItem("role", tokens.role);
  }, []);

  const clearTokens = useCallback(async () => {
    await storage.deleteItem("access_token");
    await storage.deleteItem("refresh_token");
    await storage.deleteItem("role");
  }, []);

  // ── Fetch profile ─────────────────────────────
  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      return await api.get<UserProfile>("/users/me");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  }, []);

  // ── Boot: check stored tokens ─────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await storage.getItem("access_token");
        const role = (await storage.getItem("role")) as UserRole | null;
        if (token && role) {
          const user = await fetchProfile();
          if (user) {
            setState({
              isLoading: false,
              isAuthenticated: true,
              user,
              role,
            });
            return;
          }
        }
      } catch {
        // ignore — treat as unauthenticated
      }
      await clearTokens();
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        role: null,
      });
    })();
  }, [fetchProfile, clearTokens]);

  // ── Route protection ──────────────────────────
  useEffect(() => {
    if (state.isLoading) return;

    const inAuth = segments[0] === "(public)";
    const inSeeker = segments[0] === "(seeker)";
    const inVolunteer = segments[0] === "(volunteer)";

    if (!state.isAuthenticated && !inAuth) {
      router.replace("/(public)/welcome");
    } else if (state.isAuthenticated && inAuth) {
      if (state.role === "seeker") {
        router.replace("/(seeker)/hall");
      } else {
        router.replace("/(volunteer)/hall");
      }
    } else if (state.isAuthenticated && state.role === "seeker" && inVolunteer) {
      router.replace("/(seeker)/hall");
    } else if (
      state.isAuthenticated &&
      state.role === "volunteer" &&
      inSeeker
    ) {
      router.replace("/(volunteer)/hall");
    }
  }, [state.isLoading, state.isAuthenticated, state.role, segments, router]);

  // ── Actions ────────────────────────────────────
  const register = useCallback(
    async (data: RegisterRequest) => {
      const tokens = await api.post<AuthTokenResponse>(
        "/auth/register",
        data,
        false
      );
      await saveTokens(tokens);
      const user = await fetchProfile();
      setState({
        isLoading: false,
        isAuthenticated: true,
        user,
        role: tokens.role,
      });
    },
    [saveTokens, fetchProfile]
  );

  const login = useCallback(
    async (data: LoginRequest) => {
      const tokens = await api.post<AuthTokenResponse>(
        "/auth/login",
        data,
        false
      );
      await saveTokens(tokens);
      const user = await fetchProfile();
      setState({
        isLoading: false,
        isAuthenticated: true,
        user,
        role: tokens.role,
      });
    },
    [saveTokens, fetchProfile]
  );

  const logout = useCallback(async () => {
    await clearTokens();
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      role: null,
    });
  }, [clearTokens]);

  const refreshProfile = useCallback(async () => {
    const user = await fetchProfile();
    if (user) {
      setState((prev) => ({ ...prev, user }));
    }
  }, [fetchProfile]);

  // ── Value ──────────────────────────────────────
  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      register,
      login,
      logout,
      refreshProfile,
    }),
    [state, register, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
