import type {
  AlbumYear,
  AlbumYearView,
  CoverAsset,
  Photo,
  StyleProfile,
  User
} from "./album-model";

const owner: User = {
  id: "user_hao",
  displayName: "韩宇浩",
  signatureName: "宇浩",
  createdAt: "2026-06-15T08:00:00.000Z"
};

const photos: Photo[] = [
  {
    id: "photo_2026_001",
    ownerId: owner.id,
    albumYearId: "album_2026",
    source: "upload",
    originalUrl: "/albums/2026/original/spring-sea.jpg",
    thumbnailUrl: "/albums/2026/thumb/spring-sea.jpg",
    fileName: "spring-sea.jpg",
    mimeType: "image/jpeg",
    width: 2400,
    height: 1600,
    orientation: "landscape",
    capturedAt: "2026-04-18T09:30:00.000Z",
    uploadedAt: "2026-06-15T08:10:00.000Z",
    resolvedYear: 2026,
    dominantColor: "#cbd8d5",
    tags: ["旅行", "海边", "明亮"]
  },
  {
    id: "photo_2025_001",
    ownerId: owner.id,
    albumYearId: "album_2025",
    source: "upload",
    originalUrl: "/albums/2025/original/city-walk.jpg",
    thumbnailUrl: "/albums/2025/thumb/city-walk.jpg",
    fileName: "city-walk.jpg",
    mimeType: "image/jpeg",
    width: 1800,
    height: 2400,
    orientation: "portrait",
    capturedAt: "2025-11-02T14:20:00.000Z",
    uploadedAt: "2026-06-15T08:12:00.000Z",
    resolvedYear: 2025,
    dominantColor: "#9a8976",
    tags: ["街拍", "日常", "胶片感"]
  },
  {
    id: "photo_2024_001",
    ownerId: owner.id,
    albumYearId: "album_2024",
    source: "upload",
    originalUrl: "/albums/2024/original/night-window.jpg",
    thumbnailUrl: "/albums/2024/thumb/night-window.jpg",
    fileName: "night-window.jpg",
    mimeType: "image/jpeg",
    width: 2000,
    height: 2000,
    orientation: "square",
    capturedAt: null,
    uploadedAt: "2024-12-28T20:10:00.000Z",
    resolvedYear: 2024,
    dominantColor: "#27232c",
    tags: ["夜景", "低调", "室内"]
  }
];

const styleProfiles: StyleProfile[] = [
  {
    id: "style_2026",
    albumYearId: "album_2026",
    theme: "clear-travel",
    label: "清透旅行",
    dominantColors: ["#cbd8d5", "#f2e7d5", "#47615f"],
    brightness: 0.78,
    saturation: 0.42,
    tags: ["旅行", "海边", "明亮"],
    summary: "明亮、留白较多，适合清透旅行风格。",
    generatedAt: "2026-06-15T08:20:00.000Z"
  },
  {
    id: "style_2025",
    albumYearId: "album_2025",
    theme: "film-daily",
    label: "胶片日常",
    dominantColors: ["#9a8976", "#d5c5ae", "#34302b"],
    brightness: 0.55,
    saturation: 0.36,
    tags: ["街拍", "日常", "胶片感"],
    summary: "中等亮度和低饱和色彩，适合胶片日常风格。",
    generatedAt: "2026-06-15T08:21:00.000Z"
  },
  {
    id: "style_2024",
    albumYearId: "album_2024",
    theme: "lowlight-night",
    label: "低调夜景",
    dominantColors: ["#27232c", "#5e5064", "#c1a16c"],
    brightness: 0.28,
    saturation: 0.31,
    tags: ["夜景", "低调", "室内"],
    summary: "低亮度与深色背景明显，适合低调夜景风格。",
    generatedAt: "2026-06-15T08:22:00.000Z"
  }
];

