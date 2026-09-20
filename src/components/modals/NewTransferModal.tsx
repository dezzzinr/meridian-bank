"use client";

import { apiFetch } from "@/lib/client";
import { useEffect, useState } from "react";
import type { AccountDTO, PayeeDTO } from "@/lib/queries";
import { money } from "@/lib/format";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Modal";
import { Field, Input, MoneyInput, Select } from "../ui/Field";
import { IconClock, IconSpinner } from "../icons";

export function NewTransferModal({
  accounts,
  open,
  onClose,
  onDone,
}: {
  accounts: AccountDTO[];
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const toast = useToast();
  const [sourceId, setSourceId] = useState<number>(0);
  const [tab, setTab] = useState<"account" | "payee">("account");
  const [destId, setDestId] = useState<number>(0);
  const [payees, setPayees] = useState<PayeeDTO[] | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [amountErr, setAmountErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSourceId(accounts[0]?.id ?? 0);
      setTab("account");
      setDestId(0);
      setAmount("");
      setNote("");
      setErr(null);
      setAmountErr(null);
      setLoading(false);
    }
  }, [open, accounts]);

  useEffect(() => {
    if (open && tab === "payee" && payees === null) {
      apiFetch("/api/payees", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setPayees(d.payees ?? []))
        .catch(() => setPayees([]));
    }
  }, [open, tab, payees]);

  const source = accounts.find((a) => a.id === sourceId);
  const parsed = Number(amount);
  const cents =
    amount.trim() && Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
  const over = !!source && cents > 0 && cents > source.balanceCents;

  const submit = async () => {
    if (!source) {
      setErr("Choose an account to pay from.");
      return;
    }
    if (!destId) {
      setErr(tab === "payee" ? "Choose who to pay." : "Choose a destination account.");
      return;
    }
    if (cents <= 0) {
      setAmountErr("Enter an amount greater than zero.");
      return;
    }
    if (cents > source.balanceCents) {
      setAmountErr(`Available balance is ${money(source.balanceCents)}.`);
      return;
    }
    setErr(null);
    setAmountErr(null);
    setLoading(true);
    try {
      const res = await apiFetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceAccountId: source.id,
          destinationType: tab,
          destinationId: destId,
          amount: (cents / 100).toFixed(2),
          note: note.trim() ? note.trim() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      const destName =
        tab === "account"
          ? accounts.find((a) => a.id === destId)?.name ?? "your other account"
          : payees?.find((p) => p.id === destId)?.name ?? "your payee";
      toast(
        "success",
        tab === "account"
          ? `${money(cents)} moved to ${destName}.`
          : `${money(cents)} sent to ${destName}. It will settle within minutes.`,
      );
      onClose();
      onDone?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send money"
      subtitle="Move funds between accounts or pay someone."
    >
      <div className="space-y-4">
        <Field label="From">
          <Select
            value={sourceId}
            onChange={(e) => {
              setSourceId(Number(e.target.value));
              setDestId(0);
            }}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {money(a.balanceCents)}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <p className="label">To</p>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-paper p-1">
            {(
              [
                ["account", "My account"],
                ["payee", "Payee"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTab(key);
                  setDestId(0);
                }}
                className={`rounded-md px-3 py-2 text-[13px] font-semibold transition ${
                  tab === key
                    ? "bg-card text-ink shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Field label={tab === "account" ? "Destination account" : "Payee"}>
          {tab === "account" ? (
            <Select
              value={destId || ""}
              onChange={(e) => setDestId(Number(e.target.value))}
            >
              <option value="" disabled>
                Choose an account…
              </option>
              {accounts
                .filter((a) => a.id !== sourceId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </Select>
          ) : payees === null ? (
            <div className="input flex items-center gap-2 text-ink-faint">
              <IconSpinner size={15} /> Loading payees…
            </div>
          ) : (
            <>
              <Select
                value={destId || ""}
                onChange={(e) => setDestId(Number(e.target.value))}
              >
                <option value="" disabled>
                  {payees.length === 0 ? "No payees yet" : "Choose a payee…"}
                </option>
                {payees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              {payees.length === 0 && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  You don't have any payees yet — you can add them from the
                  Payees page, then come back here.
                </p>
              )}
            </>
          )}
        </Field>

        <Field
          label="Amount"
          error={amountErr ?? (over ? `Available balance is ${source ? money(source.balanceCents) : ""}.` : null)}
        >
          <MoneyInput
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            error={!!amountErr || over}
          />
        </Field>

        <Field label="Note (optional)">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's this for?"
            maxLength={140}
          />
        </Field>

        {tab === "payee" && (
          <p className="flex items-center gap-2 rounded-lg bg-amber-soft px-3 py-2.5 text-xs font-medium text-amber">
            <IconClock size={14} className="shrink-0" />
            External payments process as pending and settle within minutes. You
            can cancel while pending.
          </p>
        )}

        {err && (
          <p className="rounded-lg bg-rose-soft px-3 py-2.5 text-xs font-semibold text-rose">
            {err}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !source}
            className="btn-primary flex-1"
          >
            {loading && <IconSpinner size={15} />}
            {tab === "account" ? "Transfer now" : "Send payment"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
