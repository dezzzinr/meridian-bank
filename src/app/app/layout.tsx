"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken, setToken } from "@/lib/client";
import { AppShell } from "@/components/shell/AppShell";

interface AuthUser {
  name: string;
  email: string;
}

export default function AppAreaLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    apiFetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u: AuthUser & { createdAt: string } | null) => {
        if (cancelled) return;
        if (u) {
          setUser({ name: u.name, email: u.email });
        } else {
          setToken(null);
          router.replace("/login");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null);
          router.replace("/login");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex items-center gap-3 text-ink-soft">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand" />
          <span className="text-sm font-medium">Loading your bank…</span>
        </div>
      </div>
    );
  }

  return <AppShell user={user}>{children}</AppShell>;
}
