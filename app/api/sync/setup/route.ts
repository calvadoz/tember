import { NextResponse } from "next/server";

import { setupAccount, validateAccountInput } from "@/lib/sync/auth";
import { isSyncConfigured } from "@/lib/sync/turso";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSyncConfigured()) return NextResponse.json({ error: "Cloud sync is not configured." }, { status: 503 });
  const body = await request.json().catch(() => undefined);
  const error = validateAccountInput(body?.username, body?.password);
  if (error) return NextResponse.json({ error }, { status: 400 });
  try {
    const account = await setupAccount(body.username, body.password);
    return NextResponse.json({ username: account.username }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The shared account has already been set up." }, { status: 409 });
  }
}
