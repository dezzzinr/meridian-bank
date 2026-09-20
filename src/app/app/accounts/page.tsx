"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import type { AccountDTO } from "@/lib/queries";
import { AccountsClient } from "@/components/pages/AccountsClient";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountDTO[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);

  const load = () => {
    setLoadErr(false);
    apiFetch("/api/accounts", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d: { accounts: AccountDTO[] }) => setAccounts(d.accounts))
      .catch(() => setLoadErr(true));
  };

  useEffect(load, []);

  if (loadErr) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm font-semibold text-rose">
          Couldn't load your accounts.
        </p>
        <button className="btn-outline mt-4" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  if (!accounts) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="mt-4 h-5 w-40" />
              <Skeleton className="mt-5 h-8 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <AccountsClient accounts={accounts} />;
}
