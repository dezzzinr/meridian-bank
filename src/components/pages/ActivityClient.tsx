"use client";

import { apiFetch } from "@/lib/client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountDTO, TransactionDTO } from "@/lib/queries";
import {
  CATEGORIES,
  dayKey,
  dayLabel,
  fmtDateTime,
  money,
  moneySigned,
} from "@/lib/format";
import { useToast } from "../ui/Toast";
import { RowSkeleton, Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { CategoryPill, StatusBadge } from "../ui/Badge";
import { IconArrowDownLeft, IconArrowUpRight, IconSearch, IconSwap, IconX } from "../icons";

const dirOf = (t: TransactionDTO): "in" | "out" =>
  t.kind === "credit" || t.kind === "transfer_in" ? "in" : "out";

export function ActivityClient() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<{
    transactions: TransactionDTO[];
    accounts: AccountDTO[];
  } | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [q, setQ] = useState("");
  const [accId, setAccId] = useState(0);
  const [dir, setDir] = useState<"all" | "in" | "out">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const [savingCatId, setSavingCatId] = useState<number | null>(null);

  const load = () => {
    setLoadErr(false);
    apiFetch("/api/transactions", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setData(d))
      .catch(() => setLoadErr(true));
  };

  useEffect(load, []);

  const selected =
    data?.transactions.find((t) => t.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.transactions.filter((t) => {
      if (accId && t.accountId !== accId) return false;
      if (dir !== "all" && dirOf(t) !== dir) return false;
      if (needle) {
        const hay = [
          t.description,
          t.category,
          t.payeeName ?? "",
          t.accountName ?? "",
          t.note ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [data, q, accId, dir]);

  const groups = useMemo(() => {
    const m = new Map<string, TransactionDTO[]>();
    for (const t of filtered) {
      const k = dayKey(t.occurredAt);
      const arr = m.get(k);
      if (arr) arr.push(t);
      else m.set(k, [t]);
    }
    return [...m.entries()];
  }, [filtered]);

  const voidTx = async (t: TransactionDTO) => {
    setVoidingId(t.id);
    const prevStatus = t.status;
    setData((d) =>
      d
        ? {
            ...d,
            transactions: d.transactions.map((x) =>
              x.id === t.id ? { ...x, status: "voided" as const } : x,
            ),
          }
        : d,
    );
    try {
      const res = await apiFetch(`/api/transactions/${t.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't void the payment.");
      toast(
        "success",
        `Payment voided — ${money(t.amountCents)} returned to ${t.accountName ?? "your account"}.`,
      );
      router.refresh();
    } catch (e) {
      setData((d) =>
        d
          ? {
              ...d,
              transactions: d.transactions.map((x) =>
                x.id === t.id ? { ...x, status: prevStatus } : x,
              ),
            }
          : d,
      );
      toast(
        "error",
        e instanceof Error ? e.message : "Couldn't void the payment.",
      );
    } finally {
      setVoidingId(null);
    }
  };

  const recategorize = async (t: TransactionDTO, category: string) => {
    setSavingCatId(t.id);
    const prev = t.category;
    setData((d) =>
      d
        ? {
            ...d,
            transactions: d.transactions.map((x) =>
              x.id === t.id ? { ...x, category } : x,
            ),
          }
        : d,
    );
    try {
      const res = await apiFetch(`/api/transactions/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't update the category.");
      toast("success", `Recategorized as ${category}.`);
    } catch (e) {
      setData((d) =>
        d
          ? {
              ...d,
              transactions: d.transactions.map((x) =>
                x.id === t.id ? { ...x, category: prev } : x,
              ),
            }
          : d,
      );
      toast(
        "error",
        e instanceof Error ? e.message : "Couldn't update the category.",
      );
    } finally {
      setSavingCatId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Activity
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Everything that moved in and out of your accounts.
          </p>
        </div>
      </div>

      <div className="card mb-4 flex flex-col gap-2.5 p-3 sm:flex-row">
        <div className="relative flex-1">
          <IconSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search merchants, payees, notes…"
            className="input pl-9"
          />
        </div>
        <select
          value={accId}
          onChange={(e) => setAccId(Number(e.target.value))}
          className="input sm:w-52"
          aria-label="Filter by account"
        >
          <option value={0}>All accounts</option>
          {(data?.accounts ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={dir}
          onChange={(e) => setDir(e.target.value as "all" | "in" | "out")}
          className="input sm:w-36"
          aria-label="Filter by direction"
        >
          <option value="all">In & out</option>
          <option value="in">Money in</option>
          <option value="out">Money out</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loadErr ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-rose">
              Couldn't load your activity.
            </p>
            <button className="btn-outline mt-4" onClick={load}>
              Try again
            </button>
          </div>
        ) : !data ? (
          <div className="divide-y divide-line-soft">
            {Array.from({ length: 8 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            icon={<IconSearch size={20} />}
            title={data.transactions.length === 0 ? "No activity yet" : "Nothing matches your filters"}
            body={
              data.transactions.length === 0
                ? "Once money moves through your accounts, it will show up here."
                : "Try a different search term, account, or direction."
            }
            action={
              data.transactions.length > 0 ? (
                <button
                  className="btn-outline"
                  onClick={() => {
                    setQ("");
                    setAccId(0);
                    setDir("all");
                  }}
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div>
            {groups.map(([key, rows]) => (
              <div key={key}>
                <div className="sticky top-0 z-10 border-b border-line-soft bg-paper/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint backdrop-blur">
                  {dayLabel(rows[0]!.occurredAt)}
                </div>
                <div className="divide-y divide-line-soft">
                  {rows.map((t) => {
                    const d = dirOf(t);
                    const voided = t.status === "voided";
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-paper/70"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            voided
                              ? "bg-line-soft text-ink-faint"
                              : d === "in"
                                ? "bg-good-soft text-good"
                                : "bg-line-soft text-ink-soft"
                          }`}
                        >
                          {voided ? (
                            <IconX size={15} />
                          ) : d === "in" ? (
                            <IconArrowDownLeft size={15} />
                          ) : (
                            <IconArrowUpRight size={15} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-semibold ${
                              voided ? "text-ink-faint line-through" : "text-ink"
                            }`}
                          >
                            {t.description}
                          </span>
                          <span className="block truncate text-xs text-ink-faint">
                            {t.accountName}
                            {t.payeeName ? ` · ${t.payeeName}` : ""}
                            {t.note ? ` · ${t.note}` : ""}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`font-display text-sm font-semibold tracking-tight ${
                              voided
                                ? "text-ink-faint line-through"
                                : d === "in"
                                  ? "text-good"
                                  : "text-ink"
                            }`}
                          >
                            {moneySigned(t.amountCents, d)}
                          </span>
                          {t.status !== "completed" ? (
                            <StatusBadge status={t.status} />
                          ) : (
                            <CategoryPill category={t.category} />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-[55]">
          <div
            className="animate-fade absolute inset-0 bg-ink/40"
            onClick={() => setSelectedId(null)}
          />
          <div className="animate-drawer absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
              <h2 className="font-display text-base font-semibold text-ink">
                Transaction details
              </h2>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-lg p-1.5 text-ink-faint transition hover:bg-paper hover:text-ink"
                aria-label="Close details"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div>
                <p
                  className={`font-display text-4xl font-semibold tracking-tight ${
                    selected.status === "voided"
                      ? "text-ink-faint line-through"
                      : dirOf(selected) === "in"
                        ? "text-good"
                        : "text-ink"
                  }`}
                >
                  {moneySigned(selected.amountCents, dirOf(selected))}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={selected.status} />
                  {selected.status === "completed" && (
                    <CategoryPill category={selected.category} />
                  )}
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-faint">Description</dt>
                  <dd className="text-right font-semibold text-ink">
                    {selected.description}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-faint">Account</dt>
                  <dd className="font-medium text-ink">
                    {selected.accountName ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-faint">Date</dt>
                  <dd className="font-medium text-ink">
                    {fmtDateTime(selected.occurredAt)}
                  </dd>
                </div>
                {selected.payeeName && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-faint">Payee</dt>
                    <dd className="font-medium text-ink">{selected.payeeName}</dd>
                  </div>
                )}
                {selected.note && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-faint">Note</dt>
                    <dd className="text-right font-medium text-ink">
                      {selected.note}
                    </dd>
                  </div>
                )}
              </dl>

              <div>
                <p className="label">Category</p>
                <div className="relative">
                  <select
                    value={selected.category}
                    disabled={selected.status === "voided" || savingCatId === selected.id}
                    onChange={(e) => recategorize(selected, e.target.value)}
                    className="input pr-8"
                    aria-label="Recategorize"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {savingCatId === selected.id && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
                      <IconSwap size={14} className="animate-spin" />
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-ink-faint">
                  Recategorizing updates your spending breakdown instantly.
                </p>
              </div>
            </div>

            {selected.status === "pending" && (
              <div className="border-t border-line-soft p-4">
                <button
                  className="btn-danger w-full"
                  onClick={() => voidTx(selected)}
                  disabled={voidingId === selected.id}
                >
                  {voidingId === selected.id ? "Voiding…" : "Void pending payment"}
                </button>
                <p className="mt-2 text-center text-xs text-ink-faint">
                  Returns {money(selected.amountCents)} to {selected.accountName}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
