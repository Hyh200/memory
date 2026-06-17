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
      imageUrl: getArchivedPhotoImageUrl(photo),
      signatureText,
      palette
    })),
    ...albumYear.photos.map((photo) => ({
      id: photo.id,
      kind: "photo" as const,
      year: albumYear.album.year,
      title: photo.fileName,
      subtitle: photo.tags.length > 0 ? photo.tags.join(" / ") : "年度照片",
      imageUrl: photo.originalUrl,
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
    ...photoPages
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
  direction: "first" | "previous" | "next" | "last";
  isSinglePage: boolean;
}) {
  if (direction === "first") {
    return 0;
  }

  const lastStartIndex = getLastReaderStartIndex(pageCount, isSinglePage);

  if (direction === "last") {
    return lastStartIndex;
  }

  const step = getReaderStep(isSinglePage);

  if (direction === "previous") {
    return Math.max(0, currentIndex - step);
  }

  return Math.min(lastStartIndex, currentIndex + step);
}

function formatPhotoSubtitle(width: number, height: number) {
  return width > 0 && height > 0 ? `${width}×${height}` : "上传照片";
}

function getArchivedPhotoImageUrl(photo: ArchivedPhoto) {
  return `/api/photos/object?key=${encodeURIComponent(photo.originalObjectKey)}`;
}

function getLastReaderStartIndex(pageCount: number, isSinglePage: boolean) {
  if (isSinglePage || pageCount % 2 !== 0) {
    return Math.max(0, pageCount - 1);
  }

  return Math.max(0, pageCount - 2);
}
