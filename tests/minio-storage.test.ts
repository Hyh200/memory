import assert from "node:assert/strict";
import test from "node:test";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import {
  getMinioConfig,
  readArchivedPhotosFromMinio,
  storeProcessedPhoto,
  upsertArchivedPhotoInMinio
} from "../src/lib/minio-storage";

const hasMinioCredentials =
  Boolean(process.env.MINIO_ACCESS_KEY) && Boolean(process.env.MINIO_SECRET_KEY);

test(
  "storeProcessedPhoto writes original and thumbnail objects to MinIO",
  { skip: !hasMinioCredentials },
  async () => {
    const originalBuffer = await sharp({
      create: {
        width: 32,
        height: 24,
        channels: 3,
        background: "#446688"
      }
    })
      .jpeg()
      .toBuffer();
    const thumbnailBuffer = await sharp(originalBuffer)
      .resize({ width: 16, height: 16, fit: "cover" })
      .webp()
      .toBuffer();
    const displayBuffer = await sharp(originalBuffer)
      .resize({ width: 24, height: 24, fit: "inside" })
      .webp()
      .toBuffer();

    const stored = await storeProcessedPhoto({
      originalBuffer,
      originalMimeType: "image/jpeg",
      thumbnailBuffer,
      thumbnailMimeType: "image/webp",
      displayBuffer,
      displayMimeType: "image/webp",
      ownerId: "test-user",
      resolvedYear: 2026,
      fileName: "minio integration.jpg"
    });
    const archivedPhoto = {
      id: stored.photoId,
      ownerId: "test-user",
      fileName: "minio integration.jpg",
      mimeType: "image/jpeg",
      size: originalBuffer.length,
      thumbnailUrl: "data:image/webp;base64,test",
      originalObjectKey: stored.originalObjectKey,
      thumbnailObjectKey: stored.thumbnailObjectKey,
      displayObjectKey: stored.displayObjectKey,
      bucket: stored.bucket,
      width: 32,
      height: 24,
      displayWidth: 24,
      displayHeight: 18,
      orientation: "landscape" as const,
      capturedAt: null,
      uploadedAt: "2026-06-16T00:00:00.000Z",
      resolvedYear: 2026,
      yearSource: "uploadedAt" as const
    };
    await upsertArchivedPhotoInMinio(archivedPhoto);
    const archive = await readArchivedPhotosFromMinio("test-user");
    const config = getMinioConfig();
    const client = new S3Client({
      endpoint: config.endpoint,
      forcePathStyle: true,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });

    const [originalHead, thumbnailHead, displayHead] = await Promise.all([
      client.send(
        new HeadObjectCommand({
          Bucket: stored.bucket,
          Key: stored.originalObjectKey
        })
      ),
      client.send(
        new HeadObjectCommand({
          Bucket: stored.bucket,
          Key: stored.thumbnailObjectKey
        })
      ),
      client.send(
        new HeadObjectCommand({
          Bucket: stored.bucket,
          Key: stored.displayObjectKey
        })
      )
    ]);

    assert.equal(stored.bucket, config.bucket);
    assert.match(stored.photoId, /^[0-9a-f-]{36}$/);
    assert.equal(originalHead.ContentType, "image/jpeg");
    assert.equal(thumbnailHead.ContentType, "image/webp");
    assert.equal(displayHead.ContentType, "image/webp");
    assert.match(stored.originalObjectKey, /^users\/test-user\/years\/2026\//);
    assert.match(stored.thumbnailObjectKey, /\/thumb\/thumbnail\.webp$/);
    assert.match(stored.displayObjectKey, /\/display\/display\.webp$/);
    assert.ok(archive.some((photo) => photo.id === stored.photoId));
  }
);
