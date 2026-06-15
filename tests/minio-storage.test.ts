import assert from "node:assert/strict";
import test from "node:test";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { getMinioConfig, storeProcessedPhoto } from "../src/lib/minio-storage";

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

    const stored = await storeProcessedPhoto({
      originalBuffer,
      originalMimeType: "image/jpeg",
      thumbnailBuffer,
      thumbnailMimeType: "image/webp",
      ownerId: "test-user",
      resolvedYear: 2026,
      fileName: "minio integration.jpg"
    });
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

    const [originalHead, thumbnailHead] = await Promise.all([
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
      )
    ]);

    assert.equal(stored.bucket, config.bucket);
    assert.equal(originalHead.ContentType, "image/jpeg");
    assert.equal(thumbnailHead.ContentType, "image/webp");
    assert.match(stored.originalObjectKey, /^users\/test-user\/years\/2026\//);
    assert.match(stored.thumbnailObjectKey, /\/thumb\/thumbnail\.webp$/);
  }
);
