"use client";

import { apiFetch } from "@/lib/client";
import { useState, type FormEvent } from "react";
import { fmtDate } from "@/lib/format";
import { useToast } from "../ui/Toast";
import { Field, Input } from "../ui/Field";
import { IconCheck, IconLogOut, IconShield, IconSpinner, IconUser } from "../icons";

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string; createdAt: string };
}) {
  const toast = useToast();

  const [name, setName] = useState(user.name);
  const [nameBusy, setNameBusy] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passErr, setPassErr] = useState<string | null>(null);
  const [passBusy, setPassBusy] = useState(false);

  const nameChanged = name.trim() !== user.name && name.trim().length > 0;

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!nameChanged) return;
    setNameBusy(true);
    try {
      const res = await apiFetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't update your name.");
      toast("success", "Profile updated.");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Couldn't update your name.");
    } finally {
      setNameBusy(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPassErr(null);
    if (next.length < 8) {
      setPassErr("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setPassErr("New passwords don't match.");
      return;
    }
    setPassBusy(true);
    try {
      const res = await apiFetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't change your password.");
      toast("success", "Password updated. Use it the next time you sign in.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setPassErr(err instanceof Error ? err.message : "Couldn't change your password.");
    } finally {
      setPassBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={saveName} className="card p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-deep">
            <IconUser size={16} />
          </span>
          <h2 className="font-display text-base font-semibold text-ink">
            Profile
          </h2>
        </div>
        <div className="space-y-4">
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </Field>
          <Field label="Email">
            <Input value={user.email} disabled className="bg-paper text-ink-soft" />
            <p className="mt-1.5 text-xs text-ink-faint">
              We'll never change your email in this demo.
            </p>
          </Field>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={!nameChanged || nameBusy}>
              {nameBusy ? <IconSpinner size={15} /> : <IconCheck size={15} />}
              Save changes
            </button>
          </div>
        </div>
      </form>

      <form onSubmit={savePassword} className="card p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-deep">
            <IconShield size={16} />
          </span>
          <h2 className="font-display text-base font-semibold text-ink">
            Password
          </h2>
        </div>
        <div className="space-y-4">
          <Field label="Current password">
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New password">
              <Input
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>
          {passErr && (
            <p className="rounded-lg bg-rose-soft px-3 py-2.5 text-xs font-semibold text-rose">
              {passErr}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={passBusy || !current || !next}
            >
              {passBusy && <IconSpinner size={15} />}
              Update password
            </button>
          </div>
        </div>
      </form>

      <div className="card p-5 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Session</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Member since {fmtDate(user.createdAt)} · Sessions last 7 days on each
              device.
            </p>
          </div>
          <button className="btn-outline text-rose hover:bg-rose-soft" onClick={signOut}>
            <IconLogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
