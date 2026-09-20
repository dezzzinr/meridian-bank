"use client";

import { apiFetch } from "@/lib/client";
import { useEffect, useState } from "react";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Modal";
import { Field, Input, MoneyInput } from "../ui/Field";
import { IconSpinner, IconTrendingUp, IconWallet } from "../icons";

export function OpenAccountModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<"checking" | "savings">("checking");
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setType("checking");
      setAmount("");
      setErr(null);
      setLoading(false);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      setErr("Give your account a name.");
      return;
    }
    const amt = Number(amount);
    if (amount.trim() && (!Number.isFinite(amt) || amt < 0)) {
      setErr("Opening deposit is not valid.");
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await apiFetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          amount: amount.trim() ? amount : "0",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't open the account.");
      toast("success", `${name.trim()} is ready to use.`);
      onClose();
      onDone?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't open the account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Open a new account"
      subtitle="It takes about ten seconds."
    >
      <div className="space-y-4">
        <Field label="Account name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "savings" ? "e.g. Vacation Fund" : "e.g. Everyday Checking"}
            maxLength={48}
            autoFocus
          />
        </Field>

        <div>
          <p className="label">Account type</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setType("checking")}
              className={`rounded-xl border p-3.5 text-left transition ${
                type === "checking"
                  ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20"
                  : "border-line bg-card hover:border-ink-faint/40"
              }`}
            >
              <IconWallet size={18} className="mb-2 text-brand-deep" />
              <p className="text-sm font-semibold text-ink">Checking</p>
              <p className="mt-0.5 text-xs leading-snug text-ink-soft">
                Everyday spending, bills and transfers.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setType("savings")}
              className={`rounded-xl border p-3.5 text-left transition ${
                type === "savings"
                  ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20"
                  : "border-line bg-card hover:border-ink-faint/40"
              }`}
            >
              <IconTrendingUp size={18} className="mb-2 text-brand-deep" />
              <p className="text-sm font-semibold text-ink">Savings</p>
              <p className="mt-0.5 text-xs leading-snug text-ink-soft">
                Grow your balance. 1.90% APY.
              </p>
            </button>
          </div>
        </div>

        <Field label="Opening deposit (optional)">
          <MoneyInput value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>

        {err && (
          <p className="rounded-lg bg-rose-soft px-3 py-2.5 text-xs font-semibold text-rose">
            {err}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading && <IconSpinner size={15} />}
            Open account
          </button>
        </div>
      </div>
    </Modal>
  );
}
