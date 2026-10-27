---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

Smaller additions, the defaults stay:

- Slider `hideLabel`: the label is for screen readers only – it still names the thumbs; without `showValue` the header
  takes no room (also in React Native, where the thumbs keep the label as their name)
- Carousel `controlsPosition: 'bottom' | 'sides'` (default `bottom`): with `sides` previous and next sit beside the
  slides, vertically centred; autoplay and dots stay below
- Tooltip `closeOnScroll` (default `true`, as before): `false` keeps it open while the page or a container around the
  trigger scrolls
