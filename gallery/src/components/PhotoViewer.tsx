import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import type { PhotoItem } from '@/types/gallery';

const ShareSheet = lazy(() =>
  import('@/components/ShareSheet').then((m) => ({ default: m.ShareSheet }))
);

interface PhotoViewerProps {
  photos: PhotoItem[];
  initialIndex: number;
  onClose: () => void;
}

export function PhotoViewer({ photos, initialIndex, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showUI, setShowUI] = useState(true);
  const [direction, setDirection] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const photo = photos[currentIndex];

  const goTo = useCallback(
    (newIndex: number, dir: number) => {
      if (newIndex >= 0 && newIndex < photos.length) {
        setDirection(dir);
        setCurrentIndex(newIndex);
      }
    },
    [photos.length]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1, 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1, -1), [currentIndex, goTo]);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x < -threshold && info.velocity.x < -100) {
        goNext();
      } else if (info.offset.x > threshold && info.velocity.x > 100) {
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  const toggleUI = useCallback(() => setShowUI((v) => !v), []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  // Preload adjacent images
  useEffect(() => {
    const preload = [currentIndex - 1, currentIndex + 1];
    preload.forEach((idx) => {
      if (idx >= 0 && idx < photos.length) {
        const img = new Image();
        img.src = photos[idx].mediumUrl;
      }
    });
  }, [currentIndex, photos]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  if (!photo) return null;

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-foreground/95 safe-top safe-bottom"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top bar */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 pt-safe-area-inset-top"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
          >
            <span className="text-xs font-medium text-background/70">
              {currentIndex + 1} / {photos.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShare(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background backdrop-blur-sm transition-colors hover:bg-background/20"
                aria-label="Compartilhar"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background backdrop-blur-sm transition-colors hover:bg-background/20"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image area */}
      <div className="flex flex-1 items-center justify-center overflow-hidden" onClick={toggleUI}>
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={photo.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            className="flex h-full w-full items-center justify-center px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photo.mediumUrl}
              alt={photo.caption || `Foto ${photo.sequence}`}
              className="max-h-full max-w-full rounded object-contain select-none"
              draggable={false}
              onClick={toggleUI}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <AnimatePresence>
        {showUI && photo.caption && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent px-4 pb-6 pt-10"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
          >
            <p className="text-sm text-background/90">{photo.caption}</p>
            {photo.authorName && (
              <p className="mt-0.5 text-xs text-background/60">por {photo.authorName}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop nav arrows */}
      <div className="pointer-events-none absolute inset-0 hidden items-center justify-between px-4 md:flex">
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background backdrop-blur-sm transition-colors hover:bg-background/20"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div />
        {currentIndex < photos.length - 1 && (
          <button
            onClick={goNext}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background backdrop-blur-sm transition-colors hover:bg-background/20"
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Share sheet */}
      {showShare && (
        <Suspense fallback={null}>
          <ShareSheet photo={photo} onClose={() => setShowShare(false)} />
        </Suspense>
      )}
    </motion.div>
  );
}
