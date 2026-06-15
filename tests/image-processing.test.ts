import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  parseExifDate,
  processImageUpload,
  resolvePhotoYear
} from "../src/lib/image-processing";

test("processImageUpload creates a display thumbnail and falls back to modified year", async () => {
  const buffer = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: "#d9a441"
    }
  })
    .jpeg()
    .toBuffer();

  const result = await processImageUpload({
    buffer,
    mimeType: "image/jpeg",
    modifiedAt: "2022-03-04T12:00:00.000Z"
  });

  assert.equal(result.thumbnailMimeType, "image/webp");
  assert.ok(Buffer.isBuffer(result.thumbnailBuffer));
  assert.match(result.thumbnailDataUrl, /^data:image\/webp;base64,/);
  assert.equal(result.thumbnailWidth, 360);
  assert.equal(result.thumbnailHeight, 360);
  assert.equal(result.width, 800);
  assert.equal(result.height, 600);
  assert.equal(result.orientation, "landscape");
  assert.equal(result.capturedAt, null);
  assert.equal(result.resolvedYear, 2022);
  assert.equal(result.yearSource, "modifiedAt");
});

test("processImageUpload prefers EXIF DateTimeOriginal year", async () => {
  const buffer = await sharp({
    create: {
      width: 40,
      height: 60,
      channels: 3,
      background: "#335577"
    }
  })
    .jpeg()
    .withExif({
      IFD2: {
        DateTimeOriginal: "2020:05:04 10:11:12"
      }
    })
    .toBuffer();

  const result = await processImageUpload({
    buffer,
    mimeType: "image/jpeg",
    modifiedAt: "2024-01-01T00:00:00.000Z"
  });

  assert.equal(result.resolvedYear, 2020);
  assert.equal(result.yearSource, "exif");
  assert.equal(result.orientation, "portrait");
  assert.ok(result.capturedAt?.startsWith("2020-"));
});

test("resolvePhotoYear falls back to upload year when metadata is absent", () => {
  const result = resolvePhotoYear({
    capturedAt: null,
    modifiedAt: null,
    uploadedAt: new Date("2026-06-15T08:00:00.000Z")
  });

  assert.deepEqual(result, { year: 2026, source: "uploadedAt" });
});

test("parseExifDate accepts EXIF date strings", () => {
  assert.equal(
    parseExifDate("2021:12:31 23:59:58"),
    "2021-12-31T23:59:58.000Z"
  );
});
