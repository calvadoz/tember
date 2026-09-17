import { NextResponse } from "next/server";

import { getSessionAccount } from "@/lib/sync/auth";
import {
  mergeSnapshot,
  migrateLegacyPortraits,
  parseSnapshot,
} from "@/lib/sync/records";
import { isSyncConfigured } from "@/lib/sync/turso";

export const runtime = "nodejs";

async function accountOrUnauthorized() {
  if (!isSyncConfigured()) return undefined;
  return getSessionAccount();
}

export async function GET(request: Request) {
  const account = await accountOrUnauthorized();
  if (!account) return NextResponse.json({ error: "Sign in to sync." }, { status: 401 });
  return NextResponse.json(
    await migrateLegacyPortraits(account.id, new URL(request.url).origin),
  );
}

export async function POST(request: Request) {
  const account = await accountOrUnauthorized();
  if (!account) return NextResponse.json({ error: "Sign in to sync." }, { status: 401 });
  const snapshot = parseSnapshot(await request.json().catch(() => undefined));
  if (!snapshot) return NextResponse.json({ error: "Invalid sync data." }, { status: 400 });
  await mergeSnapshot(account.id, snapshot);
  return NextResponse.json(
    await migrateLegacyPortraits(account.id, new URL(request.url).origin),
  );
}
