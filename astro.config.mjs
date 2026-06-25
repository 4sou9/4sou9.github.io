// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// GitHub Pages user site (served from the repo root domain).
// build.format:'directory' emits husk/index.html etc so URLs are /husk/ instead of /husk.html.
// Because pages now live one level deep, all internal paths are absolute (/assets/..., /husk/).
export default defineConfig({
  site: 'https://4sou9.github.io',
  build: {
    format: 'directory',
  },
  trailingSlash: 'always',
  // Pages rely on literal newlines inside white-space:pre blocks (ASCII art),
  // so leave HTML untouched at build time.
  compressHTML: false,
});
