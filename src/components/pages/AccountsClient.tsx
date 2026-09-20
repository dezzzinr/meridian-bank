"use client";

import { apiFetch } from "@/lib/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountDTO } from "@/lib/queries";
import { money } from "@/lib/format";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Modal";
import { Field, Input } from "../ui/Field";
import { TypeBadge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { OpenAccountModal } from "../modals/OpenAccountModal";
import {
  IconAlert,
  IconDots,
  IconPencil,
  IconPlus,
  IconSpinner,
  IconTrash,
  IconWallet,
} from "../icons";

export function AccountsClient({ accounts }: { accounts: AccountDTO[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<AccountDTO | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameErr, setRenameErr] = useState<string | null>(null);
  const [closing, setClosing] = useState<AccountDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const saveRename = async () => {
    if (!renaming) return;
    if (renameName.trim().length < 2) {
      setRenameErr("Name must be at least 2 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch(`/api/accounts/${renaming.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't rename.");
      toast("success", "Account renamed.");
      setRenaming(null);
      router.refresh();
    } catch (e) {
      setRenameErr(e instanceof Error ? e.message : "Couldn't rename.");
    } finally {
      setBusy(false);
    }
  };

  const doClose = async () => {
    if (!closing) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/accounts/${closing.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't close the account.");
      toast("info", `${closing.name} was closed.`);
      setClosing(null);
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Couldn't close the account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Accounts
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {accounts.length === 0
              ? "Open your first account to get started."
              : `${accounts.length} account${accounts.length === 1 ? "" : "s"} · ${money(
                  accounts.reduce((s, a) => s + a.balanceCents, 0),
                )} total`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <IconPlus size={16} /> Open account
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={<IconWallet size={22} />}
          title="No accounts yet"
          body="Open a checking or savings account and it will show up here with its balance and full history."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <IconPlus size={16} /> Open your first account
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => (
            <div key={a.id} className="card animate-rise relative p-5">
              <div className="flex items-start justify-between">
                <TypeBadge type={a.type} />
                <div className="relative">
                  <button
                    onClick={() => setMenuFor(menuFor === a.id ? null : a.id)}
                    className="rounded-lg p-1.5 text-ink-faint transition hover:bg-paper hover:text-ink"
                    aria-label={`Account actions for ${a.name}`}
                  >
                    <IconDots size={18} />
                  </button>
                  {menuFor === a.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuFor(null)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-card shadow-lg">
                        <button
                          onClick={() => {
                            setMenuFor(null);
                            setRenaming(a);
                            setRenameName(a.name);
                            setRenameErr(null);
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-ink transition hover:bg-paper"
                        >
                          <IconPencil size={14} /> Rename
                        </button>
                        <button
                          onClick={() => {
                            setMenuFor(null);
                            setClosing(a);
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-rose transition hover:bg-rose-soft"
                        >
                          <IconTrash size={14} /> Close account
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <h3 className="mt-3 truncate font-display text-lg font-semibold tracking-tight text-ink">
                {a.name}
              </h3>
              <p className="mt-0.5 text-xs font-medium tracking-wide text-ink-faint">
                Account •••• {a.last4}
              </p>
              <p className="mt-5 font-display text-[28px] font-semibold tracking-tight text-ink">
                {money(a.balanceCents)}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                Available balance
              </p>
            </div>
          ))}
          <button
            onClick={() => setOpen(true)}
            className="flex min-h-[190px] flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-line bg-card/50 text-ink-soft transition hover:border-brand/50 hover:bg-brand-soft/40 hover:text-brand-deep"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
              <IconPlus size={18} />
            </span>
            <span className="text-sm font-semibold">Open new account</span>
          </button>
        </div>
      )}

      <OpenAccountModal
        open={open}
        onClose={() => setOpen(false)}
        onDone={() => router.refresh()}
      />

      <Modal
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Rename account"
        subtitle={renaming ? `Currently “${renaming.name}”` : undefined}
      >
        <div className="space-y-4">
          <Field label="Account name" error={renameErr}>
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              maxLength={48}
              autoFocus
            />
          </Field>
          <div className="flex gap-2">
            <button
              className="btn-outline flex-1"
              onClick={() => setRenaming(null)}
            >
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={saveRename} disabled={busy}>
              {busy && <IconSpinner size={15} />} Rename
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={closing !== null}
        onClose={() => setClosing(null)}
        title="Close account"
        subtitle="This can't be undone."
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-rose-soft p-3.5 text-rose">
            <IconAlert size={18} className="mt-0.5 shrink-0" />
            <p className="text-[13px] leading-relaxed">
              <span className="font-semibold">{closing?.name}</span> has a balance
              of{" "}
              <span className="font-semibold">
                {closing ? money(closing.balanceCents) : ""}
              </span>
              . Closing it will permanently delete the account and its entire
              transaction history.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-outline flex-1"
              onClick={() => setClosing(null)}
              disabled={busy}
            >
              Keep account
            </button>
            <button className="btn-danger flex-1" onClick={doClose} disabled={busy}>
              {busy && <IconSpinner size={15} />} Close account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
