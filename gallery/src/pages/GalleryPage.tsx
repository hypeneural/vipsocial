import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GalleryStatsBar } from '@/components/GalleryStatsBar';
import { GalleryTopBanners } from '@/components/GalleryTopBanners';
import { MasonryGrid } from '@/components/MasonryGrid';
import { PullToRefresh } from '@/components/PullToRefresh';
import { SkeletonGrid } from '@/components/SkeletonGrid';
import { trackGalleryView } from '@/services/gallery';
import { useGallery, useGalleryDiscovery, useGalleryItems } from '@/queries/gallery';
import type { PhotoItem } from '@/types/gallery';

const PhotoViewer = lazy(() =>
  import('@/components/PhotoViewer').then((module) => ({ default: module.PhotoViewer }))
);

const GalleryPage = () => {
  const { slug } = useParams();
  const { data: discovery } = useGalleryDiscovery();
  const { data: gallery, isLoading: isGalleryLoading, isError: isGalleryError, refetch: refetchGallery } = useGallery(slug);
  const {
    data,
    isLoading: isPhotosLoading,
    isError: isPhotosError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchPhotos,
  } = useGalleryItems(slug);

  const [selectedPhoto, setSelectedPhoto] = useState<{ photo: PhotoItem; index: number } | null>(null);
  const [columns, setColumns] = useState(2);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const allPhotos = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const hasMultipleChoices = (discovery?.totalActive || 0) > 1;

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setColumns(4);
      } else if (width >= 768) {
        setColumns(3);
      } else {
        setColumns(2);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '360px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (!slug || !gallery) {
      return;
    }

    const storageKey = `vip-gallery:view:${slug}`;

    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    trackGalleryView(slug)
      .then(() => window.sessionStorage.setItem(storageKey, '1'))
      .catch(() => {
        // keep UX resilient even if tracking fails
      });
  }, [gallery, slug]);

  const handlePhotoClick = useCallback(
    (photo: PhotoItem) => {
      const index = allPhotos.findIndex((item) => item.id === photo.id);
      setSelectedPhoto({ photo, index });
    },
    [allPhotos]
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchGallery(), refetchPhotos()]);
  }, [refetchGallery, refetchPhotos]);

  const isLoading = isGalleryLoading || isPhotosLoading;
  const isError = isGalleryError || isPhotosError;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={gallery?.title || 'Cobertura VIP'}
        subtitle={gallery?.subtitle || 'Galeria mobile-first ao vivo'}
        backTo={hasMultipleChoices ? '/' : undefined}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        {gallery && (
          <div>
            <GalleryTopBanners banners={gallery.banners} />
            <div className="mx-auto max-w-3xl">
            <GalleryStatsBar
              totalPhotos={gallery.totalPhotos}
              isLive={gallery.isLive}
            />
            </div>
          </div>
        )}

        {isLoading && <SkeletonGrid />}

        {isError && (
          <ErrorState
            title="Nao foi possivel abrir esta galeria"
            description="Falha ao carregar os dados publicos da cobertura."
            onRetry={() => handleRefresh()}
          />
        )}

        {!isLoading && !isError && gallery && !gallery.hasVisiblePhotos && (
          <EmptyState
            title="Galeria temporariamente indisponivel"
            description="Esta cobertura ainda nao tem fotos publicadas ou esta pausada no momento."
          />
        )}

        {!isLoading && !isError && gallery?.hasVisiblePhotos && allPhotos.length === 0 && (
          <EmptyState
            title="Aguardando novas fotos"
            description="As imagens publicadas aparecerao aqui automaticamente assim que entrarem na cobertura."
          />
        )}

        {!isLoading && !isError && gallery?.hasVisiblePhotos && allPhotos.length > 0 && (
          <div className="mx-auto max-w-3xl">
            <MasonryGrid photos={allPhotos} onPhotoClick={handlePhotoClick} columns={columns} />
            <div ref={sentinelRef} className="h-10" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
              </div>
            )}
            {!hasNextPage && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Todas as fotos publicadas foram carregadas
              </p>
            )}
          </div>
        )}
      </PullToRefresh>

      <Suspense fallback={null}>
        <AnimatePresence>
          {selectedPhoto && (
            <PhotoViewer
              photos={allPhotos}
              initialIndex={selectedPhoto.index}
              onClose={() => setSelectedPhoto(null)}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
};

export default GalleryPage;
