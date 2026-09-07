import type { Metadata } from 'next'; import './globals.css'; import { AuthProvider } from '@/components/auth-provider';
export const metadata: Metadata = { title: 'Barbearia | Agendamentos', description: 'Seu horário, sem espera.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body><AuthProvider>{children}</AuthProvider></body></html>; }
