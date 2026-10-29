---
'@wirecore/wirelayer-recipes': patch
---

Vite plugin: a component imported for the first time while `vite dev` runs gets its classes right away. The plugin added
its sources file to the CSS, but Tailwind's Vite plugin only builds a CSS file again when a file it imports changes on
disk – the classes were missing until a restart (cards without padding, tiny avatars). In the dev server the imports now
live in a file in Vite's cache folder; the build is unchanged.
