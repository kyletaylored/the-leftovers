import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Slide } from './Slideshow';

/**
 * Lightbox — the full-screen photo viewer behind Slideshow's `grid` mode, with
 * a magnifier. Slideshow mounts it when opened; it isn't used on its own.
 *
 * Built on a native <dialog>, so showModal() gives the focus trap, Esc to
 * close, and focus returning to the button that opened it, with no library.
 *
 * Bandwidth: opening costs nothing, because it shows the same `srcSet` image
 * the carousel already downloaded. The full-size `zoomSrc` is only fetched
 * once someone actually magnifies.
 *
 * Controls:
 *  - Pointer: click or tap the photo to magnify at that spot, then move to
 *    pan. Swipe sideways to change photo when not magnified.
 *  - Keyboard: left and right change photo, or pan when magnified. Every action
 *    also has a 44px button, so nothing depends on a gesture.
 *
 * Magnifying is an instant CSS transform, so it needs no motion handling.
 */

const SCALE = 2.5;
const SWIPE_PX = 50;
const TAP_PX = 8;
const PAN_STEP = 10;

const clamp = (n: number) => Math.min(100, Math.max(0, n));

function Control({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="tap grid size-11 shrink-0 place-items-center border border-bone/40 bg-ink/60 text-bone transition-colors hover:border-gold hover:text-gold"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

interface LightboxProps {
  slides: Slide[];
  /** The photo on show. Owned by the Slideshow, so closing stays on it. */
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

export default function Lightbox({ slides, index, onNavigate, onClose }: LightboxProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const press = useRef<{ x: number; y: number } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [focus, setFocus] = useState({ x: 50, y: 50 });
  const slide = slides[index];
  const multiple = slides.length > 1;

  useEffect(() => {
    dialog.current?.showModal();
    // A modal dialog doesn't stop the page behind it from scrolling.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  // Each photo starts fitted to the screen.
  useEffect(() => {
    setZoomed(false);
    setFocus({ x: 50, y: 50 });
  }, [index]);

  const go = (step: number) => onNavigate((index + step + slides.length) % slides.length);

  const pointAt = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setFocus({
      x: clamp(((event.clientX - box.left) / box.width) * 100),
      y: clamp(((event.clientY - box.top) / box.height) * 100),
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    const pan = { ArrowLeft: [-PAN_STEP, 0], ArrowRight: [PAN_STEP, 0], ArrowUp: [0, -PAN_STEP], ArrowDown: [0, PAN_STEP] }[event.key];
    if (!pan) return;
    event.preventDefault();
    if (zoomed) setFocus((f) => ({ x: clamp(f.x + pan[0]), y: clamp(f.y + pan[1]) }));
    else if (pan[0] && multiple) go(pan[0] > 0 ? 1 : -1);
  };

  return (
    <dialog
      ref={dialog}
      aria-label="Photo viewer"
      onClose={onClose}
      onKeyDown={onKeyDown}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none bg-ink text-bone backdrop:bg-ink"
    >
      <div className="flex size-full flex-col">
        <div className="flex items-center justify-between gap-3 p-3">
          <p className="text-sm text-bone-muted" aria-live="polite">
            Photo {index + 1} of {slides.length}
          </p>
          <div className="flex gap-2">
            <Control label={zoomed ? 'Zoom out' : 'Magnify photo'} pressed={zoomed} onClick={() => setZoomed((z) => !z)}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4M8 11h6" />
              {!zoomed && <path d="M11 8v6" />}
            </Control>
            <Control label="Close photo viewer" onClick={() => dialog.current?.close()}>
              <path d="M6 6l12 12M18 6 6 18" />
            </Control>
          </div>
        </div>

        <div
          className={cn(
            'relative min-h-0 flex-1 select-none overflow-hidden',
            zoomed ? 'cursor-zoom-out touch-none' : 'cursor-zoom-in touch-pinch-zoom'
          )}
          onPointerDown={(event) => {
            if (event.isPrimary) press.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerMove={(event) => zoomed && pointAt(event)}
          // Tap, drag and swipe are all decided here rather than with `click`,
          // which touch doesn't reliably fire on the photo and which would
          // also fire at the end of a pan.
          onPointerUp={(event) => {
            const start = press.current;
            press.current = null;
            if (!start || !event.isPrimary) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.max(Math.abs(dx), Math.abs(dy)) <= TAP_PX) {
              pointAt(event);
              setZoomed((z) => !z);
            } else if (!zoomed && multiple && Math.abs(dx) > SWIPE_PX) {
              go(dx < 0 ? 1 : -1);
            }
          }}
          onPointerCancel={() => {
            press.current = null;
          }}
        >
          <img
            key={slide.src}
            src={zoomed ? (slide.zoomSrc ?? slide.src) : slide.src}
            srcSet={zoomed ? undefined : slide.srcSet}
            sizes="100vw"
            alt={slide.alt}
            draggable={false}
            className="size-full object-contain"
            style={{
              transform: zoomed ? `scale(${SCALE})` : undefined,
              transformOrigin: `${focus.x}% ${focus.y}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 p-3">
          {multiple && (
            <Control label="Previous photo" onClick={() => go(-1)}>
              <path d="M20 12H5m0 0 5.5-5.5M5 12l5.5 5.5" />
            </Control>
          )}
          <p className="min-w-0 flex-1 text-center text-sm text-bone-muted">
            {slide.caption ?? slide.kicker}
          </p>
          {multiple && (
            <Control label="Next photo" onClick={() => go(1)}>
              <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />
            </Control>
          )}
        </div>
      </div>
    </dialog>
  );
}
