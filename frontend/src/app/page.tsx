"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading)
      router.replace(user ? `/${user.role.toLowerCase()}` : "/login");
  }, [user, loading, router]);
  return (
    <div className="grid min-h-screen place-items-center">Carregando...</div>
  );
}
