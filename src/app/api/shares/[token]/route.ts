import { NextResponse } from "next/server";
import {
  getActiveShareRecord,
  revokeShareRecord,
  toPublicShareRecord
} from "@/lib/share-links";

export const runtime = "nodejs";

type ShareTokenRouteProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: Request, { params }: ShareTokenRouteProps) {
  const { token } = await params;
  const record = getActiveShareRecord(token);

  if (!record) {
    return NextResponse.json({ error: "Share link unavailable" }, { status: 404 });
  }

  return NextResponse.json(toPublicShareRecord(record));
}

export async function DELETE(
  request: Request,
  { params }: ShareTokenRouteProps
) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const managementToken =
    typeof body.managementToken === "string" ? body.managementToken : "";
  const record = revokeShareRecord({ token, managementToken });

  if (!record) {
    return NextResponse.json({ error: "Share link unavailable" }, { status: 403 });
  }

  return NextResponse.json(toPublicShareRecord(record));
}
