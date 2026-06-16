import { NextResponse } from "next/server";
import {
  createShareLinkRecord,
  toPublicShareRecord
} from "@/lib/share-links";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const year = Number(body.year);
    const record = createShareLinkRecord(year);

    return NextResponse.json({
      ...toPublicShareRecord(record),
      managementToken: record.managementToken
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Share link creation failed";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
