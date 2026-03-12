import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getActiveGalleries, getGallery, getGalleryItems } from '@/services/gallery';
import { queryKeys } from './keys';

export function useGalleryDiscovery() {
  return useQuery({
    queryKey: queryKeys.gallery.discovery,
    queryFn: getActiveGalleries,
    staleTime: 10 * 1000,
    refetchInterval: 20 * 1000,
  });
}

export function useGallery(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.gallery.detail(slug ?? ''),
    queryFn: () => getGallery(slug!),
    enabled: !!slug,
    staleTime: 10 * 1000,
    refetchInterval: 20 * 1000,
  });
}

export function useGalleryItems(slug: string | undefined) {
  return useInfiniteQuery({
    queryKey: queryKeys.gallery.items(slug ?? ''),
    queryFn: ({ pageParam = null }) => getGalleryItems(slug!, pageParam),
    enabled: !!slug,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: null as string | null,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  });
}
