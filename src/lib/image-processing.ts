import * as exifr from "exifr";
import sharp from "sharp";
import type { PhotoOrientation } from "./album-model";
import { analyzeImageStyle, type StyleAnalysis } from "./style-analysis";

const acceptedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const thumbnailSize = 360;
const displayMaxSize = 2048;

export type YearSource = "exif" | "modifiedAt" | "uploadedAt";

export type ProcessImageInput = {
  buffer: Buffer;
  mimeType: string;
  modifiedAt?: string | number | null;
  uploadedAt?: Date;
};

export type ProcessedImage = {
  thumbnailBuffer: Buffer;
  thumbnailDataUrl: string;
  thumbnailMimeType: "image/webp";
  thumbnailWidth: number;
  thumbnailHeight: number;
  displayBuffer: Buffer;
  displayMimeType: "image/webp";
  displayWidth: number;
  displayHeight: number;
  width: number;
  height: number;
  orientation: PhotoOrientation;
  capturedAt: string | null;
  resolvedYear: number;
  yearSource: YearSource;
  styleAnalysis: StyleAnalysis;
};

export async function processImageUpload({
  buffer,
  mimeType,
  modifiedAt,
  uploadedAt = new Date()
}: ProcessImageInput): Promise<ProcessedImage> {
  if (!acceptedMimeTypes.has(mimeType)) {
    throw new Error("Unsupported image format");
  }

  const metadata = await sharp(buffer).metadata();
  const dimensions = getDisplayDimensions(
    metadata.width,
    metadata.height,
    metadata.orientation
  );
  const capturedAt = await extractCapturedAt(buffer);
  const resolvedYear = resolvePhotoYear({ capturedAt, modifiedAt, uploadedAt });
  const styleAnalysis = await analyzeImageStyle(buffer);

  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({
      width: thumbnailSize,
      height: thumbnailSize,
      fit: "cover",
      withoutEnlargement: true
    })
    .webp({ quality: 78 })
    .toBuffer({ resolveWithObject: true });
  const { data: displayBuffer, info: displayInfo } = await sharp(buffer)
    .rotate()
    .resize({
      width: displayMaxSize,
      height: displayMaxSize,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return {
    thumbnailBuffer: data,
    thumbnailDataUrl: `data:image/webp;base64,${data.toString("base64")}`,
    thumbnailMimeType: "image/webp",
    thumbnailWidth: info.width,
    thumbnailHeight: info.height,
    displayBuffer,
    displayMimeType: "image/webp",
    displayWidth: displayInfo.width,
    displayHeight: displayInfo.height,
    width: dimensions.width,
    height: dimensions.height,
    orientation: getOrientation(dimensions.width, dimensions.height),
    capturedAt,
    resolvedYear: resolvedYear.year,
    yearSource: resolvedYear.source,
    styleAnalysis
  };
}

export async function extractCapturedAt(buffer: Buffer) {
  try {
    const exif = await exifr.parse(buffer, [
      "DateTimeOriginal",
      "CreateDate",
      "ModifyDate"
    ]);
    const value =
      exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate ?? null;

    return parseExifDate(value);
  } catch {
    return null;
  }
}

export function parseExifDate(value: unknown) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
  );

  if (!match) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  }

  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    )
  ).toISOString();
}

export function resolvePhotoYear({
  capturedAt,
  modifiedAt,
  uploadedAt = new Date()
}: {
  capturedAt?: string | null;
  modifiedAt?: string | number | null;
  uploadedAt?: Date;
}) {
  const capturedDate = parseDate(capturedAt);

  if (capturedDate) {
    return { year: capturedDate.getUTCFullYear(), source: "exif" as const };
  }

  const modifiedDate = parseDate(modifiedAt);

  if (modifiedDate) {
    return {
      year: modifiedDate.getUTCFullYear(),
      source: "modifiedAt" as const
    };
  }

  return { year: uploadedAt.getUTCFullYear(), source: "uploadedAt" as const };
}

function parseDate(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function getDisplayDimensions(
  width: number | undefined,
  height: number | undefined,
  orientation: number | undefined
): { width: number; height: number } {
  const safeWidth = width ?? 0;
  const safeHeight = height ?? 0;

  if (orientation && [5, 6, 7, 8].includes(orientation)) {
    return { width: safeHeight, height: safeWidth };
  }

  return { width: safeWidth, height: safeHeight };
}

function getOrientation(width: number, height: number): PhotoOrientation {
  if (width === height) {
    return "square";
  }

  return width > height ? "landscape" : "portrait";
}