const coverAssets: CoverAsset[] = [
  {
    id: "cover_2026",
    albumYearId: "album_2026",
    photoId: "photo_2026_001",
    imageUrl: "/albums/2026/cover.jpg",
    signatureText: owner.signatureName,
    theme: "clear-travel",
    generatedAt: "2026-06-15T08:30:00.000Z"
  },
  {
    id: "cover_2025",
    albumYearId: "album_2025",
    photoId: "photo_2025_001",
    imageUrl: "/albums/2025/cover.jpg",
    signatureText: owner.signatureName,
    theme: "film-daily",
    generatedAt: "2026-06-15T08:31:00.000Z"
  },
  {
    id: "cover_2024",
    albumYearId: "album_2024",
    photoId: "photo_2024_001",
    imageUrl: "/albums/2024/cover.jpg",
    signatureText: owner.signatureName,
    theme: "lowlight-night",
    generatedAt: "2026-06-15T08:32:00.000Z"
  }
];

const albumYears: AlbumYear[] = [
  {
    id: "album_2026",
    ownerId: owner.id,
    year: 2026,
    title: "春日与海",
    photoIds: ["photo_2026_001"],
    styleProfileId: "style_2026",
    coverAssetId: "cover_2026",
    createdAt: "2026-06-15T08:20:00.000Z",
    updatedAt: "2026-06-15T08:30:00.000Z"
  },
  {
    id: "album_2025",
    ownerId: owner.id,
    year: 2025,
    title: "城市日常",
    photoIds: ["photo_2025_001"],
    styleProfileId: "style_2025",
    coverAssetId: "cover_2025",
    createdAt: "2026-06-15T08:21:00.000Z",
    updatedAt: "2026-06-15T08:31:00.000Z"
  },
  {
    id: "album_2024",
    ownerId: owner.id,
    year: 2024,
    title: "夜色片段",
    photoIds: ["photo_2024_001"],
    styleProfileId: "style_2024",
    coverAssetId: "cover_2024",
    createdAt: "2026-06-15T08:22:00.000Z",
    updatedAt: "2026-06-15T08:32:00.000Z"
  }
];

export function listAlbumYears(): AlbumYearView[] {
  return albumYears.map((album) => {
    const albumPhotos = photos.filter((photo) =>
      album.photoIds.includes(photo.id)
    );
    const styleProfile = mustFind(
      styleProfiles,
      album.styleProfileId,
      "style profile"
    );
    const coverAsset = mustFind(coverAssets, album.coverAssetId, "cover asset");

    return {
      album,
      owner,
      photos: albumPhotos,
      styleProfile,
      coverAsset
    };
  });
}

export function getAlbumYearByYear(year: number) {
  return listAlbumYears().find((albumYear) => albumYear.album.year === year);
}

export function getOrCreateAlbumYearByYear(year: number): AlbumYearView {
  return getAlbumYearByYear(year) ?? createDraftAlbumYear(year);
}

function createDraftAlbumYear(year: number): AlbumYearView {
  const albumId = `archive_${year}`;

  return {
    album: {
      id: albumId,
      ownerId: owner.id,
      year,
      title: `${year} 年相册`,
      photoIds: [],
      styleProfileId: `style_${albumId}`,
      coverAssetId: `cover_${albumId}`,
      createdAt: "2026-06-15T08:00:00.000Z",
      updatedAt: "2026-06-15T08:00:00.000Z"
    },
    owner,
    photos: [],
    styleProfile: {
      id: `style_${albumId}`,
      albumYearId: albumId,
      theme: "film-daily",
      label: "待分析",
      dominantColors: ["#2f3432", "#d8cfc2", "#15130f"],
      brightness: 0.5,
      saturation: 0.24,
      tags: [],
      summary: "等待上传照片生成相册风格。",
      generatedAt: "2026-06-15T08:00:00.000Z"
    },
    coverAsset: {
      id: `cover_${albumId}`,
      albumYearId: albumId,
      photoId: null,
      imageUrl: "",
      signatureText: owner.signatureName,
      theme: "film-daily",
      generatedAt: "2026-06-15T08:00:00.000Z"
    }
  };
}

function mustFind<T extends { id: string }>(
  items: T[],
  id: string,
  label: string
) {
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    throw new Error(`Missing ${label}: ${id}`);
  }

  return item;
}
