import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { apiError, parseDollars, readBody, requireUser, str } from "@/lib/api";

export async function GET() {
  const user = await requireUser();
  if (!user) return apiError(401, "You need to be signed in.");
  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, user.id), isNull(accounts.closedAt)))
    .orderBy(asc(accounts.createdAt));
  return Response.json({
    accounts: rows.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      last4: a.last4,
      balanceCents: a.balanceCents,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiError(401, "You need to be signed in.");

  const body = await readBody(req);
  const name = str(body.name, 2, 48);
  const type = body.type === "savings" ? "savings" : "checking";
  if (!name) return apiError(400, "Give your account a name (2-48 characters).");
  const opening = parseDollars(body.amount ?? 0);
  if (opening === null) return apiError(400, "Opening deposit is not valid.");

  const last4 = String(1000 + Math.floor(Math.random() * 9000));
  const rows = await db
    .insert(accounts)
    .values({
      userId: user.id,
      name,
      type,
      last4,
      balanceCents: opening,
    })
    .returning();
  const account = rows[0];

  if (opening > 0) {
    await db.insert(transactions).values({
      userId: user.id,
      accountId: account.id,
      kind: "credit",
      category: "Other",
      description: "Opening deposit",
      amountCents: opening,
      status: "completed",
      occurredAt: new Date(),
    });
  }

  return Response.json(
    {
      id: account.id,
      name: account.name,
      type: account.type,
      last4: account.last4,
      balanceCents: account.balanceCents,
      createdAt: account.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
