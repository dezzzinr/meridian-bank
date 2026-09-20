"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { initials } from "@/lib/format";
import { apiFetch, setToken } from "@/lib/client";
import {
  IconHome,
  IconLogOut,
  IconMenu,
  IconSend,
  IconSwap,
  IconUser,
  IconUsers,
  IconWallet,
  IconX,
  LogoMark,
} from "../icons";
import { ToastProvider } from "../ui/Toast";

const NAV = [
  { href: "/app", label: "Overview", icon: IconHome },
  { href: "/app/accounts", label: "Accounts", icon: IconWallet },
  { href: "/app/activity", label: "Activity", icon: IconSwap },
  { href: "/app/payments", label: "Payments", icon: IconSend },
  { href: "/app/payees", label: "Payees", icon: IconUsers },
  { href: "/app/profile", label: "Profile", icon: IconUser },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={30} />
      <span className="font-display text-lg font-semibold tracking-tight text-white">
        Meridian
      </span>
    </div>
  );
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand text-white shadow-sm"
                : "text-emerald-100/55 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18} className="shrink-0" />
            {item.label}
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
            )}
          </a>
        );
      })}
    </nav>
  );
}

function UserCard({
  name,
  email,
  onLogout,
}: {
  name: string;
  email: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-xs font-semibold text-emerald-100">
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-white">{name}</p>
        <p className="truncate text-[11px] text-emerald-100/45">{email}</p>
      </div>
      <button
        onClick={onLogout}
        className="rounded-lg p-2 text-emerald-100/50 transition hover:bg-white/10 hover:text-white"
        aria-label="Sign out"
        title="Sign out"
      >
        <IconLogOut size={17} />
      </button>
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setToken(null);
      window.location.href = "/login";
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/5 bg-night lg:flex">
          <div className="px-5 pb-6 pt-6">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto px-3">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-emerald-100/30">
              Menu
            </p>
            <NavList pathname={pathname} />
          </div>
          <div className="border-t border-white/10">
            <UserCard name={user.name} email={user.email} onLogout={logout} />
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-night px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawer(true)}
              className="rounded-lg p-2 text-emerald-100/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Open menu"
            >
              <IconMenu size={20} />
            </button>
            <Brand />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-display text-[11px] font-semibold text-emerald-100">
            {initials(user.name)}
          </div>
        </header>

        {/* Mobile drawer */}
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="animate-fade absolute inset-0 bg-ink/55"
              onClick={() => setDrawer(false)}
            />
            <div className="animate-drawer-left absolute inset-y-0 left-0 flex w-[280px] flex-col bg-night">
              <div className="flex items-center justify-between px-5 pb-5 pt-5">
                <Brand />
                <button
                  onClick={() => setDrawer(false)}
                  className="rounded-lg p-2 text-emerald-100/60 hover:bg-white/10 hover:text-white"
                  aria-label="Close menu"
                >
                  <IconX size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3">
                <NavList pathname={pathname} onNavigate={() => setDrawer(false)} />
              </div>
              <div className="border-t border-white/10">
                <UserCard name={user.name} email={user.email} onLogout={logout} />
              </div>
            </div>
          </div>
        )}

        <main className="pt-14 lg:pl-64 lg:pt-0">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
