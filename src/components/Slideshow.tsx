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
 *  - `showcase` (Nov 2026): the full-bleed sports-poster slider (think
 *    energy-drink / action-sports sites). Tall edge-to-edge photo with a slow
 *    zoom, a gold KICKER and a huge display HEADLINE per slide that animate
 *    in, a "03 / 10" counter, segmented progress bars and square controls.
 *    `tone` (showcase only) colours the overlay: `ink` (default), `crimson`
 *    or `forest`, matching ImpactBand's tones so the two can sit together.
 *    Place it outside any container. With `autoplayMs` it shows a visible
 *    pause/play button (WCAG 2.2.2) and the active bar fills over the
 *    interval; the bar's animationend is what advances the slide, so hover
 *    and focus pause the bar and the timer together.
 *
 * Per-slide text: `caption` is the slide's own line (the headline in
 * `showcase`, the flag text elsewhere); `kicker` is the small context line
 * above it (GallerySlideshow passes the gallery title). A slide with no
 * caption falls back to its kicker, which is the pre-Nov 2026 behaviour.
 */
export interface Slide {
  /** Rendered src + srcset, produced by Astro's image service. */
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  /** Small context line above the caption, e.g. the event or gallery. */
  kicker?: string;
}

export type SlideshowLayout = 'peek' | 'single' | 'hero' | 'showcase';
export type SlideshowIndicators = 'dashes' | 'thumbnails';
export type SlideshowCaptionStyle = 'below' | 'flag';
export type SlideshowTone = 'ink' | 'crimson' | 'forest';

/** Showcase overlay per tone: a bottom fade under the headline + a left fade. */
const showcaseTone: Record<SlideshowTone, { bottom: string; side: string; bg: string }> = {
  ink: { bottom: 'from-ink via-ink/35 to-ink/10', side: 'from-ink/70', bg: 'bg-ink' },
  crimson: { bottom: 'from-crimson via-crimson/45 to-ink/10', side: 'from-crimson/75', bg: 'bg-crimson' },
  forest: { bottom: 'from-forest via-forest/45 to-ink/10', side: 'from-forest/75', bg: 'bg-forest' },
};

interface SlideshowProps {
  slides: Slide[];
  /** Advance every N ms. Ignored under prefers-reduced-motion. */
  autoplayMs?: number;
  layout?: SlideshowLayout;
  indicators?: SlideshowIndicators;
  captionStyle?: SlideshowCaptionStyle;
  /** `showcase` only: overlay colour. */
  tone?: SlideshowTone;
  className?: string;
}

/**
 * The clipped crimson ribbon that labels a slide (storybook "caption flag").
 * Grows on desktop so the per-slide line reads as a headline, not a tag, and
 * carries the kicker above it when the slide has both.
 */
function CaptionFlag({
  children,
  kicker,
  large = false,
}: {
  children: ReactNode;
  kicker?: string;
  large?: boolean;
}) {
  return (
    <span className={cn('absolute left-0 flex flex-col items-start', large ? 'bottom-7' : 'bottom-0')}>
      {kicker && (
        <span className="mb-1 bg-ink/80 px-3 py-1 text-[0.625rem] font-bold uppercase tracking-[0.22em] text-gold-300 sm:px-4 sm:text-xs">
          {kicker}
        </span>
      )}
      <span
        className={cn(
          'bg-crimson font-bold uppercase tracking-[0.06em] text-bone',
          '[clip-path:polygon(0_0,100%_0,92%_100%,0_100%)]',
          large
            ? 'py-3 pl-6 pr-10 text-sm sm:text-base lg:py-4 lg:pl-8 lg:pr-14 lg:font-display lg:text-3xl lg:font-normal lg:tracking-[0.02em]'
            : 'py-2 pl-4 pr-6 text-xs sm:py-2.5 sm:pl-5 sm:pr-9 sm:text-sm lg:py-3 lg:pl-6 lg:pr-12 lg:font-display lg:text-2xl lg:font-normal lg:tracking-[0.02em]'
        )}
      >
        {children}
      </span>
    </span>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Square, on-brand control button for the showcase bar (44px target). */
function ShowcaseButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="tap grid size-11 place-items-center border border-bone/40 bg-ink/50 text-bone backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
    >
      {children}
    </button>
  );
}

function Arrow({ left = false }: { left?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-5', left && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />
    </svg>
  );
}

