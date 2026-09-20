"use client";

import { apiFetch } from "@/lib/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountDTO, TransferDTO } from "@/lib/queries";
import { dayLabel, money } from "@/lib/format";
import { useToast } from "../ui/Toast";
import { RowSkeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { StatusBadge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { NewTransferModal } from "../modals/NewTransferModal";
import { IconInfo, IconSend, IconSpinner, IconX } from "../icons";

export function PaymentsClient() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<TransferDTO[] | null>(null);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [loadErr, setLoadErr] = useState(false);
  const [open, setOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = () => {
    setLoadErr(false);
    Promise.all([
      apiFetch("/api/transfers", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error()),
      ),
      apiFetch("/api/accounts", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error()),
      ),
    ])
      .then(([t, a]) => {
        setItems(t.transfers ?? []);
        setAccounts(a.accounts ?? []);
      })
      .catch(() => setLoadErr(true));
  };

  useEffect(load, []);

  const cancel = async (t: TransferDTO) => {
    const dest = t.destinationAccountName ?? t.payeeName ?? "payee";
    setCancellingId(t.id);
    setItems((prev) =>
      prev
        ? prev.map((x) => (x.id === t.id ? { ...x, status: "voided" as const } : x))
        : prev,
    );
    try {
      const res = await apiFetch(`/api/transfers/${t.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't cancel.");
      toast("success", `Payment to ${dest} cancelled — ${money(t.amountCents)} returned.`);
      router.refresh();
    } catch (e) {
      setItems((prev) =>
        prev ? prev.map((x) => (x.id === t.id ? { ...x, status: "pending" as const } : x)) : prev,
      );
      toast("error", e instanceof Error ? e.message : "Couldn't cancel the payment.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Payments
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Transfers between your accounts and payments to people and businesses.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setOpen(true)}
          disabled={accounts.length === 0}
        >
          <IconSend size={15} /> New payment
        </button>
      </div>

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-brand/20 bg-brand-soft/60 px-4 py-3">
        <IconInfo size={16} className="mt-0.5 shrink-0 text-brand-deep" />
        <p className="text-[13px] leading-relaxed text-brand-deep">
          Transfers between your own accounts are instant. Payments to external
          payees process as <span className="font-semibold">pending</span> and
          settle within minutes — you can cancel any pending payment below.
        </p>
      </div>

      <div className="card overflow-hidden">
        {loadErr ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-rose">
              Couldn't load your payments.
            </p>
            <button className="btn-outline mt-4" onClick={load}>
              Try again
            </button>
          </div>
        ) : items === null ? (
          <div className="divide-y divide-line-soft">
            {Array.from({ length: 5 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            compact
            icon={<IconSend size={20} />}
            title="No payments yet"
            body="When you send money between accounts or pay a payee, it will show up here."
            action={
              accounts.length > 0 ? (
                <button className="btn-primary" onClick={() => setOpen(true)}>
                  <IconSend size={15} /> Make your first payment
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-line-soft">
            {items.map((t) => {
              const dest = t.destinationAccountName ?? t.payeeName ?? "Removed payee";
              const toPayee = t.destinationAccountName === null;
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Avatar name={dest} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${
                        t.status === "voided" ? "text-ink-faint line-through" : "text-ink"
                      }`}
                    >
                      {toPayee ? dest : `To ${dest}`}
                    </p>
                    <p className="truncate text-xs text-ink-faint">
                      From {t.sourceAccountName} · {dayLabel(t.createdAt)}
                      {t.note ? ` · “${t.note}”` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`font-display text-sm font-semibold tracking-tight ${
                        t.status === "voided" ? "text-ink-faint line-through" : "text-ink"
                      }`}
                    >
                      -{money(t.amountCents)}
                    </span>
                    <StatusBadge status={t.status} />
                    {t.status === "pending" && (
                      <button
                        onClick={() => cancel(t)}
                        disabled={cancellingId === t.id}
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-semibold text-rose transition hover:bg-rose-soft disabled:opacity-60"
                      >
                        {cancellingId === t.id ? (
                          <IconSpinner size={11} />
                        ) : (
                          <IconX size={11} />
                        )}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NewTransferModal
        accounts={accounts}
        open={open}
        onClose={() => setOpen(false)}
        onDone={() => {
          load();
          router.refresh();
        }}
      />
    </div>
  );
}
