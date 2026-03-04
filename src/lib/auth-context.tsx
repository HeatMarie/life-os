"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface Character {
  name: string;
  class: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  currentStreak: number;
  tasksCompleted: number;
  status: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  character: Character | null;
}

interface AuthContextType {
  user: AuthUser | null;
  character: Character | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  refreshCharacter: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  character: null,
  loading: true,
  refreshUser: async () => {},
  refreshCharacter: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: AuthUser | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [character, setCharacter] = useState<Character | null>(initialUser?.character ?? null);
  const [loading, setLoading] = useState(!initialUser);

  const fetchCharacter = async (): Promise<Character | null> => {
    try {
      const res = await fetch("/api/character");
      if (res.ok) {
        const data = await res.json();
        // API returns the character object directly when it exists,
        // or { character: null } when the user has no character yet.
        if (data && typeof data.name === "string") {
          return data as Character;
        }
      }
    } catch (error) {
      console.error("Failed to fetch character:", error);
    }
    return null;
  };

  const refreshCharacter = async () => {
    const char = await fetchCharacter();
    setCharacter(char);
  };

  const refreshUser = async () => {
    const supabase = createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) {
      setUser(null);
      setCharacter(null);
      return;
    }
    const char = await fetchCharacter();
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email ?? "",
      name: supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? null,
      character: char,
    });
    setCharacter(char);
  };

  useEffect(() => {
    const supabase = createClient();

    // If we have no initial user, fetch from Supabase on mount
    if (!initialUser) {
      refreshUser().finally(() => setLoading(false));
    }

    // Listen to auth state changes (login/logout in another tab, session expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const char = await fetchCharacter();
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            name:
              session.user.user_metadata?.full_name ??
              session.user.user_metadata?.name ??
              null,
            character: char,
          });
          setCharacter(char);
        } else {
          setUser(null);
          setCharacter(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, character, loading, refreshUser, refreshCharacter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
