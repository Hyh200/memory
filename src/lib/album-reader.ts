import type { AlbumYearView } from "./album-model";
import type { ArchivedPhoto } from "./album-archive";

export type ReaderPage = {
  id: string;
  kind: "cover" | "photo" | "closing";
  year: number;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  signatureText: string;
  palette: string[];
};

export function createReaderPages(
  albumYear: AlbumYearView,
  archivedPhotos: ArchivedPhoto[]
): ReaderPage[] {
  const uploaded = archivedPhotos.filter(
    (photo) => photo.resolvedYear === albumYear.album.year
  );
  const palette = albumYear.styleProfile.dominantColors;
  const signatureText = albumYear.coverAsset.signatureText;
  const photoPages = [
    ...uploaded.map((photo) => ({
      id: `archive_${photo.id}`,
      kind: "photo" as const,
      year: albumYear.album.year,
      title: photo.fileName,
      subtitle: formatPhotoSubtitle(photo.width, photo.height),
      imageUrl: photo.thumbnailUrl,
      signatureText,
      palette
    })),
    ...albumYear.photos.map((photo) => ({
      id: photo.id,
      kind: "photo" as const,
      year: albumYear.album.year,
      title: photo.fileName,
      subtitle: photo.tags.length > 0 ? photo.tags.join(" / ") : "年度照片",
      imageUrl: photo.thumbnailUrl,
      signatureText,
      palette
    }))
  ];

  return [
    {
      id: `${albumYear.album.id}_cover`,
      kind: "cover",
      year: albumYear.album.year,
      title: albumYear.album.title,
      subtitle: albumYear.styleProfile.summary,
      imageUrl: albumYear.coverAsset.imageUrl,
      signatureText,
      palette
    },
    ...photoPages,
    {
      id: `${albumYear.album.id}_closing`,
      kind: "closing",
      year: albumYear.album.year,
      title: "本册完",
      subtitle: `${albumYear.album.year} · ${photoPages.length} 张照片`,
      imageUrl: null,
      signatureText,
      palette
    }
  ];
}

export function getReaderStep(isSinglePage: boolean) {
  return isSinglePage ? 1 : 2;
}

export function getNextReaderIndex({
  currentIndex,
  pageCount,
  direction,
  isSinglePage
}: {
  currentIndex: number;
  pageCount: number;
  direction: "first" | "previous" | "next";
  isSinglePage: boolean;
}) {
  if (direction === "first") {
    return 0;
  }

  const step = getReaderStep(isSinglePage);

  if (direction === "previous") {
    return Math.max(0, currentIndex - step);
  }

  const lastStartIndex = getLastReaderStartIndex(pageCount, isSinglePage);
  return Math.min(lastStartIndex, currentIndex + step);
}

function formatPhotoSubtitle(width: number, height: number) {
  return width > 0 && height > 0 ? `${width}×${height}` : "上传照片";
}

function getLastReaderStartIndex(pageCount: number, isSinglePage: boolean) {
  if (isSinglePage || pageCount % 2 !== 0) {
    return Math.max(0, pageCount - 1);
  }

  return Math.max(0, pageCount - 2);
}
