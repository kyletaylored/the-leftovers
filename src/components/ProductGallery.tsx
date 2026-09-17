import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * ProductGallery — one main image + a thumbnail strip + a full-size modal.
 *
 * Replaces stacking every variant as its own full-width figure, which is what
 * made the pre-order page (multiple jersey versions, each with a mockup) run
 * very long before a visitor ever reached the order form. This holds a
 * constant height regardless of how many images a drop has — the vertical
 * space problem doesn't come back as more variants are added.
 *
 * Images are pre-optimized by Astro's <Image> on the server (see
 * preorder/[slug].astro) and handed over as plain src/srcSet strings, so the
 * island ships behaviour only, matching the Slideshow/GallerySlideshow split.
 *
 * A missing photo is passed in as a real slide pointing at the mascot icon
 * (already resolved by the page) rather than a special "no image" case, so
 * this component only has one code path for rendering a slide.
 */
export interface GalleryImage {
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  alt: string;
  /** e.g. the variant name, shown under the main image. */
  title?: string;
  description?: string;
  /** True for the mascot-icon stand-in when no real photo exists yet. */
  isPlaceholder?: boolean;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  className?: string;
}

/** Same path data as the brand Icon set, so this matches every other arrow
 *  and close glyph on the site without pulling an icon library into an
 *  island for three glyphs. */
function Glyph({ name, className }: { name: 'arrow' | 'close' | 'zoom'; className?: string }) {
  if (name === 'zoom') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 21 21" />
      </svg>
    );
  }
  const d = name === 'close' ? 'M6 6l12 12M18 6 6 18' : 'M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5';
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

export default function ProductGallery({ images, className }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const count = images.length;
  const current = images[active];

  const go = useCallback(
    (delta: number) => setActive((i) => (i + delta + count) % count),
    [count]
  );

  const openModal = () => setModalOpen(true);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    // Return focus to whatever opened it — the main image button — rather
    // than dropping focus back to <body>.
    openerRef.current?.focus();
  }, []);

  // Escape closes; arrow keys move between images while the modal is open.
  // Body scroll is locked so the page behind a full-screen lightbox can't
  // scroll out from under it.
  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
      if (event.key === 'ArrowRight' && count > 1) go(1);
      if (event.key === 'ArrowLeft' && count > 1) go(-1);
    };
    document.addEventListener('keydown', onKeyDown);

    // Minimal focus trap: keep Tab cycling within the dialog rather than
    // escaping into the page underneath.
    const onFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onFocusTrap);

    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keydown', onFocusTrap);
    };
  }, [modalOpen, count, go, closeModal]);

  if (count === 0) return null;

  return (
    <div className={className}>
      {/* Main image — a button, since its whole job is opening the modal. */}
      <button
        type="button"
        ref={openerRef}
        onClick={openModal}
        className="group relative block aspect-square w-full overflow-hidden rounded-sm border border-ink-600 bg-ink-800"
        aria-label={`View larger image: ${current.title ?? current.alt}`}
      >
        <img
          key={current.src}
          src={current.src}
          srcSet={current.srcSet}
          sizes="(min-width: 1024px) 480px, 92vw"
          width={current.width}
          height={current.height}
          alt={current.alt}
          loading="eager"
          decoding="async"
          className={cn(
            'size-full',
            current.isPlaceholder ? 'object-contain p-16 opacity-45' : 'object-cover'
          )}
        />
        <span className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-ink/70 text-bone opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Glyph name="zoom" className="size-4" />
        </span>
      </button>

      {(current.title || current.description) && (
        <div className="mt-3">
          {current.title && <p className="font-display text-lg uppercase text-bone">{current.title}</p>}
          {current.description && <p className="mt-1 text-sm text-bone-muted">{current.description}</p>}
        </div>
      )}

      {/* Thumbnail strip — only worth showing once there's something to switch between. */}
      {count > 1 && (
        <ul className="mt-4 flex gap-2 overflow-x-auto pb-1" role="list">
          {images.map((image, index) => (
            <li key={image.src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-current={index === active ? 'true' : undefined}
                aria-label={image.title ?? `Image ${index + 1} of ${count}`}
                className={cn(
                  'block size-16 overflow-hidden rounded-sm border-2 bg-ink-800 transition-colors sm:size-20',
                  index === active ? 'border-gold' : 'border-ink-600 hover:border-gold/50'
                )}
              >
                <img
                  src={image.src}
                  alt=""
                  aria-hidden="true"
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    'size-full',
                    image.isPlaceholder ? 'object-contain p-3 opacity-45' : 'object-cover'
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-full w-full max-w-3xl flex-col items-center outline-none"
          >
            <h2 id={titleId} className="sr-only">
              {current.title ?? current.alt} — full size
            </h2>

            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute -top-2 right-0 inline-flex size-11 items-center justify-center rounded-full border border-gold bg-ink text-gold-300 transition-colors hover:bg-gold hover:text-ink sm:-right-4 sm:-top-4"
            >
              <Glyph name="close" className="size-5" />
            </button>

            <img
              src={current.src}
              srcSet={current.srcSet}
              width={current.width}
              height={current.height}
              alt={current.alt}
              className={cn(
                'max-h-[80vh] w-auto rounded-sm',
                current.isPlaceholder ? 'object-contain opacity-45' : 'object-contain'
              )}
            />

            {current.title && (
              <p className="mt-4 font-display text-lg uppercase text-bone">{current.title}</p>
            )}

            {count > 1 && (
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous image"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-gold text-gold-300 transition-colors hover:bg-gold hover:text-ink"
                >
                  <Glyph name="arrow" className="size-4 rotate-180" />
                </button>
                <span className="text-sm text-bone-muted">
                  {active + 1} of {count}
                </span>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next image"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-gold text-gold-300 transition-colors hover:bg-gold hover:text-ink"
                >
                  <Glyph name="arrow" className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
