import assert from "node:assert/strict";
import test from "node:test";
import type { AlbumYearView } from "../src/lib/album-model";
import {
  createAlbumYearCards,
  groupArchivedPhotosByYear,
  type ArchivedPhoto
} from "../src/lib/album-archive";

const archivedPhotos: ArchivedPhoto[] = [
  createArchivedPhoto("photo_a", 2025, "exif"),
  createArchivedPhoto("photo_b", 2025, "modifiedAt"),
  createArchivedPhoto("photo_c", 2023, "uploadedAt")
];

test("groupArchivedPhotosByYear groups uploads by resolved year", () => {
  const grouped = groupArchivedPhotosByYear(archivedPhotos);

  assert.equal(grouped.get(2025)?.length, 2);
  assert.equal(grouped.get(2023)?.length, 1);
});

test("createAlbumYearCards merges seed albums and new uploaded years", () => {
  const cards = createAlbumYearCards([createSeedAlbum(2025)], archivedPhotos);
  const years = cards.map((card) => card.year);
  const existingYear = cards.find((card) => card.year === 2025);
  const newYear = cards.find((card) => card.year === 2023);

  assert.deepEqual(years, [2025, 2023]);
  assert.equal(existingYear?.photoCount, 3);
  assert.equal(existingYear?.uploadedCount, 2);
  assert.equal(existingYear?.signatureText, "宇浩");
  assert.equal(existingYear?.representativePhotoName, "photo_a.jpg");
  assert.deepEqual(existingYear?.dominantColors, ["#111111"]);
  assert.equal(newYear?.photoCount, 1);
  assert.equal(newYear?.tone, "待分析");
  assert.equal(newYear?.signatureText, "宇浩");
  assert.equal(newYear?.representativePhotoName, "photo_c.jpg");
  assert.equal(newYear?.coverImageUrl, "data:image/webp;base64,abc");
  assert.match(newYear?.summary ?? "", /已按照片年份归档 1 张/);
});

function createArchivedPhoto(
  id: string,
  resolvedYear: number,
  yearSource: ArchivedPhoto["yearSource"]
): ArchivedPhoto {
  return {
    id,
    ownerId: "user_hao",
    fileName: `${id}.jpg`,
    mimeType: "image/jpeg",
    size: 1024,
    thumbnailUrl: "data:image/webp;base64,abc",
    originalObjectKey: `users/user_hao/years/${resolvedYear}/${id}/original/${id}.jpg`,
    thumbnailObjectKey: `users/user_hao/years/${resolvedYear}/${id}/thumb/thumbnail.webp`,
    bucket: "annual-photo-album",
    width: 800,
    height: 600,
    orientation: "landscape",
    capturedAt: null,
    uploadedAt: "2026-06-15T09:00:00.000Z",
    resolvedYear,
    yearSource
  };
}

function createSeedAlbum(year: number): AlbumYearView {
  return {
    album: {
      id: `album_${year}`,
      ownerId: "user_hao",
      year,
      title: "既有相册",
      photoIds: ["seed_photo"],
      styleProfileId: "style_seed",
      coverAssetId: "cover_seed",
      createdAt: "2026-06-15T08:00:00.000Z",
      updatedAt: "2026-06-15T08:00:00.000Z"
    },
    owner: {
      id: "user_hao",
      displayName: "韩宇浩",
      signatureName: "宇浩",
      createdAt: "2026-06-15T08:00:00.000Z"
    },
    photos: [
      {
        id: "seed_photo",
        ownerId: "user_hao",
        albumYearId: `album_${year}`,
        source: "upload",
        originalUrl: "/seed.jpg",
        thumbnailUrl: "/seed-thumb.jpg",
        fileName: "seed.jpg",
        mimeType: "image/jpeg",
        width: 800,
        height: 600,
        orientation: "landscape",
        capturedAt: null,
        uploadedAt: "2026-06-15T08:00:00.000Z",
        resolvedYear: year,
        dominantColor: null,
        tags: []
      }
    ],
    styleProfile: {
      id: "style_seed",
      albumYearId: `album_${year}`,
      theme: "film-daily",
      label: "胶片日常",
      dominantColors: ["#111111"],
      brightness: 0.5,
      saturation: 0.4,
      tags: [],
      summary: "既有风格摘要。",
      generatedAt: "2026-06-15T08:00:00.000Z"
    },
    coverAsset: {
      id: "cover_seed",
      albumYearId: `album_${year}`,
      photoId: "seed_photo",
      imageUrl: "/cover.jpg",
      signatureText: "宇浩",
      theme: "film-daily",
      generatedAt: "2026-06-15T08:00:00.000Z"
    }
  };
}
