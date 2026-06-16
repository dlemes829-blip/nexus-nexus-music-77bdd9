import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUri?: string;
  plan: "free" | "premium";
  joinedAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (identifier: string, method: "phone" | "google" | "email") => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_KEY = "@nexus_music_user_v2";

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY)
      .then((raw) => { if (raw) setUser(JSON.parse(raw)); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (identifier: string, method: "phone" | "google" | "email") => {
    const newUser: User = {
      id: genId(),
      name: method === "google" ? "Usuário Google"
        : method === "phone" ? "Ouvinte Nexus"
        : (identifier.split("@")[0] || "Ouvinte"),
      email: method === "email" ? identifier
        : method === "google" ? "usuario@gmail.com"
        : `${identifier}@nexusmusic.app`,
      phone: method === "phone" ? identifier : undefined,
      plan: "premium",
      joinedAt: Date.now(),
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
