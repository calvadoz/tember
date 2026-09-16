import { NextResponse } from "next/server";

import { getSessionAccount } from "@/lib/sync/auth";
import { getSnapshot, mergeSnapshot, parseSnapshot } from "@/lib/sync/records";
import { isSyncConfigured } from "@/lib/sync/turso";

export const runtime = "nodejs";

async function accountOrUnauthorized() {
  if (!isSyncConfigured()) return undefined;
  return getSessionAccount();
}

export async function GET() {
  const account = await accountOrUnauthorized();
  if (!account) return NextResponse.json({ error: "Sign in to sync." }, { status: 401 });
  return NextResponse.json(await getSnapshot(account.id));
}

export async function POST(request: Request) {
  const account = await accountOrUnauthorized();
  if (!account) return NextResponse.json({ error: "Sign in to sync." }, { status: 401 });
  const snapshot = parseSnapshot(await request.json().catch(() => undefined));
  if (!snapshot) return NextResponse.json({ error: "Invalid sync data." }, { status: 400 });
  return NextResponse.json(await mergeSnapshot(account.id, snapshot));
}
