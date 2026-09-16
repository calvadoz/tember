import { NextResponse } from "next/server";

import { loginAccount, validateAccountInput } from "@/lib/sync/auth";
import { isSyncConfigured } from "@/lib/sync/turso";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSyncConfigured()) return NextResponse.json({ error: "Cloud sync is not configured." }, { status: 503 });
  const body = await request.json().catch(() => undefined);
  const error = validateAccountInput(body?.username, body?.password);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const account = await loginAccount(body.username, body.password);
  if (!account) return NextResponse.json({ error: "The account name or password is incorrect." }, { status: 401 });
  return NextResponse.json({ username: account.username });
}
