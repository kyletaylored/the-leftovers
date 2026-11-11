/**
 * VideoPlayerIsland — the on-brand controls for VideoPlayer.astro, which
 * resolves the videos entry and poster and renders this `client:visible`.
 *
 * Server render and no-JS: a plain <video controls> with the captions track,
 * so the browser's own player works before (or without) hydration. Once
 * hydrated, the native controls are swapped for ours:
 *   - a big crimson play button over the poster (also shown when it ends);
 *   - a bottom bar: play/pause, time, a gold progress bar (a real range
 *     input, so arrow keys seek and screen readers announce "0:12 of 0:43"),
 *     mute, captions and fullscreen. It fades out after 2.5s of playback
 *     without pointer or keyboard activity and comes back on either;
 *   - captions drawn by us, not the browser: the track runs in "hidden" mode
 *     (cues still load and fire cuechange) and the active cue is set in the
 *     site's type on an ink plate, lifted clear of the bar when it's showing.
 *     aria-hidden, since they repeat the audio a screen reader already hears.
 *
 * Keys while focus is in the player: Space/K play-pause, M mute, C captions,
 * F fullscreen. Arrow keys seek on the progress bar. Every control is a
 * labelled button of at least 44px, with the site's gold focus ring.
 *
 * iPhone Safari can't fullscreen an element, only the <video>, so it falls
 * back to webkitEnterFullscreen (the system player, with its own captions).
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { STROKED_ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';

export interface VideoPlayerIslandProps {
  src: string;
  type?: string;
  poster?: string;
  /** Names the player for assistive tech ("Play video: …"). */
  title: string;
  /** WebVTT file. */
  captions?: string;
  captionsLang?: string;
  /** The track's name, e.g. "English". */
  captionsLabel?: string;
  /** Captions showing from the start. */
  captionsOn?: boolean;
  class?: string;
}

type IconName = keyof typeof STROKED_ICONS;

function Glyph({ name, className }: { name: IconName; className?: string }) {
  const filled = name === 'play';
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-6', className)}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 1.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={STROKED_ICONS[name]} />
    </svg>
  );
}

/** "0:05", "1:02:05". */
export function clock(total: number): string {
  const t = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

function ControlButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'tap grid size-11 shrink-0 place-items-center rounded-sm text-bone transition-colors',
        'hover:text-gold-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold',
        pressed && 'text-gold-300'
      )}
    >
      {children}
    </button>
  );
}

const IDLE_MS = 2500;

