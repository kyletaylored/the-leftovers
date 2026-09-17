/* -------------------------------------------------------------------------
 * Media resolution.
 *
 * Pages CMS writes an image field as a repo path string (e.g.
 * "/src/assets/img/players/22.jpg"). Keeping media under src/assets — rather
 * than public/ — is what lets Astro's <Image> generate responsive srcsets and
 * modern formats, which §10.1/§10.2 make a launch requirement rather than a
 * later cleanup. This maps the CMS's string back to the build-time asset.
 * ---------------------------------------------------------------------- */

const assets = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/img/**/*.{jpeg,jpg,png,webp,avif,svg}'
);

export async function resolveImage(path?: string): Promise<ImageMetadata | undefined> {
  if (!path) return undefined;
  const key = path.startsWith('/') ? path : `/${path}`;
  const loader = assets[key];
  if (!loader) {
    // Loud in dev, non-fatal in prod: a missing photo should never take the
    // whole roster page down right before a tournament.
    console.warn(`[images] no asset found for "${path}" — falling back to the mascot`);
    return undefined;
  }
  return (await loader()).default;
}
