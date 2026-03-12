import { Camera } from 'lucide-react';

interface GalleryStatsBarProps {
  totalPhotos: number;
  isLive?: boolean;
}

export function GalleryStatsBar({ totalPhotos, isLive }: GalleryStatsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <Camera className="h-3.5 w-3.5" />
        {totalPhotos} fotos
      </span>
      {isLive && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          AO VIVO
        </span>
      )}
    </div>
  );
}