export default function VideoPlayerIsland({
  src,
  type = 'video/mp4',
  poster,
  title,
  captions,
  captionsLang = 'en',
  captionsLabel = 'English',
  captionsOn = true,
  class: className,
}: VideoPlayerIslandProps) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const idle = useRef<number | undefined>(undefined);

  const [enhanced, setEnhanced] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(captionsOn);
  const [cue, setCue] = useState('');
  const [active, setActive] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Swap the native controls for ours only once JS is running.
  useEffect(() => setEnhanced(true), []);

  // Captions: keep the track "hidden" (loaded, firing cuechange) and draw the cue ourselves.
  useEffect(() => {
    const el = video.current;
    const track = el?.textTracks[0];
    if (!enhanced || !track) return;
    track.mode = 'hidden';
    const update = () => {
      const cues = track.activeCues ? [...track.activeCues] : [];
      setCue(cues.map((c) => (c as VTTCue).text.replace(/<[^>]+>/g, '')).join('\n'));
    };
    track.addEventListener('cuechange', update);
    return () => track.removeEventListener('cuechange', update);
  }, [enhanced]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Show the bar, then fade it after a pause in activity while playing.
  const wake = useCallback(() => {
    setActive(true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setActive(false), IDLE_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(idle.current), []);

  const toggle = useCallback(() => {
    const el = video.current;
    if (!el) return;
    if (el.paused || el.ended) void el.play().catch(() => {});
    else el.pause();
    wake();
  }, [wake]);

  const toggleMute = () => {
    const el = video.current;
    if (el) el.muted = !el.muted;
  };

  const toggleFullscreen = () => {
    const el = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (root.current?.requestFullscreen) void root.current.requestFullscreen().catch(() => el?.webkitEnterFullscreen?.());
    else el?.webkitEnterFullscreen?.();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const onButton = (e.target as HTMLElement).closest('button, input');
    const key = e.key.toLowerCase();
    if (key === 'k' || (key === ' ' && !onButton)) toggle();
    else if (key === 'm') toggleMute();
    else if (key === 'c' && captions) setShowCaptions((on) => !on);
    else if (key === 'f') toggleFullscreen();
    else return wake();
    e.preventDefault();
    wake();
  };

  const barVisible = enhanced && (!playing || active);
  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <div
      ref={root}
      onPointerMove={enhanced ? wake : undefined}
      onKeyDown={enhanced ? onKeyDown : undefined}
      onFocus={enhanced ? wake : undefined}
      className={cn(
        'group/player relative overflow-hidden rounded-sm border border-ink-600 bg-ink-900',
        '[&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:bg-ink',
        enhanced && playing && !active && 'cursor-none',
        className
      )}
    >
      <video
        ref={video}
        className="block aspect-video w-full bg-ink-900 object-contain [:fullscreen>&]:aspect-auto [:fullscreen>&]:h-full"
        controls={!enhanced}
        preload="none"
        playsInline
        poster={poster}
        aria-label={title}
        onClick={enhanced ? toggle : undefined}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
          wake();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setStarted(false);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
      >
        <source src={src} type={type} />
        {captions && <track kind="captions" src={captions} srcLang={captionsLang} label={captionsLabel} default={captionsOn} />}
        <p className="p-4 text-sm text-bone-muted">
          Your browser can’t play this video.{' '}
          <a href={src} className="text-gold-300 underline">
            Download it
          </a>{' '}
          instead.
        </p>
      </video>

      {enhanced && (
        <>
          {/* Captions, set in the site's type and lifted over the bar. */}
          {showCaptions && cue && (
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-x-0 flex justify-center px-4 text-center transition-[bottom] duration-200',
                barVisible ? 'bottom-20 sm:bottom-24' : 'bottom-3 sm:bottom-8'
              )}
            >
              <p className="max-w-[92%] whitespace-pre-line text-xs font-semibold leading-snug text-bone sm:text-lg lg:text-xl">
                <span className="box-decoration-clone rounded-sm bg-ink/85 px-2 py-0.5">{cue}</span>
              </p>
            </div>
          )}

          {/* Big play button over the poster, and again at the end. */}
          {!started && (
            <button
              type="button"
              onClick={toggle}
              aria-label={`Play video: ${title}`}
              className="group/play absolute inset-0 grid place-items-center bg-ink/20 transition-colors hover:bg-ink/10 focus-visible:outline-none"
            >
              <span
                className={cn(
                  'grid size-16 place-items-center rounded-full bg-crimson text-bone shadow-[0_8px_30px_rgb(0_0_0/0.5)] ring-4 ring-gold/70 transition-transform sm:size-20',
                  'group-hover/play:scale-105 group-hover/play:bg-crimson-600 group-focus-visible/play:ring-gold group-focus-visible/play:ring-offset-4 group-focus-visible/play:ring-offset-ink'
                )}
              >
                <Glyph name="play" className="ml-1 size-7 sm:size-9" />
              </span>
            </button>
          )}

          {/* Control bar. Hidden with opacity, not display, so focus can still reach it and bring it back. */}
          {started && (
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 via-ink/60 to-transparent px-1 pt-4 transition-opacity duration-300 sm:px-3 sm:pb-1 sm:pt-10',
                barVisible ? 'opacity-100' : 'opacity-0 focus-within:opacity-100'
              )}
            >
              <div className="relative mx-3 flex h-5 items-center sm:h-6 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bone/25">
                  <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
                </div>
                <span
                  className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold ring-2 ring-ink"
                  style={{ left: `${progress}%` }}
                  aria-hidden="true"
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={time}
                  onChange={(e) => {
                    const el = video.current;
                    if (el) el.currentTime = Number(e.currentTarget.value);
                  }}
                  aria-label="Seek"
                  aria-valuetext={`${clock(time)} of ${clock(duration)}`}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <div className="flex items-center gap-1">
                <ControlButton label={playing ? 'Pause' : 'Play'} onClick={toggle}>
                  <Glyph name={playing ? 'pause' : 'play'} />
                </ControlButton>
                <span className="px-1 text-xs font-semibold tabular-nums tracking-wide text-bone sm:text-sm">
                  {clock(time)} <span className="text-bone-muted">/ {clock(duration)}</span>
                </span>
                <span className="flex-1" />
                <ControlButton label={muted ? 'Unmute' : 'Mute'} onClick={toggleMute}>
                  <Glyph name={muted ? 'volume-off' : 'volume'} />
                </ControlButton>
                {captions && (
                  <ControlButton label="Captions" pressed={showCaptions} onClick={() => setShowCaptions((on) => !on)}>
                    <Glyph name="captions" />
                  </ControlButton>
                )}
                <ControlButton label={fullscreen ? 'Exit full screen' : 'Full screen'} onClick={toggleFullscreen}>
                  <Glyph name={fullscreen ? 'fullscreen-exit' : 'fullscreen'} />
                </ControlButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
