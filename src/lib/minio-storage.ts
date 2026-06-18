import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import type { ArchivedPhoto } from "./album-archive";
import { isArchivedPhoto, mergeArchivedPhoto } from "./album-archive";

const defaultEndpoint = "http://127.0.0.1:9000";
const defaultRegion = "us-east-1";
const defaultBucket = "annual-photo-album";

let bucketReady = false;

export type StoredPhotoObjects = {
  photoId: string;
  bucket: string;
  originalObjectKey: string;
  thumbnailObjectKey: string;
  displayObjectKey: string;
};

export type StoreProcessedPhotoInput = {
  originalBuffer: Buffer;
  originalMimeType: string;
  thumbnailBuffer: Buffer;
  thumbnailMimeType: string;
  displayBuffer: Buffer;
  displayMimeType: string;
  ownerId: string;
  resolvedYear: number;
  fileName: string;
};

export async function storeProcessedPhoto({
  originalBuffer,
  originalMimeType,
  thumbnailBuffer,
  thumbnailMimeType,
  displayBuffer,
  displayMimeType,
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
  const displayObjectKey = `${baseKey}/display/display.webp`;

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
    ),
    client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: displayObjectKey,
        Body: displayBuffer,
        ContentType: displayMimeType
      })
    )
  ]);

  return {
    photoId,
    bucket: config.bucket,
    originalObjectKey,
    thumbnailObjectKey,
    displayObjectKey
  };
}

export async function readArchivedPhotosFromMinio(ownerId: string) {
  const config = getMinioConfig();
  const client = createMinioClient(config);
  await ensureBucket(client, config.bucket);

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: getArchiveObjectKey(ownerId)
      })
    );
    const text = await readBodyAsText(response.Body);
    const payload = JSON.parse(text);

    return Array.isArray(payload) ? payload.filter(isArchivedPhoto) : [];
  } catch (error) {
    if (isMissingObjectError(error)) {
      return [];
    }

    throw error;
  }
}

export async function upsertArchivedPhotoInMinio(photo: ArchivedPhoto) {
  const config = getMinioConfig();
  const client = createMinioClient(config);
  await ensureBucket(client, config.bucket);

  const current = await readArchivedPhotosFromMinio(photo.ownerId);
  const next = mergeArchivedPhoto(current, photo);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: getArchiveObjectKey(photo.ownerId),
      Body: Buffer.from(JSON.stringify(next), "utf8"),
      ContentType: "application/json; charset=utf-8"
    })
  );

  return next;
}

export async function getObjectFromMinio(key: string) {
  const config = getMinioConfig();
  const client = createMinioClient(config);
  await ensureBucket(client, config.bucket);

  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key
    })
  );

  return {
    body: await readBodyAsBytes(response.Body),
    contentType: response.ContentType ?? "application/octet-stream"
  };
}

export async function getObjectStreamFromMinio(key: string) {
  const config = getMinioConfig();
  const client = createMinioClient(config);
  await ensureBucket(client, config.bucket);

  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key
    })
  );

  return {
    body: response.Body,
    contentLength: response.ContentLength,
    contentType: response.ContentType ?? "application/octet-stream",
    etag: response.ETag
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

function getArchiveObjectKey(ownerId: string) {
  return `users/${sanitizePathPart(ownerId)}/archive/photos.json`;
}

function isMissingObjectError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return (
    candidate.name === "NoSuchKey" ||
    candidate.name === "NotFound" ||
    candidate.$metadata?.httpStatusCode === 404
  );
}

async function readBodyAsText(body: unknown) {
  if (body && typeof body === "object" && "transformToString" in body) {
    const streamBody = body as { transformToString: () => Promise<string> };
    return streamBody.transformToString();
  }

  return Buffer.from(await readBodyAsBytes(body)).toString("utf8");
}

async function readBodyAsBytes(body: unknown): Promise<Uint8Array> {
  if (!body) {
    return new Uint8Array();
  }

  if (body instanceof Uint8Array) {
    return body;
  }

  if (body && typeof body === "object" && "transformToByteArray" in body) {
    const streamBody = body as {
      transformToByteArray: () => Promise<Uint8Array>;
    };
    return streamBody.transformToByteArray();
  }

  if (Symbol.asyncIterator in Object(body)) {
    const chunks: Uint8Array[] = [];

    for await (const chunk of body as AsyncIterable<
      Uint8Array | Buffer | string
    >) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    return Buffer.concat(chunks);
  }

  throw new Error("Unsupported MinIO response body");
}
