---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

Smaller CSS without listing files by hand: the Vite plugin `wirelayer()` from `@wirecore/wirelayer-recipes/vite` reads
the imports from `@wirecore/wirelayer-*` in an app's source files (Vue, React, Astro, MDX …) and adds the sources files
of the imported components and recipes to the CSS file that imports `theme.css` or `styles-core.css` – in development
again when an import is added. Put it before Tailwind's plugin; works with Nuxt and Astro (`vite.plugins`). `vite` is an
optional peer dependency.

New `@wirecore/wirelayer-vue/theme.css` and `@wirecore/wirelayer-react/theme.css`: the theme without fonts and without
component classes, for an app with its own font (`@theme { --font-sans: … }`) – the WireLayer fonts are no longer
bundled. `fonts.css` brings them separately. `styles.css` and `styles-core.css` stay unchanged.
