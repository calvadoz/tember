import { NextResponse } from "next/server";

import { logoutAccount } from "@/lib/sync/auth";

export const runtime = "nodejs";

export async function POST() {
  await logoutAccount();
  return NextResponse.json({ ok: true });
}
