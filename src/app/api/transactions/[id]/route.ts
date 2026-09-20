import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions, transfers } from "@/db/schema";
import { CATEGORIES } from "@/lib/format";
import { apiError, readBody, requireUser } from "@/lib/api";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Recategorize a transaction (update). */
export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return apiError(401, "You need to be signed in.");
  const { id } = await ctx.params;
  const body = await readBody(req);
  const category = typeof body.category === "string" ? body.category : "";
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return apiError(400, "Unknown category.");
  }

  const rows = await db
    .update(transactions)
    .set({ category })
    .where(and(eq(transactions.id, Number(id)), eq(transactions.userId, user.id)))
    .returning();
  if (rows.length === 0) return apiError(404, "Transaction not found.");
  return Response.json({ id: rows[0].id, category: rows[0].category });
}

/** Void a pending payment (delete) — returns the funds to the account. */
export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return apiError(401, "You need to be signed in.");
  const { id } = await ctx.params;

  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, Number(id)), eq(transactions.userId, user.id)))
    .limit(1);
  const tx = rows[0];
  if (!tx) return apiError(404, "Transaction not found.");
  if (tx.status !== "pending") {
    return apiError(409, "Only pending payments can be voided.");
  }

  await db.transaction(async (t) => {
    await t
      .update(transactions)
      .set({ status: "voided" })
      .where(eq(transactions.id, tx.id));
    if (tx.transferId) {
      await t
        .update(transfers)
        .set({ status: "voided" })
        .where(eq(transfers.id, tx.transferId));
    }
    await t
      .update(accounts)
      .set({ balanceCents: sql`${accounts.balanceCents} + ${tx.amountCents}` })
      .where(eq(accounts.id, tx.accountId));
  });

  return Response.json({ ok: true });
}
