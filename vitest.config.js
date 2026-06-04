import { defineConfig } from 'vitest/config'

// Vitest 4 bundles Vite 8, whose bundler/transform pipeline is Rolldown + oxc
// (not esbuild). The legacy Babel-based `@vitejs/plugin-react` sets the now
// deprecated `esbuild` / `optimizeDeps.esbuildOptions` knobs, which produced:
//   "[vite] warning: `esbuild` option was specified ... please use `oxc` instead"
//   "[vite] warning: `optimizeDeps.esbuildOptions` ... use `optimizeDeps.rolldownOptions`"
//
// For the test run we don't need React Fast Refresh — only the JSX transform —
// so we drop the Babel plugin entirely and let Vite 8 transform JSX through its
// native oxc loader with the automatic runtime. No warnings, faster transform.
export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',   // auto-imports react/jsx-runtime — no `import React`
      importSource: 'react',
      development: true,       // keeps __source/__self for friendlier test errors
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: false,
    include: ['tests/**/*.test.{js,jsx}'],
  },
})
