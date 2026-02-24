/**
 * Authentication context - manages auth state and route protection.
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

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  user: UserProfile | null;
  role: UserRole | null;
}

interface AuthContextValue extends AuthState {
  register: (data: RegisterRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  enterGuest: (_role: UserRole) => Promise<void>;
  exitGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    isGuest: false,
    user: null,
    role: null,
  });

  const router = useRouter();
  const segments = useSegments();

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

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      return await api.get<UserProfile>("/users/me");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  }, []);

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
              isGuest: false,
              user,
              role,
            });
            return;
          }
        }
      } catch {
        // Ignore boot failures and reset to a safe unauthenticated state.
      }

      await clearTokens();
      setState({
        isLoading: false,
        isAuthenticated: false,
        isGuest: false,
        user: null,
        role: null,
      });
    })();
  }, [clearTokens, fetchProfile]);

  useEffect(() => {
    if (state.isLoading) return;

    const inPublic = segments[0] === "(public)";
    const inSeeker = segments[0] === "(seeker)";
    const inVolunteer = segments[0] === "(volunteer)";

    if (state.isAuthenticated) {
      if (inPublic) {
        router.replace(
          state.role === "seeker" ? "/(seeker)/hall" : "/(volunteer)/hall"
        );
        return;
      }

      if (state.role === "seeker" && inVolunteer) {
        router.replace("/(seeker)/hall");
        return;
      }

      if (state.role === "volunteer" && inSeeker) {
        router.replace("/(volunteer)/hall");
      }
      return;
    }

    if (!inPublic) {
      router.replace("/(public)/login");
    }
  }, [router, segments, state.isAuthenticated, state.isLoading, state.role]);

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
        isGuest: false,
        user,
        role: tokens.role,
      });
    },
    [fetchProfile, saveTokens]
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
        isGuest: false,
        user,
        role: tokens.role,
      });
    },
    [fetchProfile, saveTokens]
  );

  const enterGuest = useCallback(
    async (_role: UserRole) => {
      await clearTokens();
      setState({
        isLoading: false,
        isAuthenticated: false,
        isGuest: false,
        user: null,
        role: null,
      });
      router.replace("/(public)/login");
    },
    [clearTokens, router]
  );

  const exitGuest = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isGuest: false,
    }));
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setState({
      isLoading: false,
      isAuthenticated: false,
      isGuest: false,
      user: null,
      role: null,
    });
  }, [clearTokens]);

  const refreshProfile = useCallback(async () => {
    if (!state.isAuthenticated) return;
    const user = await fetchProfile();
    if (user) {
      setState((prev) => ({ ...prev, user }));
    }
  }, [fetchProfile, state.isAuthenticated]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      register,
      login,
      logout,
      refreshProfile,
      enterGuest,
      exitGuest,
    }),
    [enterGuest, exitGuest, login, logout, refreshProfile, register, state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

