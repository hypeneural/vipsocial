export type GalleryStatus = 'draft' | 'active' | 'paused' | 'archived';
export type MediaStatus = 'published' | 'processing' | 'failed';
export type Orientation = 'portrait' | 'landscape' | 'square';

export interface GallerySummary {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  coverImageUrl: string | null;
  totalPhotos: number;
  eventDate?: string | null;
  lastPublishedAt?: string | null;
  publicUrl?: string | null;
  status: GalleryStatus;
  isActive: boolean;
}

export interface Gallery {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  coverImageUrl: string | null;
  totalPhotos: number;
  status: GalleryStatus;
  configuredStatus: GalleryStatus;
  isLive: boolean;
  hasVisiblePhotos: boolean;
  publicUrl?: string | null;
  banners: GalleryBanner[];
}

export interface GalleryBanner {
  id: number;
  imageUrl: string;
  linkUrl?: string | null;
  altText?: string | null;
  sortOrder: number;
}

export interface PhotoItem {
  id: string;
  galleryId: string;
  status: MediaStatus;
  sequence: number;
  caption?: string;
  width: number;
  height: number;
  aspectRatio: number;
  thumbUrl: string;
  mediumUrl: string;
  largeUrl: string;
  originalUrl: string;
  takenAt: string;
  createdAt: string;
  authorName?: string;
  isHighlight: boolean;
  orientation: Orientation;
}

export interface GalleryDiscoveryResponse {
  galleries: GallerySummary[];
  totalActive: number;
  autoOpenSlug?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string | null;
  hasMore: boolean;
}
