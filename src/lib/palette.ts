/**
 * The brand palette as data: one row per `@theme` colour token in
 * src/styles/global.css. The /design page and the Storybook
 * "Foundations/Colors" story both render from this list, so add a row here
 * whenever you add a token.
 *
 * `swatch` is spelled out as a full class name (not built from `name`) so
 * Tailwind's source scan sees it and generates the utility.
 */
export interface PaletteToken {
  name: string;
  hex: string;
  swatch: string;
  role: string;
}

export const palette: PaletteToken[] = [
  { name: 'ink', hex: '#0B0A08', swatch: 'bg-ink', role: 'page base' },
  { name: 'ink-900', hex: '#100E0C', swatch: 'bg-ink-900', role: 'section alt' },
  { name: 'ink-800', hex: '#16130F', swatch: 'bg-ink-800', role: 'card surface' },
  { name: 'ink-700', hex: '#221E18', swatch: 'bg-ink-700', role: 'raised / hover' },
  { name: 'ink-600', hex: '#322C24', swatch: 'bg-ink-600', role: 'hairlines' },
  { name: 'crimson', hex: '#8B1E2B', swatch: 'bg-crimson', role: 'fill only' },
  { name: 'crimson-600', hex: '#A32534', swatch: 'bg-crimson-600', role: 'hover fill' },
  { name: 'crimson-400', hex: '#E06070', swatch: 'bg-crimson-400', role: 'crimson as text' },
  { name: 'brand-red', hex: '#D12026', swatch: 'bg-brand-red', role: 'wordmark only' },
  { name: 'gold', hex: '#C9A227', swatch: 'bg-gold', role: 'accent / stroke' },
  { name: 'gold-300', hex: '#E0C164', swatch: 'bg-gold-300', role: 'gold as text' },
  { name: 'gold-700', hex: '#8F721A', swatch: 'bg-gold-700', role: 'gradient shade' },
  { name: 'forest', hex: '#2E4A34', swatch: 'bg-forest', role: 'mountain fill' },
  { name: 'forest-600', hex: '#3A5C41', swatch: 'bg-forest-600', role: 'fill edge' },
  { name: 'tan', hex: '#5C4A34', swatch: 'bg-tan', role: 'earth accent' },
  { name: 'bone', hex: '#F4F1EA', swatch: 'bg-bone', role: 'text on dark' },
  { name: 'bone-muted', hex: '#B9B2A4', swatch: 'bg-bone-muted', role: 'secondary text' },
];
