import type { Preview } from '@storybook/react-vite'
// The real brand stylesheet (Tailwind v4 tokens, fonts, .field-input/.numeral
// utility classes) — the same file every Astro page imports via
// BaseLayout.astro. Stories render with the actual design tokens, not a
// Storybook-only approximation.
import '../src/styles/global.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;