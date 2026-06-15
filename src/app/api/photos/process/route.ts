import { NextResponse } from "next/server";
import { processImageUpload } from "@/lib/image-processing";
import { storeProcessedPhoto } from "@/lib/minio-storage";

export const runtime = "nodejs";

const maxFileSize = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const modifiedAt = formData.get("modifiedAt");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "Image exceeds 20MB" }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processImageUpload({
      buffer,
      mimeType: file.type,
      modifiedAt: typeof modifiedAt === "string" ? modifiedAt : null
    });
    const stored = await storeProcessedPhoto({
      originalBuffer: buffer,
      originalMimeType: file.type,
      thumbnailBuffer: processed.thumbnailBuffer,
      thumbnailMimeType: processed.thumbnailMimeType,
      ownerId: "local-user",
      resolvedYear: processed.resolvedYear,
      fileName: file.name
    });

    return NextResponse.json({
      thumbnailUrl: processed.thumbnailDataUrl,
      thumbnailMimeType: processed.thumbnailMimeType,
      thumbnailWidth: processed.thumbnailWidth,
      thumbnailHeight: processed.thumbnailHeight,
      width: processed.width,
      height: processed.height,
      orientation: processed.orientation,
      capturedAt: processed.capturedAt,
      resolvedYear: processed.resolvedYear,
      yearSource: processed.yearSource,
      bucket: stored.bucket,
      originalObjectKey: stored.originalObjectKey,
      thumbnailObjectKey: stored.thumbnailObjectKey
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image processing failed";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
