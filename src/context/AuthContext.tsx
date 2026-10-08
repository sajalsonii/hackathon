import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { PlayerProfile } from "../types/game";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: PlayerProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (
    email: string,
    password: string,
    slayerName: string
  ) => Promise<{ error: Error | null; user: User | null; session: Session | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<PlayerProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to load or initialize player profile
  const loadProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (data && !error) {
        setProfile(data as PlayerProfile);
        return;
      }
    } catch {
      // Table may not exist yet or network issue
    }

    // Fallback: build profile from user metadata or local defaults
    const metadataName =
      currentUser.user_metadata?.slayer_name ||
      currentUser.email?.split("@")[0] ||
      "Slayer";

    const defaultProfile: PlayerProfile = {
      id: currentUser.id,
      user_id: currentUser.id,
      slayer_name: metadataName,
      email: currentUser.email || "",
      xp: 0,
      slayer_rank: "Rookie Slayer",
      streak: 0,
      combo: 0,
      bugs_slain: 0,
      current_world: "01",
      achievements: [],
      challenge_progress: [],
      dna_stats: {
        Syntax: 50,
        Logic: 50,
        Loops: 50,
        Arrays: 50,
        Functions: 50,
        Runtime: 50,
        Conditionals: 50,
        "Off-by-One": 50
      }
    };

    setProfile(defaultProfile);

    // Try creating it in Supabase table in background
    try {
      await supabase.from("profiles").upsert(defaultProfile);
    } catch {
      // ignore table schema errors
    }
  };

  useEffect(() => {
    // 1. Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user);
      }
      setIsLoading(false);
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadProfile(data.user);
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const signup = async (email: string, password: string, slayerName: string) => {
    try {
      const trimmedName = slayerName.trim() || email.split("@")[0];
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            slayer_name: trimmedName
          }
        }
      });

      if (error) {
        return { error, user: null, session: null };
      }

      if (data.user) {
        // Initialize profile with starting values specified in requirements:
        // XP: 0, Slayer Rank: "Rookie Slayer", Streak: 0, Combo: 0, Bugs Slain: 0
        const initialProfile: PlayerProfile = {
          id: data.user.id,
          user_id: data.user.id,
          slayer_name: trimmedName,
          email: data.user.email || email,
          xp: 0,
          slayer_rank: "Rookie Slayer",
          streak: 0,
          combo: 0,
          bugs_slain: 0,
          current_world: "01",
          achievements: [],
          challenge_progress: [],
          dna_stats: {
            Syntax: 50,
            Logic: 50,
            Loops: 50,
            Arrays: 50,
            Functions: 50,
            Runtime: 50,
            Conditionals: 50,
            "Off-by-One": 50
          }
        };

        if (data.session) {
          setSession(data.session);
          setUser(data.user);
          setProfile(initialProfile);
        }

        try {
          await supabase.from("profiles").upsert(initialProfile);
        } catch {
          // ignore if table is not configured yet
        }
      }

      return { error: null, user: data.user, session: data.session };
    } catch (err: unknown) {
      return { error: err as Error, user: null, session: null };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore error
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`
      });
      return { error };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const updateProfile = async (updates: Partial<PlayerProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    setProfile(updated);

    if (user) {
      try {
        await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id);
      } catch {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        login,
        signup,
        logout,
        resetPassword,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
