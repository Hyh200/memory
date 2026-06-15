export type ID = string;

export type AlbumTheme =
  | "clear-travel"
  | "film-daily"
  | "lowlight-night"
  | "bright-portrait"
  | "natural-landscape";

export type PhotoOrientation = "landscape" | "portrait" | "square";

export type PhotoSource = "upload" | "import";

export type User = {
  id: ID;
  displayName: string;
  signatureName: string;
  createdAt: string;
};

export type Photo = {
  id: ID;
  ownerId: ID;
  albumYearId: ID;
  source: PhotoSource;
  originalUrl: string;
  thumbnailUrl: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  orientation: PhotoOrientation;
  capturedAt: string | null;
  uploadedAt: string;
  resolvedYear: number;
  dominantColor: string | null;
  tags: string[];
};

export type StyleProfile = {
  id: ID;
  albumYearId: ID;
  theme: AlbumTheme;
  label: string;
  dominantColors: string[];
  brightness: number;
  saturation: number;
  tags: string[];
  summary: string;
  generatedAt: string;
};

export type CoverAsset = {
  id: ID;
  albumYearId: ID;
  photoId: ID | null;
  imageUrl: string;
  signatureText: string;
  theme: AlbumTheme;
  generatedAt: string;
};

export type AlbumYear = {
  id: ID;
  ownerId: ID;
  year: number;
  title: string;
  photoIds: ID[];
  styleProfileId: ID;
  coverAssetId: ID;
  createdAt: string;
  updatedAt: string;
};

export type AlbumYearView = {
  album: AlbumYear;
  owner: User;
  photos: Photo[];
  styleProfile: StyleProfile;
  coverAsset: CoverAsset;
};

export function getPhotoCount(album: AlbumYearView) {
  return album.photos.length;
}
