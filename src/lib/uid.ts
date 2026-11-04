/**
 * Build-time unique ids for inline SVG <defs> (gradients, clip paths).
 *
 * Two instances of the same motif on one page must not share a gradient or
 * clip-path id, or the second silently renders with the first one's
 * geometry. A module-level counter is deterministic for a given build order,
 * unlike Math.random/crypto, so the static output doesn't churn between
 * builds.
 */
let counter = 0;

export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}
