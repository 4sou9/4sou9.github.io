// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// GitHub Pages user site (served from the repo root domain).
// build.format:'file' emits husk.html / scar.html / ... so the existing
// hidden-gate links (href="husk.html") and relative `assets/...` paths keep working.
export default defineConfig({
  site: 'https://4sou9.github.io',
  build: {
    format: 'file',
  },
  // Pages rely on literal newlines inside white-space:pre blocks (ASCII art),
  // so leave HTML untouched at build time.
  compressHTML: false,
});
