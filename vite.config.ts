/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'node:fs';
import path from 'node:path';

/* WS8: public/sw.js lands in dist/ with its __BUILD_ID__ token unfilled.
   Stamp it with a per-build id (bare token — sw.js itself applies the
   `forge-` cache prefix), plus the full /assets/ manifest so install
   precaches every hashed chunk, making offline robust immediately after
   a version-upgrade (activate() prunes the previous generation). */
function stampSwVersion(): Plugin {
  return {
    name: 'forge-stamp-sw-version',
    apply: 'build',
    closeBundle() {
      const sw = path.resolve(__dirname, 'dist/sw.js');
      if (!fs.existsSync(sw)) return;
      const id = Date.now().toString(36);
      const assetDir = path.resolve(__dirname, 'dist/assets');
      const assets = fs.existsSync(assetDir)
        ? fs
            .readdirSync(assetDir)
            .filter((f) => fs.statSync(path.join(assetDir, f)).isFile())
            .map((f) => `/assets/${f}`)
        : [];
      fs.writeFileSync(
        sw,
        fs
          .readFileSync(sw, 'utf8')
          .replaceAll('__BUILD_ID__', id)
          .replaceAll('__PRECACHE_ASSETS__', JSON.stringify(assets, null, 2)),
      );
    },
  };
}

// `--mode single` produces a self-contained dist/index.html (used for
// sandboxed visual debugging without a dev server). Normal builds are standard.
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react(), tailwindcss(), stampSwVersion(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
}));
