import { useState, useCallback, useEffect, useRef } from 'react';
import type { PhotoItem } from '@/types/gallery';

interface PhotoCardProps {
  photo: PhotoItem;
  onClick: (photo: PhotoItem) => void;
}

// Simple in-memory cache to avoid re-loading images
const loadedImages = new Set<string>();

export function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const alreadyCached = loadedImages.has(photo.thumbUrl);
  const [loaded, setLoaded] = useState(alreadyCached);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleLoad = useCallback(() => {
    loadedImages.add(photo.thumbUrl);
    setLoaded(true);
  }, [photo.thumbUrl]);

  const handleError = useCallback(() => setError(true), []);

  // If image was already in browser cache, it may fire load synchronously
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      handleLoad();
    }
  }, [handleLoad]);

  const paddingBottom = `${(photo.height / photo.width) * 100}%`;

  return (
    <button
      className="group relative w-full overflow-hidden rounded-xl bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onClick(photo)}
      aria-label={photo.caption || `Foto ${photo.sequence}`}
    >
      <div style={{ paddingBottom }} className="relative w-full">
        {!error ? (
          <img
            ref={imgRef}
            src={photo.thumbUrl}
            alt={photo.caption || `Foto ${photo.sequence}`}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${
              loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">Indisponível</span>
          </div>
        )}
        {!loaded && !error && (
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="skeleton-shimmer-card h-full w-full" />
          </div>
        )}
      </div>
      {photo.isHighlight && (
        <div className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
          Destaque
        </div>
      )}
    </button>
  );
}
