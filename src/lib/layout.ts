/**
 * The page frame. On screens wider than FRAME_MAX the whole site (nav,
 * content, footer) sits in a centred box this wide, and the gutters show the
 * textured "surround" (`.site-surround` / `.site-frame` in global.css, which
 * repeats this number: keep them in sync). Full-bleed blocks bleed to the
 * frame's edges, not the screen's.
 *
 * 1600px clears every common laptop (1280–1536) so they never see the frame,
 * and stops photos and long lines stretching across 1920+ monitors.
 */
export const FRAME_MAX = 1600;

/** `sizes` for a full-bleed image: the frame width, never wider. */
export const FULL_BLEED_SIZES = `(min-width: ${FRAME_MAX}px) ${FRAME_MAX}px, 100vw`;

/**
 * WebP quality for large photos, a little under the encoder default (80).
 * Don't go much lower: at 65 the red jersey lettering and artwork visibly
 * smear, because WebP stores colour detail at half resolution.
 */
export const PHOTO_QUALITY = 75;
