---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-blocks-vue': minor
'@wirecore/wirelayer-blocks-react': minor
---

Smaller CSS for apps that use only a few components (opt-in, `styles.css` is unchanged): `styles-core.css` brings the
theme and the fonts without the classes of the components, which an app then imports per component it uses –
`@wirecore/wirelayer-vue/sources/Button.css`, `@wirecore/wirelayer-blocks-vue/sources/SiteHeader.css` (also the
React packages) – or per recipe it calls itself: `@wirecore/wirelayer-recipes/sources/card.css`. The file of a component
brings the classes of the components it renders as well. A site with a header, buttons, cards and prose shrinks from
about 184 kB (29 kB gzip) to 47 kB (10 kB gzip). In development the components warn when the classes of a recipe they
render are missing (`checkRecipeSources` in the recipes).
