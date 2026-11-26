"use client";

/**
 * AuthContext — React context for auth state.
 *
 * Wraps the auth.ts stubs so any component can call
 * useAuth() to get the current user and auth actions.
 *
 * When real JWT auth is wired, only auth.ts changes —
 * this context and all consumers stay the same.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  type User,
  type Session,
  getSession,
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  updateProfile as apiUpdateProfile,
  deleteAccount as apiDeleteAccount,
} from "./auth";

// ---- Context shape -----------------------------------------

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "fullName" | "email">>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refresh: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

// ---- Provider ----------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const s = getSession();
    setSession(s);
    setUser(s?.user ?? null);
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const s = await apiSignIn(email, password);
    setSession(s);
    setUser(s.user);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const s = await apiSignUp(email, password, fullName);
      setSession(s);
      setUser(s.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await apiSignOut();
    setSession(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, "fullName" | "email">>) => {
      const updated = await apiUpdateProfile(updates);
      setUser(updated);
    },
    [],
  );

  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    setSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut, updateProfile, deleteAccount, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---- Hook --------------------------------------------------

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be called inside <AuthProvider>");
  return ctx;
}

/** Returns true if a user is signed in and auth has resolved. */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && user !== null;
}
