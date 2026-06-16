import assert from "node:assert/strict";
import test from "node:test";
import {
  createReaderPages,
  getNextReaderIndex,
  getReaderStep
} from "../src/lib/album-reader";
import type { AlbumYearView } from "../src/lib/album-model";
import type { ArchivedPhoto } from "../src/lib/album-archive";

test("createReaderPages builds cover, uploaded photos, and seed photos", () => {
  const pages = createReaderPages(createSeedAlbum(2026), [
    createArchivedPhoto("uploaded_a", 2026)
  ]);

  assert.equal(pages.length, 3);
  assert.equal(pages[0].kind, "cover");
  assert.equal(pages[1].id, "archive_uploaded_a");
  assert.equal(pages[2].id, "seed_photo");
  assert.equal(pages[0].signatureText, "宇浩");
});

test("reader navigation uses single-page and double-page steps", () => {
  assert.equal(getReaderStep(true), 1);
  assert.equal(getReaderStep(false), 2);
  assert.equal(
    getNextReaderIndex({
      currentIndex: 0,
      pageCount: 5,
      direction: "next",
      isSinglePage: false
    }),
    2
  );
  assert.equal(
    getNextReaderIndex({
      currentIndex: 2,
      pageCount: 5,
      direction: "previous",
      isSinglePage: true
    }),
    1
  );
  assert.equal(
    getNextReaderIndex({
      currentIndex: 4,
      pageCount: 5,
      direction: "next",
      isSinglePage: false
    }),
    4
  );
  assert.equal(
    getNextReaderIndex({
      currentIndex: 2,
      pageCount: 4,
      direction: "next",
      isSinglePage: false
    }),
    2
  );
  assert.equal(
    getNextReaderIndex({
      currentIndex: 3,
      pageCount: 5,
      direction: "first",
      isSinglePage: false
    }),
    0
  );
});

function createArchivedPhoto(id: string, resolvedYear: number): ArchivedPhoto {
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
    yearSource: "uploadedAt"
  };
}

function createSeedAlbum(year: number): AlbumYearView {
  return {
    album: {
      id: `album_${year}`,
      ownerId: "user_hao",
      year,
      title: "春日与海",
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
        tags: ["海边"]
      }
    ],
    styleProfile: {
      id: "style_seed",
      albumYearId: `album_${year}`,
      theme: "clear-travel",
      label: "清透旅行",
      dominantColors: ["#cbd8d5", "#f2e7d5", "#47615f"],
      brightness: 0.78,
      saturation: 0.42,
      tags: ["旅行"],
      summary: "明亮、留白较多，适合清透旅行风格。",
      generatedAt: "2026-06-15T08:00:00.000Z"
    },
    coverAsset: {
      id: "cover_seed",
      albumYearId: `album_${year}`,
      photoId: "seed_photo",
      imageUrl: "/cover.jpg",
      signatureText: "宇浩",
      theme: "clear-travel",
      generatedAt: "2026-06-15T08:00:00.000Z"
    }
  };
}
