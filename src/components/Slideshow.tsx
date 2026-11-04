import { useCallback, useEffect, useState, type ReactNode } from 'react';
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
 *
 * Variants (design storybook §04.5 "Galleries" / "Slider"). Defaults
 * reproduce the original peek carousel exactly, so existing call sites are
 * unchanged:
 *  - `layout`: `peek` (default — neighbours peek in at the edges), `single`
 *    (one 16:10 image at a time), `hero` (edge-to-edge 16:7, arrows on the
 *    image, caption flag + dashes overlaid bottom-left — a page hero or a
 *    mid-page recap/sponsor reel).
 *  - `indicators`: `dashes` (default) when captions carry the context, or
 *    `thumbnails` when the shots themselves are worth previewing.
 *  - `captionStyle`: `below` (default, figcaption strip) or `flag` (the
 *    clipped crimson ribbon on the image's bottom-left). `hero` always flags.
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

export type SlideshowLayout = 'peek' | 'single' | 'hero';
export type SlideshowIndicators = 'dashes' | 'thumbnails';
export type SlideshowCaptionStyle = 'below' | 'flag';

interface SlideshowProps {
  slides: Slide[];
  /** Advance every N ms. Ignored under prefers-reduced-motion. */
  autoplayMs?: number;
  layout?: SlideshowLayout;
  indicators?: SlideshowIndicators;
  captionStyle?: SlideshowCaptionStyle;
  className?: string;
}

/** The clipped crimson ribbon that labels a slide (storybook "caption flag"). */
function CaptionFlag({ children, large = false }: { children: ReactNode; large?: boolean }) {
  return (
    <span
      className={cn(
        'absolute left-0 bg-crimson font-bold uppercase tracking-[0.06em] text-bone',
        '[clip-path:polygon(0_0,100%_0,88%_100%,0_100%)]',
        large
          ? 'bottom-7 py-3 pl-6 pr-8 text-sm sm:text-[0.9375rem]'
          : 'bottom-0 py-2 pl-4 pr-5 text-xs'
      )}
    >
      {children}
    </span>
  );
}

const aspectFor: Record<SlideshowLayout, string> = {
  peek: 'aspect-[3/2]',
  single: 'aspect-[16/10]',
  hero: 'aspect-[16/7]',
};

export default function Slideshow({
  slides,
  autoplayMs,
  layout = 'peek',
  indicators = 'dashes',
  captionStyle = 'below',
  className,
}: SlideshowProps) {
  const isHero = layout === 'hero';
  const flag = isHero || captionStyle === 'flag';
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
              className={cn(
                'basis-full',
                layout === 'peek' && 'sm:basis-4/5 lg:basis-2/3'
              )}
            >
              <figure className="relative overflow-hidden rounded-sm border border-border bg-card">
                <img
                  src={slide.src}
                  srcSet={slide.srcSet}
                  sizes={
                    layout === 'peek'
                      ? '(min-width: 1024px) 60vw, (min-width: 640px) 78vw, 92vw'
                      : '(min-width: 1320px) 1320px, 100vw'
                  }
                  width={slide.width}
                  height={slide.height}
                  alt={slide.alt}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className={cn(aspectFor[layout], 'w-full object-cover')}
                />
                {slide.caption &&
                  (flag ? (
                    <figcaption>
                      <CaptionFlag large={isHero}>{slide.caption}</CaptionFlag>
                    </figcaption>
                  ) : (
                    <figcaption className="px-4 py-2.5 text-xs text-bone-muted">
                      {slide.caption}
                    </figcaption>
                  ))}
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>

        {slides.length > 1 && (
          <>
            <CarouselPrevious
              className={cn(
                // `peek` hangs the arrows outside the track (original look);
                // `single`/`hero` keep them on the image so they never
                // overflow a narrow container.
                layout === 'single' && 'left-3 sm:left-3',
                isHero &&
                  'left-4 rounded-none border-bone/40 bg-ink/50 text-bone sm:left-4 hover:border-gold'
              )}
            />
            <CarouselNext
              className={cn(
                layout === 'single' && 'right-3 sm:right-3',
                isHero &&
                  'right-4 rounded-none border-bone/40 bg-ink/50 text-bone sm:right-4 hover:border-gold'
              )}
            />
          </>
        )}
      </Carousel>

      {slides.length > 1 && isHero && (
        // Dashes sit ON the image under the caption flag at hero scale.
        <div className="absolute bottom-1 left-6 flex gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? 'true' : undefined}
              className="group flex h-6 items-center"
            >
              <span
                className={cn(
                  'block h-[3px] w-6 transition-colors',
                  index === current ? 'bg-gold' : 'bg-bone/35 group-hover:bg-gold/60'
                )}
              />
            </button>
          ))}
        </div>
      )}

      {slides.length > 1 && !isHero && indicators === 'thumbnails' && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? 'true' : undefined}
              className={cn(
                'aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-sm transition-colors',
                index === current
                  ? 'border-2 border-gold'
                  : 'border border-ink-600 opacity-70 hover:opacity-100'
              )}
            >
              <img src={slide.src} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {slides.length > 1 && !isHero && indicators === 'dashes' && (
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
