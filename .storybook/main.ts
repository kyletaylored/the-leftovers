import path from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  async viteFinal(viteConfig) {
    // Same Tailwind v4 Vite plugin astro.config.mjs registers — without it
    // `@import 'tailwindcss'` in global.css is inert and every story renders
    // unstyled.
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    // `@/*` -> `src/*` (tsconfig.json `paths`). Astro resolves this itself
    // for .astro files; plain Vite/Vitest doesn't read tsconfig paths, so
    // every `@/lib/...` import in the React islands needs it spelled out.
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: { ...viteConfig.resolve?.alias, '@': path.resolve(import.meta.dirname, '../src') },
    };
    // tsconfig.json extends `astro/tsconfigs/strict`, which sets
    // `jsx: "preserve"` for Astro's own compiler. Vite's esbuild transform
    // reads that same tsconfig and, left alone, leaves JSX untransformed in
    // the React islands' .tsx files — breaking import analysis. Force the
    // normal esbuild JSX transform for Storybook/Vitest regardless.
    viteConfig.esbuild = { ...viteConfig.esbuild, jsx: 'automatic' };
    return viteConfig;
  },
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite"
};
export default config;