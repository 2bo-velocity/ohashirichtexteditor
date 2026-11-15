import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The package's own name. The adapters import the core through it (see
// resources/js/adapters/*.ts), so it is external in the build and aliased to
// the source in tests.
const SELF = '@2bo-velocity/ohashirichtexteditor';

// Three entry points, one rule: the core bundle is fully self-contained.
//
//   dist/ohashi-editor.js     the custom element. No dependencies, no globals —
//                             a Blade page loads it with a single <script> tag.
//   dist/adapters/vue.js      thin wrappers for Inertia users. Vue, React and
//   dist/adapters/react.js    the core itself stay external: they resolve in the
//                             host app, so there is exactly one copy of each.
export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    // Note: for ES-format libraries Vite shortens identifiers but keeps
    // whitespace (removing it would also remove the pure annotations bundlers
    // rely on to tree-shake). Served gzipped, the difference is small.
    lib: {
      entry: {
        'ohashi-editor': 'resources/js/index.ts',
        'adapters/vue': 'resources/js/adapters/vue.ts',
        'adapters/react': 'resources/js/adapters/react.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'react', SELF],
      output: {
        // Kept through minification (/*! … */): the ISC licence of the bundled
        // icons requires its notice in copies.
        banner: (chunk) =>
          chunk.name === 'ohashi-editor'
            ? '/*! OhashiRichTextEditor | AGPL-3.0-or-later or commercial licence | Includes Lucide icons (ISC, (c) Lucide Icons and Contributors; parts MIT, (c) Cole Bemis) — see THIRD-PARTY-NOTICES.md */'
            : '',
      },
    },
  },
  resolve: {
    alias: {
      [SELF]: fileURLToPath(new URL('./resources/js/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    // Vitest stubs CSS out by default, which would make the `?inline` import of
    // the shadow-root stylesheet an empty string — and the public --orte-*
    // contract untestable.
    css: true,
    include: ['tests/js/**/*.test.ts'],
  },
});
