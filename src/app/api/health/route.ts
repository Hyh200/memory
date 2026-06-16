import { NextResponse } from "next/server";
import { getDeploymentStatus } from "@/lib/deployment-config";

export const dynamic = "force-dynamic";

export function GET() {
  const status = getDeploymentStatus();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
