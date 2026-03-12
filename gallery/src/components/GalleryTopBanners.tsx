import { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';
import type { GalleryBanner } from '@/types/gallery';

interface GalleryTopBannersProps {
  banners: GalleryBanner[];
}

export function GalleryTopBanners({ banners }: GalleryTopBannersProps) {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api || banners.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [api, banners.length]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mb-3 max-w-3xl px-3">
      <Carousel
        opts={{ loop: banners.length > 1, align: 'start' }}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {banners.map((banner) => {
            const content = (
              <img
                src={banner.imageUrl}
                alt={banner.altText || 'Banner da galeria'}
                className="h-28 w-full rounded-[28px] object-cover shadow-sm sm:h-36"
              />
            );

            return (
              <CarouselItem key={banner.id} className="pl-3">
                {banner.linkUrl ? (
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
