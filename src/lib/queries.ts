import {
  and,
  asc,
  desc,
  eq,
  gt,
  isNull,
  lt,
  ne,
} from "drizzle-orm";
import { db } from "@/db";
import { accounts, payees, transactions, transfers } from "@/db/schema";

export interface AccountDTO {
  id: number;
  name: string;
  type: "checking" | "savings";
  last4: string;
  balanceCents: number;
  createdAt: string;
}

export interface TransactionDTO {
  id: number;
  accountId: number;
  accountName: string | null;
  accountType: "checking" | "savings" | null;
  kind: "credit" | "debit" | "payment" | "transfer_in" | "transfer_out";
  category: string;
  description: string;
  note: string | null;
  amountCents: number;
  status: "pending" | "completed" | "voided";
  occurredAt: string;
  payeeName: string | null;
  transferId: number | null;
}

export interface TransferDTO {
  id: number;
  amountCents: number;
  note: string | null;
  status: "pending" | "completed" | "voided";
  createdAt: string;
  sourceAccountId: number;
  sourceAccountName: string | null;
  destinationAccountId: number | null;
  destinationAccountName: string | null;
  payeeName: string | null;
}

export interface PayeeDTO {
  id: number;
  name: string;
  methodType: "bank" | "email" | "mobile";
  methodDetail: string;
  notes: string | null;
  createdAt: string;
}

const iso = (d: Date | string): string => (d instanceof Date ? d.toISOString() : d);

export function toAccountDTO(a: typeof accounts.$inferSelect): AccountDTO {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    last4: a.last4,
    balanceCents: a.balanceCents,
    createdAt: iso(a.createdAt),
  };
}

/** Pending payments settle automatically after 10 minutes. */
export async function settleAgedPending(): Promise<void> {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000);
  await db
    .update(transactions)
    .set({ status: "completed" })
    .where(and(eq(transactions.status, "pending"), lt(transactions.occurredAt, cutoff)));
  await db
    .update(transfers)
    .set({ status: "completed" })
    .where(and(eq(transfers.status, "pending"), lt(transfers.createdAt, cutoff)));
}

export async function listAccounts(userId: number): Promise<AccountDTO[]> {
  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), isNull(accounts.closedAt)))
    .orderBy(asc(accounts.createdAt));
  return rows.map(toAccountDTO);
}

export async function listTransactions(userId: number, limit = 300): Promise<TransactionDTO[]> {
  const rows = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      accountName: accounts.name,
      accountType: accounts.type,
      kind: transactions.kind,
      category: transactions.category,
      description: transactions.description,
      note: transactions.note,
      amountCents: transactions.amountCents,
      status: transactions.status,
      occurredAt: transactions.occurredAt,
      payeeName: payees.name,
      transferId: transactions.transferId,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(payees, eq(transactions.payeeId, payees.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    accountId: r.accountId,
    accountName: r.accountName,
    accountType: r.accountType,
    kind: r.kind,
    category: r.category,
    description: r.description,
    note: r.note,
    amountCents: r.amountCents,
    status: r.status,
    occurredAt: iso(r.occurredAt),
    payeeName: r.payeeName,
    transferId: r.transferId,
  }));
}

export async function listPayees(userId: number): Promise<PayeeDTO[]> {
  const rows = await db
    .select()
    .from(payees)
    .where(eq(payees.userId, userId))
    .orderBy(asc(payees.name));
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    methodType: p.methodType,
    methodDetail: p.methodDetail,
    notes: p.notes,
    createdAt: iso(p.createdAt),
  }));
}

export async function listTransfers(userId: number): Promise<TransferDTO[]> {
  const destAccounts = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(eq(accounts.userId, userId));
  const nameById = new Map(destAccounts.map((a) => [a.id, a.name]));

  const rows = await db
    .select({
      id: transfers.id,
      amountCents: transfers.amountCents,
      note: transfers.note,
      status: transfers.status,
      createdAt: transfers.createdAt,
      sourceAccountId: transfers.sourceAccountId,
      destinationAccountId: transfers.destinationAccountId,
      payeeName: payees.name,
    })
    .from(transfers)
    .leftJoin(payees, eq(transfers.payeeId, payees.id))
    .where(eq(transfers.userId, userId))
    .orderBy(desc(transfers.createdAt), desc(transfers.id));

  return rows.map((r) => ({
    id: r.id,
    amountCents: r.amountCents,
    note: r.note,
    status: r.status,
    createdAt: iso(r.createdAt),
    sourceAccountId: r.sourceAccountId,
    sourceAccountName: nameById.get(r.sourceAccountId) ?? "Closed account",
    destinationAccountId: r.destinationAccountId,
    destinationAccountName:
      r.destinationAccountId != null
        ? nameById.get(r.destinationAccountId) ?? "Closed account"
        : null,
    payeeName: r.payeeName ?? "Removed payee",
  }));
}

export interface DashboardData {
  accounts: AccountDTO[];
  totalCents: number;
  income30: number;
  spend30: number;
  pendingCount: number;
  pendingCents: number;
  weeks: { label: string; cents: number }[];
  recent: TransactionDTO[];
}

const DAY = 86_400_000;

export async function dashboard(userId: number): Promise<DashboardData> {
  await settleAgedPending();

  const accountRows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), isNull(accounts.closedAt)))
    .orderBy(asc(accounts.createdAt));
  const acctList = accountRows.map(toAccountDTO);
  const totalCents = acctList.reduce((s, a) => s + a.balanceCents, 0);

  const since45 = new Date(Date.now() - 45 * DAY);
  const since30 = new Date(Date.now() - 30 * DAY);
  const txs = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gt(transactions.occurredAt, since45),
        ne(transactions.status, "voided"),
      ),
    )
    .orderBy(desc(transactions.occurredAt));

  const income30 = txs
    .filter((t) => t.kind === "credit" && t.occurredAt >= since30)
    .reduce((s, t) => s + t.amountCents, 0);
  const spend30 = txs
    .filter(
      (t) =>
        (t.kind === "debit" || t.kind === "payment") && t.occurredAt >= since30,
    )
    .reduce((s, t) => s + t.amountCents, 0);

  const pending = txs.filter((t) => t.status === "pending" && t.kind === "payment");
  const pendingCents = pending.reduce((s, t) => s + t.amountCents, 0);

  const weeks: { label: string; cents: number }[] = [];
  const now = Date.now();
  for (let i = 7; i >= 0; i--) {
    const start = now - (i + 1) * 7 * DAY;
    const end = now - i * 7 * DAY;
    const cents = txs
      .filter(
        (t) =>
          (t.kind === "debit" || t.kind === "payment") &&
          t.occurredAt.getTime() > start &&
          t.occurredAt.getTime() <= end,
      )
      .reduce((s, t) => s + t.amountCents, 0);
    weeks.push({
      label: new Date(start).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      cents,
    });
  }

  const recent = await listTransactions(userId, 6);

  return {
    accounts: acctList,
    totalCents,
    income30,
    spend30,
    pendingCount: pending.length,
    pendingCents,
    weeks,
    recent,
  };
}
