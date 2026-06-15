import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const defaultEndpoint = "http://127.0.0.1:9000";
const defaultRegion = "us-east-1";
const defaultBucket = "annual-photo-album";

let bucketReady = false;

export type StoredPhotoObjects = {
  bucket: string;
  originalObjectKey: string;
  thumbnailObjectKey: string;
};

export type StoreProcessedPhotoInput = {
  originalBuffer: Buffer;
  originalMimeType: string;
  thumbnailBuffer: Buffer;
  thumbnailMimeType: string;
  ownerId: string;
  resolvedYear: number;
  fileName: string;
};

export async function storeProcessedPhoto({
  originalBuffer,
  originalMimeType,
  thumbnailBuffer,
  thumbnailMimeType,
  ownerId,
  resolvedYear,
  fileName
}: StoreProcessedPhotoInput): Promise<StoredPhotoObjects> {
  const config = getMinioConfig();
  const client = createMinioClient(config);
  await ensureBucket(client, config.bucket);

  const photoId = randomUUID();
  const baseKey = [
    "users",
    sanitizePathPart(ownerId),
    "years",
    String(resolvedYear),
    photoId
  ].join("/");
  const originalObjectKey = `${baseKey}/original/${sanitizeFileName(fileName)}`;
  const thumbnailObjectKey = `${baseKey}/thumb/thumbnail.webp`;

  await Promise.all([
    client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: originalObjectKey,
        Body: originalBuffer,
        ContentType: originalMimeType
      })
    ),
    client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: thumbnailObjectKey,
        Body: thumbnailBuffer,
        ContentType: thumbnailMimeType
      })
    )
  ]);

  return {
    bucket: config.bucket,
    originalObjectKey,
    thumbnailObjectKey
  };
}

export function getMinioConfig() {
  const accessKeyId = process.env.MINIO_ACCESS_KEY;
  const secretAccessKey = process.env.MINIO_SECRET_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing MinIO credentials");
  }

  return {
    endpoint: process.env.MINIO_ENDPOINT ?? defaultEndpoint,
    region: process.env.MINIO_REGION ?? defaultRegion,
    bucket: process.env.MINIO_BUCKET ?? defaultBucket,
    accessKeyId,
    secretAccessKey
  };
}

function createMinioClient(config: ReturnType<typeof getMinioConfig>) {
  return new S3Client({
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
}

async function ensureBucket(client: S3Client, bucket: string) {
  if (bucketReady) {
    return;
  }

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }

  bucketReady = true;
}

function sanitizePathPart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function sanitizeFileName(value: string) {
  const normalized = value.replace(/\\/g, "/").split("/").pop() ?? "photo";
  return normalized.replace(/[^a-zA-Z0-9._-]/g, "-");
}
