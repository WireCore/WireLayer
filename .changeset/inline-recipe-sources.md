---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
'@wirecore/wirelayer-blocks-vue': patch
'@wirecore/wirelayer-blocks-react': patch
---

Fix: the sources files of `styles-core.css` brought the classes of all recipes with automatic source detection
(`@import 'tailwindcss'`) – Tailwind scans the whole folder of a file that an `@source` in `node_modules` points to,
and the class lists of all recipes were files in one folder. `sources/<recipe>.css` now contains the classes as
`@source inline()`; the imports stay the same. Tailwind CSS 4.1 or newer is required (`@source inline()`, and
`@source not`, which `styles.css` already used): the peer dependency is now `^4.1.0`.
