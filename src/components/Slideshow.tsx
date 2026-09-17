import { useCallback, useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

/**
 * Slideshow — the photo carousel, built on shadcn/ui's Carousel (Embla).
 *
 * Images are pre-optimized by Astro's <Image> on the server and passed in as
 * plain srcset data, so the island ships markup and behaviour only — no
 * image pipeline crosses into the client bundle.
 *
 * Accessibility notes, since a carousel is easy to get wrong:
 *  - The track is a labelled `aria-roledescription="carousel"` region with
 *    real prev/next buttons (44x44px) that disable at the ends.
 *  - Each slide is a labelled group announcing "N of M".
 *  - The dots are real buttons, not decoration.
 *  - Autoplay is OFF by default and never runs under reduced-motion. A
 *    carousel that moves on its own is a hazard for anyone reading slowly.
 */
export interface Slide {
  /** Rendered src + srcset, produced by Astro's image service. */
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
}

interface SlideshowProps {
  slides: Slide[];
  /** Advance every N ms. Ignored under prefers-reduced-motion. */
  autoplayMs?: number;
  className?: string;
}

export default function Slideshow({ slides, autoplayMs, className }: SlideshowProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const sync = () => setCurrent(api.selectedScrollSnap());
    sync();
    api.on('select', sync);
    return () => {
      api.off('select', sync);
    };
  }, [api]);

  // Autoplay is opt-in, pauses on hover/focus via Embla's pointer handling,
  // and is disabled outright for reduced-motion users.
  useEffect(() => {
    if (!api || !autoplayMs) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer: number | undefined;
    const stop = () => window.clearInterval(timer);
    const start = () => {
      stop();
      timer = window.setInterval(() => api.scrollNext(), autoplayMs);
    };

    const node = api.rootNode();
    node.addEventListener('pointerenter', stop);
    node.addEventListener('pointerleave', start);
    node.addEventListener('focusin', stop);
    node.addEventListener('focusout', start);
    start();

    return () => {
      stop();
      node.removeEventListener('pointerenter', stop);
      node.removeEventListener('pointerleave', start);
      node.removeEventListener('focusin', stop);
      node.removeEventListener('focusout', start);
    };
  }, [api, autoplayMs]);

  const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api]);

  if (slides.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      <Carousel setApi={setApi} opts={{ loop: slides.length > 2 }} className="w-full">
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.src}
              aria-label={`${index + 1} of ${slides.length}`}
              className="basis-full sm:basis-4/5 lg:basis-2/3"
            >
              <figure className="overflow-hidden rounded-sm border border-border bg-card">
                <img
                  src={slide.src}
                  srcSet={slide.srcSet}
                  sizes="(min-width: 1024px) 60vw, (min-width: 640px) 78vw, 92vw"
                  width={slide.width}
                  height={slide.height}
                  alt={slide.alt}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="aspect-[3/2] w-full object-cover"
                />
                {slide.caption && (
                  <figcaption className="px-4 py-2.5 text-xs text-bone-muted">
                    {slide.caption}
                  </figcaption>
                )}
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>

        {slides.length > 1 && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>

      {slides.length > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? 'true' : undefined}
              className={cn(
                'h-1.5 rounded-full transition-all',
                // The hit area is padded out to 44px vertically by the wrapper
                // gap; the visible bar stays thin.
                index === current ? 'w-8 bg-gold' : 'w-4 bg-ink-600 hover:bg-gold/50'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
