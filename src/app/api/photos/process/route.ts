import { NextResponse } from "next/server";
import { processImageUpload } from "@/lib/image-processing";
import {
  storeProcessedPhoto,
  upsertArchivedPhotoInMinio
} from "@/lib/minio-storage";

export const runtime = "nodejs";

const maxFileSize = 20 * 1024 * 1024;
const defaultOwnerId = "user_xie";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const modifiedAt = formData.get("modifiedAt");
  const ownerId = formData.get("ownerId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "Image exceeds 20MB" }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadedAt = new Date();
    const resolvedOwnerId =
      typeof ownerId === "string" && ownerId ? ownerId : defaultOwnerId;
    const processed = await processImageUpload({
      buffer,
      mimeType: file.type,
      modifiedAt: typeof modifiedAt === "string" ? modifiedAt : null,
      uploadedAt
    });
    const stored = await storeProcessedPhoto({
      originalBuffer: buffer,
      originalMimeType: file.type,
      thumbnailBuffer: processed.thumbnailBuffer,
      thumbnailMimeType: processed.thumbnailMimeType,
      displayBuffer: processed.displayBuffer,
      displayMimeType: processed.displayMimeType,
      ownerId: resolvedOwnerId,
      resolvedYear: processed.resolvedYear,
      fileName: file.name
    });
    const archivedPhoto = {
      id: stored.photoId,
      ownerId: resolvedOwnerId,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      thumbnailUrl: processed.thumbnailDataUrl,
      originalObjectKey: stored.originalObjectKey,
      thumbnailObjectKey: stored.thumbnailObjectKey,
      displayObjectKey: stored.displayObjectKey,
      bucket: stored.bucket,
      width: processed.width,
      height: processed.height,
      displayWidth: processed.displayWidth,
      displayHeight: processed.displayHeight,
      orientation: processed.orientation,
      capturedAt: processed.capturedAt,
      uploadedAt: uploadedAt.toISOString(),
      resolvedYear: processed.resolvedYear,
      yearSource: processed.yearSource,
      styleAnalysis: processed.styleAnalysis
    };

    await upsertArchivedPhotoInMinio(archivedPhoto);

    return NextResponse.json({
      ...archivedPhoto,
      thumbnailUrl: processed.thumbnailDataUrl,
      thumbnailMimeType: processed.thumbnailMimeType,
      thumbnailWidth: processed.thumbnailWidth,
      thumbnailHeight: processed.thumbnailHeight
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image processing failed";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
