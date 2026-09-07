'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api'; import { session } from '@/lib/session'; import { User } from '@/lib/types';
type Context = { user: User | null; loading: boolean; signOut: () => void; refresh: () => Promise<void> };
const AuthContext = createContext<Context>({ user: null, loading: true, signOut: () => {}, refresh: async () => {} });
export function AuthProvider({ children }: { children: React.ReactNode }) { const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true); const refresh = async () => { const saved = session.get(); if (!saved) { setUser(null); return; } try { const current = await api.me(); session.set({ ...saved, user: current }); setUser(current); } catch { session.clear(); setUser(null); } }; useEffect(() => { refresh().finally(() => setLoading(false)); }, []); const signOut = () => { session.clear(); setUser(null); window.location.assign('/login'); }; return <AuthContext.Provider value={{ user, loading, signOut, refresh }}>{children}</AuthContext.Provider>; }
export const useAuth = () => useContext(AuthContext);
