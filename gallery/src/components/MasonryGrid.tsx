import { useMemo } from 'react';
import type { PhotoItem } from '@/types/gallery';
import { PhotoCard } from './PhotoCard';

interface MasonryGridProps {
  photos: PhotoItem[];
  onPhotoClick: (photo: PhotoItem) => void;
  columns?: number;
}

export function MasonryGrid({ photos, onPhotoClick, columns = 2 }: MasonryGridProps) {
  const columnArrays = useMemo(() => {
    const cols: PhotoItem[][] = Array.from({ length: columns }, () => []);
    const heights = new Array(columns).fill(0);

    for (const photo of photos) {
      const shortestCol = heights.indexOf(Math.min(...heights));
      cols[shortestCol].push(photo);
      heights[shortestCol] += photo.height / photo.width;
    }

    return cols;
  }, [photos, columns]);

  return (
    <div className="flex gap-2 px-2">
      {columnArrays.map((col, colIndex) => (
        <div key={colIndex} className="flex flex-1 flex-col gap-2">
          {col.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onClick={onPhotoClick} />
          ))}
        </div>
      ))}
    </div>
  );
}
