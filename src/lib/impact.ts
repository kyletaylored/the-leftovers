/**
 * ImpactBand's option logic, shared by the component (build time) and the
 * /design playground (in the browser), so the playground can never drift
 * from what the component renders. No imports: safe in both.
 */
export type ImpactAlign = 'left' | 'right';
export type ImpactWash = 'fade' | 'none';

/**
 * CSS variables for `shift` (-30..30, % of the band, negative = left).
 *
 * Moving the photo AWAY from the copy on a washed band just slides it: the
 * strip it uncovers is on the copy side, which the solid wash covers anyway,
 * so there's no zoom and no extra crop. Any other case (wash="none", or
 * moving toward the copy) would expose a bare edge, so the photo layer widens
 * toward the far side by twice the offset instead: the centre still moves by
 * `shift`, at the cost of cropping a little more top and bottom.
 */
export function impactShiftVars(shift: number, align: ImpactAlign, wash: ImpactWash): Record<string, string> {
  const s = Math.max(-30, Math.min(30, Math.round(shift)));
  if (!s) return { '--impact-x': '0%', '--impact-l': '0%', '--impact-r': '0%' };
  const away = align === 'right' ? s < 0 : s > 0;
  if (wash === 'fade' && away) return { '--impact-x': `${s}%`, '--impact-l': '0%', '--impact-r': '0%' };
  return { '--impact-x': '0%', '--impact-l': `${s < 0 ? 2 * s : 0}%`, '--impact-r': `${s > 0 ? -2 * s : 0}%` };
}

export const toStyle = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
