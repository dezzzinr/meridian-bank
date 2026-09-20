"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountDTO } from "@/lib/queries";
import { OpenAccountModal } from "../modals/OpenAccountModal";
import { NewTransferModal } from "../modals/NewTransferModal";
import { IconPlus, IconSend } from "../icons";

export function DashboardActions({
  accounts,
  onboarding,
}: {
  accounts: AccountDTO[];
  onboarding: boolean;
}) {
  const router = useRouter();
  const [transferOpen, setTransferOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <>
      {onboarding ? (
        <button className="btn-primary" onClick={() => setAccountOpen(true)}>
          <IconPlus size={16} /> Open your first account
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            className="btn-outline"
            onClick={() => setAccountOpen(true)}
          >
            <IconPlus size={16} /> Open account
          </button>
          <button
            className="btn-primary"
            onClick={() => setTransferOpen(true)}
            disabled={accounts.length === 0}
          >
            <IconSend size={15} /> Send money
          </button>
        </div>
      )}

      <OpenAccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onDone={() => router.refresh()}
      />
      <NewTransferModal
        accounts={accounts}
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onDone={() => router.refresh()}
      />
    </>
  );
}
