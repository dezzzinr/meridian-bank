import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions, transfers } from "@/db/schema";
import { apiError, requireUser } from "@/lib/api";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Cancel a pending external payment — voids the leg and refunds the account. */
export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return apiError(401, "You need to be signed in.");
  const { id } = await ctx.params;

  const rows = await db
    .select()
    .from(transfers)
    .where(and(eq(transfers.id, Number(id)), eq(transfers.userId, user.id)))
    .limit(1);
  const tr = rows[0];
  if (!tr) return apiError(404, "Transfer not found.");
  if (tr.status !== "pending") {
    return apiError(409, "Only pending payments can be cancelled.");
  }

  await db.transaction(async (t) => {
    await t.update(transfers).set({ status: "voided" }).where(eq(transfers.id, tr.id));
    await t
      .update(transactions)
      .set({ status: "voided" })
      .where(and(eq(transactions.transferId, tr.id), eq(transactions.status, "pending")));
    await t
      .update(accounts)
      .set({ balanceCents: sql`${accounts.balanceCents} + ${tr.amountCents}` })
      .where(eq(accounts.id, tr.sourceAccountId));
  });

  return Response.json({ ok: true });
}
