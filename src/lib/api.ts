import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "./auth";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function apiError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const data = (await req.json()) as Record<string, unknown>;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

/** Parse a dollar amount ("120.5" or 120.5) into integer cents. */
export function parseDollars(value: unknown): number | null {
  if (typeof value === "number" || typeof value === "string") {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return null;
    const cents = Math.round(n * 100);
    if (cents > 100_000_000_00) return null; // $100M cap
    return cents;
  }
  return null;
}

export function str(v: unknown, min = 0, max = Infinity): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s.length < min || s.length > max) return null;
  return s;
}
