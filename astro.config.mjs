// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// GitHub Pages user site (served from the repo root domain).
// build.format:'file' emits husk.html etc; GitHub Pages serves it at /husk (no trailing slash).
// All internal paths are absolute (/assets/..., /husk).
export default defineConfig({
  site: 'https://4sou9.github.io',
  build: {
    format: 'file',
  },
  trailingSlash: 'never',
  // Pages rely on literal newlines inside white-space:pre blocks (ASCII art),
  // so leave HTML untouched at build time.
  compressHTML: false,
});
