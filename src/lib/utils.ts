import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * `cn` — the class merger shadcn/ui components expect. `clsx` resolves
 * conditionals, `twMerge` makes the LAST conflicting Tailwind utility win, so
 * a caller's `className` can override a component's defaults instead of
 * fighting them in the cascade.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
