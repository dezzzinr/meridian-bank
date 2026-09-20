import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, payees, transactions, transfers } from "@/db/schema";
import { apiError, HttpError, parseDollars, readBody, requireUser, str } from "@/lib/api";
import { listTransfers, settleAgedPending } from "@/lib/queries";

export async function GET() {
  const user = await requireUser();
  if (!user) return apiError(401, "You need to be signed in.");
  await settleAgedPending();
  const transfersList = await listTransfers(user.id);
  return Response.json({ transfers: transfersList });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiError(401, "You need to be signed in.");

  const body = await readBody(req);
  const sourceAccountId = Number(body.sourceAccountId);
  const destinationType = body.destinationType === "payee" ? "payee" : "account";
  const destinationId = Number(body.destinationId);
  const cents = parseDollars(body.amount);
  const note = body.note === undefined ? null : (str(body.note, 0, 140) ?? "");

  if (!Number.isInteger(sourceAccountId) || sourceAccountId <= 0) {
    return apiError(400, "Choose an account to pay from.");
  }
  if (!Number.isInteger(destinationId) || destinationId <= 0) {
    return apiError(400, destinationType === "payee" ? "Choose who to pay." : "Choose a destination account.");
  }
  if (cents === null || cents === 0) {
    return apiError(400, "Enter a valid amount greater than zero.");
  }
  if (note === null) return apiError(400, "Note must be 1-140 characters.");

  try {
    const transfer = await db.transaction(async (t) => {
      const [src] = await t
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, sourceAccountId), eq(accounts.userId, user.id)))
        .for("update");
      if (!src) throw new HttpError(404, "The source account doesn't exist anymore.");
      if (src.balanceCents < cents) {
        throw new HttpError(400, "Insufficient funds in " + src.name + ".");
      }

      if (destinationType === "account") {
        if (destinationId === src.id) {
          throw new HttpError(400, "Pick a different destination account.");
        }
        const [dest] = await t
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, destinationId), eq(accounts.userId, user.id)))
          .for("update");
        if (!dest) throw new HttpError(404, "The destination account doesn't exist anymore.");

        const [tr] = await t
          .insert(transfers)
          .values({
            userId: user.id,
            sourceAccountId: src.id,
            destinationAccountId: dest.id,
            amountCents: cents,
            note,
            status: "completed",
          })
          .returning();

        const now = new Date();
        await t.insert(transactions).values([
          {
            userId: user.id,
            accountId: src.id,
            transferId: tr.id,
            kind: "transfer_out",
            category: "Transfers",
            description: "Transfer to " + dest.name,
            note,
            amountCents: cents,
            status: "completed",
            occurredAt: now,
          },
          {
            userId: user.id,
            accountId: dest.id,
            transferId: tr.id,
            kind: "transfer_in",
            category: "Transfers",
            description: "Transfer from " + src.name,
            note,
            amountCents: cents,
            status: "completed",
            occurredAt: now,
          },
        ]);
        await t
          .update(accounts)
          .set({ balanceCents: sql`${accounts.balanceCents} - ${cents}` })
          .where(eq(accounts.id, src.id));
        await t
          .update(accounts)
          .set({ balanceCents: sql`${accounts.balanceCents} + ${cents}` })
          .where(eq(accounts.id, dest.id));
        return tr;
      }

      const [payeeRow] = await t
        .select()
        .from(payees)
        .where(and(eq(payees.id, destinationId), eq(payees.userId, user.id)))
        .limit(1);
      if (!payeeRow) throw new HttpError(404, "That payee no longer exists.");

      const [tr] = await t
        .insert(transfers)
        .values({
          userId: user.id,
          sourceAccountId: src.id,
          payeeId: payeeRow.id,
          amountCents: cents,
          note,
          status: "pending",
        })
        .returning();

      await t.insert(transactions).values({
        userId: user.id,
        accountId: src.id,
        transferId: tr.id,
        payeeId: payeeRow.id,
        kind: "payment",
        category: "Other",
        description: "Payment to " + payeeRow.name,
        note,
        amountCents: cents,
        status: "pending",
        occurredAt: new Date(),
      });
      await t
        .update(accounts)
        .set({ balanceCents: sql`${accounts.balanceCents} - ${cents}` })
        .where(eq(accounts.id, src.id));
      return tr;
    });

    return Response.json(
      { id: transfer.id, status: transfer.status },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof HttpError) return apiError(e.status, e.message);
    throw e;
  }
}
