import { AuthResponse, User } from './types';
const KEY = 'appbarbearia.session';
export const session = { get: (): AuthResponse | null => { if (typeof window === 'undefined') return null; const value = localStorage.getItem(KEY); try { return value ? JSON.parse(value) : null; } catch { return null; } }, set: (value: AuthResponse) => localStorage.setItem(KEY, JSON.stringify(value)), clear: () => localStorage.removeItem(KEY), user: (): User | null => session.get()?.user ?? null };
