import type { AlbumYearView, PhotoOrientation } from "./album-model";

export const archiveStorageKey = "annual-photo-album.archive.v1";

export type ArchivedPhoto = {
  id: string;
  ownerId: string;
  fileName: string;
  mimeType: string;
  size: number;
  thumbnailUrl: string;
  originalObjectKey: string;
  thumbnailObjectKey: string;
  bucket: string;
  width: number;
  height: number;
  orientation: PhotoOrientation;
  capturedAt: string | null;
  uploadedAt: string;
  resolvedYear: number;
  yearSource: "exif" | "modifiedAt" | "uploadedAt";
};

export type AlbumYearCard = {
  id: string;
  year: number;
  title: string;
  tone: string;
  summary: string;
  photoCount: number;
  uploadedCount: number;
};

export function loadArchivedPhotos(): ArchivedPhoto[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(archiveStorageKey);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isArchivedPhoto) : [];
  } catch {
    return [];
  }
}

export function saveArchivedPhoto(photo: ArchivedPhoto) {
  if (typeof window === "undefined") {
    return;
  }

  const current = loadArchivedPhotos();
  const next = [photo, ...current.filter((item) => item.id !== photo.id)];
  window.localStorage.setItem(archiveStorageKey, JSON.stringify(next));
}

export function createAlbumYearCards(
  seedAlbums: AlbumYearView[],
  archivedPhotos: ArchivedPhoto[]
): AlbumYearCard[] {
  const uploadsByYear = groupArchivedPhotosByYear(archivedPhotos);
  const cards = seedAlbums.map((albumYear) => {
    const uploaded = uploadsByYear.get(albumYear.album.year) ?? [];
    const uploadedCount = uploaded.length;
    const photoCount = albumYear.photos.length + uploadedCount;

    return {
      id: albumYear.album.id,
      year: albumYear.album.year,
      title: albumYear.album.title,
      tone: albumYear.styleProfile.label,
      summary:
        uploadedCount > 0
          ? `${albumYear.styleProfile.summary} 新增 ${uploadedCount} 张上传照片。`
          : albumYear.styleProfile.summary,
      photoCount,
      uploadedCount
    };
  });
  const seededYears = new Set(seedAlbums.map((albumYear) => albumYear.album.year));

  for (const [year, photos] of uploadsByYear) {
    if (seededYears.has(year)) {
      continue;
    }

    cards.push({
      id: `archive_${year}`,
      year,
      title: `${year} 年相册`,
      tone: "待分析",
      summary: `已按照片年份归档 ${photos.length} 张新上传照片。`,
      photoCount: photos.length,
      uploadedCount: photos.length
    });
  }

  return cards.sort((left, right) => right.year - left.year);
}

export function groupArchivedPhotosByYear(photos: ArchivedPhoto[]) {
  const grouped = new Map<number, ArchivedPhoto[]>();

  for (const photo of photos) {
    const current = grouped.get(photo.resolvedYear) ?? [];
    current.push(photo);
    grouped.set(photo.resolvedYear, current);
  }

  return grouped;
}

function isArchivedPhoto(value: unknown): value is ArchivedPhoto {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ArchivedPhoto>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.ownerId === "string" &&
    typeof candidate.fileName === "string" &&
    typeof candidate.resolvedYear === "number" &&
    typeof candidate.uploadedAt === "string" &&
    typeof candidate.thumbnailUrl === "string"
  );
}
