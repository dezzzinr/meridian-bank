import { apiError, requireUser } from "@/lib/api";

export async function GET() {
  const user = await requireUser();
  if (!user) return apiError(401, "You need to be signed in.");
  return Response.json({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  });
}
