import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { PlayerProfile, GameProgress } from "../types/game";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: PlayerProfile | null;
  gameProgress: GameProgress | null;
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
  reloadGameProgress: () => Promise<GameProgress | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapGameProgressToProfile(currentUser: User, progress: GameProgress): PlayerProfile {
  return {
    id: currentUser.id,
    user_id: currentUser.id,
    slayer_name: progress.username,
    email: currentUser.email || "",
    xp: progress.xp,
    slayer_rank: progress.slayer_rank,
    streak: progress.streak,
    combo: progress.combo,
    bugs_slain: progress.bugs_slain,
    current_world: progress.current_world,
    achievements: progress.achievements || [],
    challenge_progress: [],
    dna_stats: progress.bug_dna || {
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
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to load or initialize player game_progress from Supabase
  const loadProfile = async (currentUser: User): Promise<GameProgress | null> => {
    try {
      const { data, error } = await supabase
        .from("game_progress")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("Supabase game_progress query error:", error.message, error);
      }

      if (data) {
        const prog = data as GameProgress;
        setGameProgress(prog);
        setProfile(mapGameProgressToProfile(currentUser, prog));
        return prog;
      }
    } catch (err: unknown) {
      console.error(
        "Supabase game_progress fetch exception:",
        err instanceof Error ? err.message : err
      );
    }

    // No existing game_progress row: Insert starting row with initial defaults
    const metadataName =
      currentUser.user_metadata?.slayer_name ||
      currentUser.email?.split("@")[0] ||
      "Slayer";

    const defaultProgress: GameProgress = {
      user_id: currentUser.id,
      username: metadataName,
      xp: 0,
      slayer_rank: "Rookie Slayer",
      level: 1,
      current_world: "01",
      streak: 0,
      longest_streak: 0,
      combo: 0,
      bugs_slain: 0,
      last_activity_date: new Date().toISOString(),
      bug_dna: {
        Syntax: 50,
        Logic: 50,
        Loops: 50,
        Arrays: 50,
        Functions: 50,
        Runtime: 50,
        Conditionals: 50,
        "Off-by-One": 50
      },
      achievements: [],
      daily_challenge: null,
      updated_at: new Date().toISOString()
    };

    try {
      const { data: inserted, error: insertError } = await supabase
        .from("game_progress")
        .insert(defaultProgress)
        .select()
        .single();

      if (insertError) {
        console.error(
          "Supabase insert initial game_progress error:",
          insertError.message,
          insertError
        );
      }

      const activeProgress = (inserted || defaultProgress) as GameProgress;
      setGameProgress(activeProgress);
      setProfile(mapGameProgressToProfile(currentUser, activeProgress));
      return activeProgress;
    } catch (err: unknown) {
      console.error(
        "Supabase insert initial game_progress exception:",
        err instanceof Error ? err.message : err
      );
      setGameProgress(defaultProgress);
      setProfile(mapGameProgressToProfile(currentUser, defaultProgress));
      return defaultProgress;
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
        setGameProgress(null);
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
        console.error("Supabase login error:", error.message, error);
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadProfile(data.user);
      }

      return { error: null };
    } catch (err: unknown) {
      console.error("Supabase login exception:", err instanceof Error ? err.message : err);
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
        console.error("Supabase signup error:", error.message, error);
        return { error, user: null, session: null };
      }

      if (data.user) {
        if (data.session) {
          setSession(data.session);
          setUser(data.user);
          await loadProfile(data.user);
        }
      }

      return { error: null, user: data.user, session: data.session };
    } catch (err: unknown) {
      console.error("Supabase signup exception:", err instanceof Error ? err.message : err);
      return { error: err as Error, user: null, session: null };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err: unknown) {
      console.error("Supabase signOut error:", err instanceof Error ? err.message : err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setGameProgress(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`
      });
      if (error) {
        console.error("Supabase resetPassword error:", error.message, error);
      }
      return { error };
    } catch (err: unknown) {
      console.error("Supabase resetPassword exception:", err instanceof Error ? err.message : err);
      return { error: err as Error };
    }
  };

  const updateProfile = async (updates: Partial<PlayerProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    setProfile(updated);

    if (user) {
      try {
        const { error } = await supabase
          .from("game_progress")
          .upsert(
            {
              user_id: user.id,
              username: updated.slayer_name,
              xp: updated.xp,
              slayer_rank: updated.slayer_rank,
              streak: updated.streak,
              combo: updated.combo,
              bugs_slain: updated.bugs_slain,
              current_world: updated.current_world,
              bug_dna: updated.dna_stats,
              updated_at: new Date().toISOString()
            },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Supabase game_progress update error:", error.message, error);
        }
      } catch (err: unknown) {
        console.error("Supabase game_progress update exception:", err instanceof Error ? err.message : err);
      }
    }
  };

  const reloadGameProgress = async () => {
    if (!user) return null;
    return await loadProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        gameProgress,
        isLoading,
        login,
        signup,
        logout,
        resetPassword,
        updateProfile,
        reloadGameProgress
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
