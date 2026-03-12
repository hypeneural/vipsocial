import { apiClient } from '@/services/api';
import type { Gallery, GalleryBanner, GalleryDiscoveryResponse, GallerySummary, PaginatedResponse, PhotoItem } from '@/types/gallery';

interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total_active?: number;
    auto_open_slug?: string | null;
    next_cursor?: string | null;
    has_more?: boolean;
  };
  next_cursor?: string | null;
  has_more?: boolean;
}

interface ApiGallerySummary {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  cover_image_url?: string | null;
  total_photos: number;
  event_date?: string | null;
  last_published_at?: string | null;
  public_url?: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  is_active: boolean;
}

interface ApiGalleryDetail {
  id: number;
  slug: string;
  title: string;
  gallery_title: string;
  subtitle?: string | null;
  cover_image_url?: string | null;
  total_photos: number;
  status: 'draft' | 'active' | 'paused' | 'archived';
  configured_status: 'draft' | 'active' | 'paused' | 'archived';
  is_active: boolean;
  has_visible_photos: boolean;
  public_url?: string | null;
  stats: {
    total_photos: number;
    total_downloads: number;
    views_count: number;
  };
  banners?: ApiGalleryBanner[];
}

interface ApiGalleryBanner {
  id: number;
  image_url: string;
  link_url?: string | null;
  alt_text?: string | null;
  sort_order: number;
}

interface ApiGalleryPhoto {
  id: number;
  sequence: number;
  image_url: string;
  thumb_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  download_url?: string | null;
  is_processed: boolean;
  width: number;
  height: number;
  sender_name?: string | null;
  author_name?: string | null;
  caption?: string | null;
  published_at?: string | null;
}

function orientationFromDimensions(width: number, height: number): 'portrait' | 'landscape' | 'square' {
  if (width === height) {
    return 'square';
  }

  return width > height ? 'landscape' : 'portrait';
}

function mapGallerySummary(item: ApiGallerySummary): GallerySummary {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle || undefined,
    coverImageUrl: item.cover_image_url || null,
    totalPhotos: item.total_photos,
    eventDate: item.event_date || null,
    lastPublishedAt: item.last_published_at || null,
    publicUrl: item.public_url || null,
    status: item.status,
    isActive: item.is_active,
  };
}

function mapGallery(detail: ApiGalleryDetail): Gallery {
  return {
    id: detail.id,
    slug: detail.slug,
    title: detail.title || detail.gallery_title,
    subtitle: detail.subtitle || undefined,
    coverImageUrl: detail.cover_image_url || null,
    totalPhotos: detail.stats.total_photos ?? detail.total_photos,
    status: detail.status,
    configuredStatus: detail.configured_status,
    isLive: detail.is_active,
    hasVisiblePhotos: detail.has_visible_photos,
    publicUrl: detail.public_url || null,
    banners: (detail.banners || []).map(mapBanner),
  };
}

function mapBanner(item: ApiGalleryBanner): GalleryBanner {
  return {
    id: item.id,
    imageUrl: item.image_url,
    linkUrl: item.link_url || null,
    altText: item.alt_text || null,
    sortOrder: item.sort_order,
  };
}

function mapPhoto(item: ApiGalleryPhoto, gallerySlug: string): PhotoItem {
  const imageUrl = item.image_url;
  const width = item.width || 1;
  const height = item.height || 1;

  return {
    id: String(item.id),
    galleryId: gallerySlug,
    status: item.is_processed ? 'published' : 'published',
    sequence: item.sequence || item.id,
    caption: item.caption || undefined,
    width,
    height,
    aspectRatio: width / height,
    thumbUrl: item.thumb_url || imageUrl,
    mediumUrl: item.medium_url || imageUrl,
    largeUrl: item.large_url || imageUrl,
    originalUrl: item.download_url || imageUrl,
    takenAt: item.published_at || new Date().toISOString(),
    createdAt: item.published_at || new Date().toISOString(),
    authorName: item.author_name || item.sender_name || undefined,
    isHighlight: false,
    orientation: orientationFromDimensions(width, height),
  };
}

export async function getActiveGalleries(): Promise<GalleryDiscoveryResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<ApiGallerySummary[]>>('/gallery');

  return {
    galleries: (data.data || []).map(mapGallerySummary),
    totalActive: data.meta?.total_active ?? data.data.length,
    autoOpenSlug: data.meta?.auto_open_slug ?? null,
  };
}

export async function getGallery(slug: string): Promise<Gallery> {
  const { data } = await apiClient.get<ApiSuccessResponse<ApiGalleryDetail>>(`/gallery/${slug}`);
  return mapGallery(data.data);
}

export async function getGalleryItems(slug: string, cursor?: string | null): Promise<PaginatedResponse<PhotoItem>> {
  const { data } = await apiClient.get<ApiSuccessResponse<ApiGalleryPhoto[]>>(`/gallery/${slug}/photos`, {
    params: {
      cursor: cursor || undefined,
      limit: 30,
    },
  });

  return {
    data: (data.data || []).map((item) => mapPhoto(item, slug)),
    nextCursor: data.next_cursor ?? data.meta?.next_cursor ?? null,
    hasMore: data.has_more ?? data.meta?.has_more ?? false,
  };
}

export async function trackGalleryView(slug: string): Promise<void> {
  await apiClient.post('/gallery/track/view', {
    identifier: slug,
  });
}

export async function trackPhotoDownload(photoId: string): Promise<void> {
  await apiClient.post(`/gallery/photos/${photoId}/download`);
}
