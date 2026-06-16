import { NextResponse } from "next/server";
import { readArchivedPhotosFromMinio } from "@/lib/minio-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultOwnerId = "user_xie";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId") || defaultOwnerId;

  try {
    const photos = await readArchivedPhotosFromMinio(ownerId);
    return NextResponse.json({ photos });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load photo archive";

    return NextResponse.json({ error: message, photos: [] }, { status: 503 });
  }
}
