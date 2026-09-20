import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { apiError, readBody, requireUser, str } from "@/lib/api";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return apiError(401, "You need to be signed in.");
  const { id } = await ctx.params;
  const body = await readBody(req);
  const name = str(body.name, 2, 48);
  if (!name) return apiError(400, "Account name must be 2-48 characters.");

  const rows = await db
    .update(accounts)
    .set({ name })
    .where(and(eq(accounts.id, Number(id)), eq(accounts.userId, user.id)))
    .returning();
  if (rows.length === 0) return apiError(404, "Account not found.");
  return Response.json({ id: rows[0].id, name: rows[0].name });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return apiError(401, "You need to be signed in.");
  const { id } = await ctx.params;

  const rows = await db
    .delete(accounts)
    .where(and(eq(accounts.id, Number(id)), eq(accounts.userId, user.id)))
    .returning();
  if (rows.length === 0) return apiError(404, "Account not found.");
  return Response.json({ ok: true });
}
