"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client";
import { dayLabel, greeting, money, moneySigned } from "@/lib/format";
import { DashboardActions } from "@/components/pages/DashboardActions";
import { TypeBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCheck,
  IconClock,
  IconPlus,
  IconTrendingUp,
  IconWallet,
  IconX,
} from "@/components/icons";

interface DashboardData {
  accounts: {
    id: number;
    name: string;
    type: "checking" | "savings";
    last4: string;
    balanceCents: number;
    createdAt: string;
  }[];
  totalCents: number;
  income30: number;
  spend30: number;
  pendingCount: number;
  pendingCents: number;
  weeks: { label: string; cents: number }[];
  recent: {
    id: number;
    kind: string;
    status: string;
    description: string;
    accountName: string | null;
    amountCents: number;
    occurredAt: string;
  }[];
}

function SpendChart({ weeks }: { weeks: { label: string; cents: number }[] }) {
  const max = Math.max(...weeks.map((w) => w.cents), 1);
  const total = weeks.reduce((s, w) => s + w.cents, 0);
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-base font-semibold text-ink">
          Spending
        </h3>
        <p className="text-xs font-medium text-ink-faint">last 8 weeks</p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
        {money(total)}
      </p>
      <div className="mt-4 flex h-36 items-end gap-1.5 sm:gap-2">
        {weeks.map((w, i) => (
          <div
            key={i}
            className="flex h-full flex-1 flex-col justify-end"
            title={`${w.label} — ${money(w.cents)}`}
          >
            <div
              className={`w-full rounded-md transition hover:opacity-75 ${
                i === weeks.length - 1 ? "bg-brand" : "bg-brand/25"
              }`}
              style={{
                height: `${Math.max(5, Math.round((w.cents / max) * 100))}%`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {weeks.map((w, i) => (
          <p
            key={i}
            className="flex-1 truncate text-center text-[10px] font-medium text-ink-faint"
          >
            {i % 2 === 0 ? w.label : ""}
          </p>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-7 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-28" />
          <Skeleton className="mt-4 h-36 w-full" />
        </div>
        <div className="card p-5 lg:col-span-3">
          <Skeleton className="h-3 w-32" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-3.5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [firstName, setFirstName] = useState("there");
  const [loadErr, setLoadErr] = useState(false);

  const load = () => {
    setLoadErr(false);
    apiFetch("/api/dashboard", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d: DashboardData) => {
        setData(d);
        apiFetch("/api/auth/me", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((u) => {
            if (u?.name) {
              setFirstName(String(u.name).split(" ")[0] ?? u.name);
            }
          })
          .catch(() => {});
      })
      .catch(() => setLoadErr(true));
  };

  useEffect(load, []);

  const onboarding = !!data && data.accounts.length === 0;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{today}</p>
        </div>
        {data && (
          <DashboardActions
            accounts={data.accounts}
            onboarding={onboarding}
          />
        )}
      </div>

      {loadErr ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-semibold text-rose">
            Couldn't load your dashboard.
          </p>
          <button className="btn-outline mt-4" onClick={load}>
            Try again
          </button>
        </div>
      ) : !data ? (
        <DashboardSkeleton />
      ) : onboarding ? (
        <div className="card animate-rise p-8 sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
            <IconWallet size={22} />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">
            Let's set up your first account
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
            Open a checking account for everyday spending or a savings account
            that earns 1.90% APY. Once it's open, your dashboard lights up with
            balances, spending trends and quick actions.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Pick a type", "Checking for daily life, savings to grow."],
              ["2", "Name it", "“Groceries”, “Trip Fund” — you decide."],
              ["3", "Deposit & go", "Add funds and start tracking instantly."],
            ].map(([n, t, b]) => (
              <div key={n} className="rounded-xl border border-line-soft bg-paper/60 p-4">
                <p className="font-display text-sm font-semibold text-brand-deep">
                  {n}. {t}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{b}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <div className="rounded-xl bg-night p-5 text-white shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100/50">
                Total balance
              </p>
              <p className="mt-3 font-display text-[26px] font-semibold tracking-tight sm:text-3xl">
                {money(data.totalCents)}
              </p>
              <p className="mt-1.5 text-xs text-emerald-100/45">
                Across {data.accounts.length} account
                {data.accounts.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-good-soft text-good">
                  <IconArrowDownLeft size={14} />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  Money in · 30d
                </p>
              </div>
              <p className="mt-3 font-display text-[22px] font-semibold tracking-tight text-good sm:text-2xl">
                {money(data.income30)}
              </p>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-line-soft text-ink-soft">
                  <IconArrowUpRight size={14} />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  Spending · 30d
                </p>
              </div>
              <p className="mt-3 font-display text-[22px] font-semibold tracking-tight text-ink sm:text-2xl">
                {money(data.spend30)}
              </p>
            </div>

            <div className={`card p-5 ${data.pendingCount > 0 ? "border-amber/30 bg-amber-soft/50" : ""}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    data.pendingCount > 0
                      ? "bg-amber-soft text-amber"
                      : "bg-good-soft text-good"
                  }`}
                >
                  {data.pendingCount > 0 ? (
                    <IconClock size={14} />
                  ) : (
                    <IconCheck size={14} />
                  )}
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  Pending
                </p>
              </div>
              {data.pendingCount > 0 ? (
                <>
                  <p className="mt-3 font-display text-[22px] font-semibold tracking-tight text-amber sm:text-2xl">
                    {money(data.pendingCents)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber/80">
                    {data.pendingCount} payment
                    {data.pendingCount === 1 ? "" : "s"} settling
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 font-display text-[22px] font-semibold tracking-tight text-ink sm:text-2xl">
                    $0.00
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    Everything has settled
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <SpendChart weeks={data.weeks} />
            </div>
            <div className="card overflow-hidden lg:col-span-3">
              <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
                <h3 className="font-display text-base font-semibold text-ink">
                  Recent activity
                </h3>
                <Link
                  href="/app/activity"
                  className="text-[13px] font-semibold text-brand transition hover:text-brand-deep"
                >
                  View all
                </Link>
              </div>
              {data.recent.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                  <IconTrendingUp size={20} className="text-ink-faint" />
                  <p className="text-sm text-ink-soft">
                    Your latest transactions will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-line-soft">
                  {data.recent.map((t) => {
                    const dir =
                      t.kind === "credit" || t.kind === "transfer_in"
                        ? "in"
                        : "out";
                    const voided = t.status === "voided";
                    return (
                      <Link
                        key={t.id}
                        href="/app/activity"
                        className="flex items-center gap-3 px-5 py-3 transition hover:bg-paper/70"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            voided
                              ? "bg-line-soft text-ink-faint"
                              : dir === "in"
                                ? "bg-good-soft text-good"
                                : "bg-line-soft text-ink-soft"
                          }`}
                        >
                          {voided ? (
                            <IconX size={15} />
                          ) : dir === "in" ? (
                            <IconArrowDownLeft size={15} />
                          ) : (
                            <IconArrowUpRight size={15} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-semibold ${
                              voided
                                ? "text-ink-faint line-through"
                                : "text-ink"
                            }`}
                          >
                            {t.description}
                          </span>
                          <span className="block truncate text-xs text-ink-faint">
                            {dayLabel(t.occurredAt)} · {t.accountName}
                          </span>
                        </span>
                        <span
                          className={`font-display text-sm font-semibold tracking-tight ${
                            voided
                              ? "text-ink-faint line-through"
                              : dir === "in"
                                ? "text-good"
                                : "text-ink"
                          }`}
                        >
                          {moneySigned(t.amountCents, dir)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                Your accounts
              </h2>
              <Link
                href="/app/accounts"
                className="text-[13px] font-semibold text-brand transition hover:text-brand-deep"
              >
                Manage
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {data.accounts.map((a) => (
                <Link
                  key={a.id}
                  href="/app/accounts"
                  className="card group p-5 transition hover:border-brand/40"
                >
                  <div className="flex items-center justify-between">
                    <TypeBadge type={a.type} />
                    <span className="text-xs font-medium text-ink-faint">
                      •••• {a.last4}
                    </span>
                  </div>
                  <p className="mt-3 truncate font-display text-base font-semibold text-ink group-hover:text-brand-deep">
                    {a.name}
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">
                    {money(a.balanceCents)}
                  </p>
                </Link>
              ))}
              <Link
                href="/app/accounts"
                className="flex min-h-[130px] items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-card/50 text-sm font-semibold text-ink-soft transition hover:border-brand/50 hover:bg-brand-soft/40 hover:text-brand-deep"
              >
                <IconPlus size={16} /> New account
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