const aspectFor: Record<Exclude<SlideshowLayout, 'showcase'>, string> = {
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
  tone = 'ink',
  className,
}: SlideshowProps) {
  const isHero = layout === 'hero';
  const isShowcase = layout === 'showcase';
  const flag = isHero || captionStyle === 'flag';
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  // Showcase autoplay state. `motionOK` starts false so the server render and
  // reduced-motion users never get a moving slider or a pause button.
  const [motionOK, setMotionOK] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    setMotionOK(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

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
  // and is disabled outright for reduced-motion users. (Showcase drives its
  // own autoplay from the progress bar; see below.)
  useEffect(() => {
    if (!api || !autoplayMs || isShowcase) return;
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
  }, [api, autoplayMs, isShowcase]);

  const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api]);

  if (slides.length === 0) return null;

  if (isShowcase) {
    const autoplay = Boolean(autoplayMs) && motionOK && slides.length > 1;
    const running = autoplay && playing;
    return (
      <div
        className={cn('relative', showcaseTone[tone].bg, className)}
        // Hovering or focusing anywhere in the slider holds the progress bar.
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false);
        }}
      >
        <Carousel setApi={setApi} opts={{ loop: slides.length > 1 }} className="w-full">
          <CarouselContent className="ml-0">
            {slides.map((slide, index) => {
              const active = index === current;
              const headline = slide.caption ?? slide.kicker;
              const kicker = slide.caption ? slide.kicker : undefined;
              return (
                <CarouselItem
                  key={slide.src}
                  aria-label={`${index + 1} of ${slides.length}`}
                  className="basis-full pl-0"
                >
                  <figure className="relative h-[78svh] max-h-[54rem] min-h-[30rem] overflow-hidden sm:h-[82svh]">
                    <img
                      src={slide.src}
                      srcSet={slide.srcSet}
                      sizes="100vw"
                      width={slide.width}
                      height={slide.height}
                      alt={slide.alt}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className={cn(
                        'absolute inset-0 size-full object-cover transition-transform duration-[7000ms] ease-out',
                        active ? 'scale-100' : 'scale-110'
                      )}
                    />
                    <div
                      className={cn('absolute inset-0 bg-gradient-to-t', showcaseTone[tone].bottom)}
                      aria-hidden="true"
                    />
                    <div
                      className={cn('absolute inset-0 bg-gradient-to-r via-transparent to-transparent', showcaseTone[tone].side)}
                      aria-hidden="true"
                    />
                    {headline && (
                      <figcaption
                        className={cn(
                          'absolute inset-x-0 bottom-0 px-4 pb-32 transition-all delay-150 duration-700 ease-[var(--ease-brand)] sm:px-10 sm:pb-36 lg:px-16 lg:pb-40',
                          active ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        )}
                      >
                        {kicker && (
                          <span className="eyebrow mb-4 flex items-center gap-3 sm:text-xs">
                            <span className="block h-[3px] w-10 bg-crimson" aria-hidden="true" />
                            {kicker}
                          </span>
                        )}
                        <span className="block max-w-4xl font-display text-4xl uppercase leading-[0.92] text-bone [text-shadow:0_4px_24px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl xl:text-8xl">
                          {headline}
                        </span>
                      </figcaption>
                    )}
                  </figure>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {slides.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 px-4 pb-6 sm:gap-6 sm:px-10 sm:pb-10 lg:px-16">
            <p className="shrink-0 font-display text-bone" aria-hidden="true">
              <span className="numeral text-3xl sm:text-4xl">{pad(current + 1)}</span>
              <span className="mx-2 text-bone/50">/</span>
              <span className="text-lg text-bone/70 sm:text-xl">{pad(slides.length)}</span>
            </p>
            {/* Phones: one continuous bar (segments would be ~8px wide, far
                under the touch-target minimum; prev/next do the navigating).
                Only the visible bar animates (display:none stops CSS
                animations), so the slide only advances once. */}
            <div className="relative h-[3px] min-w-0 flex-1 overflow-hidden bg-bone/25 sm:hidden" aria-hidden="true">
              <span
                key={`m-${current}-${running}`}
                className="absolute inset-0 origin-left bg-gold"
                style={
                  running
                    ? {
                        animation: `slide-progress ${autoplayMs}ms linear forwards`,
                        animationPlayState: held ? 'paused' : 'running',
                      }
                    : { transform: `scaleX(${(current + 1) / slides.length})` }
                }
                onAnimationEnd={() => api?.scrollNext()}
              />
            </div>
            <div className="hidden min-w-0 flex-1 gap-1.5 sm:flex">
              {slides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === current ? 'true' : undefined}
                  className="group flex h-11 min-w-0 flex-1 items-center"
                >
                  <span className="relative block h-[3px] w-full overflow-hidden bg-bone/25 group-hover:bg-bone/50">
                    {index === current && (
                      <span
                        // Remount per slide/play state so the fill restarts.
                        key={`${current}-${running}`}
                        data-progress={running ? 'running' : 'static'}
                        className="absolute inset-0 origin-left bg-gold"
                        style={
                          running
                            ? {
                                animation: `slide-progress ${autoplayMs}ms linear forwards`,
                                animationPlayState: held ? 'paused' : 'running',
                              }
                            : undefined
                        }
                        onAnimationEnd={() => api?.scrollNext()}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex shrink-0 gap-2">
              {autoplay && (
                <ShowcaseButton
                  label={playing ? 'Pause slideshow' : 'Play slideshow'}
                  onClick={() => setPlaying((p) => !p)}
                >
                  {playing ? (
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                      <rect x="6" y="5" width="4" height="14" />
                      <rect x="14" y="5" width="4" height="14" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                      <path d="M7 4.5v15l12-7.5Z" />
                    </svg>
                  )}
                </ShowcaseButton>
              )}
              <ShowcaseButton label="Previous slide" onClick={() => api?.scrollPrev()}>
                <Arrow left />
              </ShowcaseButton>
              <ShowcaseButton label="Next slide" onClick={() => api?.scrollNext()}>
                <Arrow />
              </ShowcaseButton>
            </div>
          </div>
        )}
      </div>
    );
  }

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
                {(slide.caption ?? slide.kicker) &&
                  (flag ? (
                    <figcaption>
                      <CaptionFlag large={isHero} kicker={slide.caption ? slide.kicker : undefined}>
                        {slide.caption ?? slide.kicker}
                      </CaptionFlag>
                    </figcaption>
                  ) : (
                    <figcaption className="px-4 py-2.5 text-xs text-bone-muted">
                      {slide.caption ?? slide.kicker}
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
