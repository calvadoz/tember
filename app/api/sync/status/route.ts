import { NextResponse } from "next/server";

import { accountCount, getSessionAccount } from "@/lib/sync/auth";
import { isSyncConfigured } from "@/lib/sync/turso";
import type { SyncStatus } from "@/lib/sync/types";

export const runtime = "nodejs";

export async function GET() {
  if (!isSyncConfigured()) {
    return NextResponse.json<SyncStatus>({
      configured: false,
      authenticated: false,
      bootstrapNeeded: false,
    });
  }
  try {
    const [count, account] = await Promise.all([accountCount(), getSessionAccount()]);
    return NextResponse.json<SyncStatus>({
      configured: true,
      authenticated: Boolean(account),
      bootstrapNeeded: count === 0,
      username: account?.username,
    });
  } catch {
    return NextResponse.json<SyncStatus>({
      configured: false,
      authenticated: false,
      bootstrapNeeded: false,
    });
  }
}
