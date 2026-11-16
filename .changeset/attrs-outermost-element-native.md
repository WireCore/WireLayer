---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
'@wirecore/wirelayer-native': patch
---

More components pass extra attributes on:

- ScrollTop (its button, now also `style`), Sparkline and VirtualList take them on their outermost element in Vue and
  React.
- React: a `onKeyDown` given to JsonViewer or a feed Timeline, or a `onKeyDownCapture` given to Tree or VirtualTree,
  runs as well instead of being replaced by the component's own (as in Vue).
- React Native: Carousel, DataView, Listbox, MeterGroup, OrderList, OrgChart, PickList, PinInput, Rating,
  SignaturePad, Sortable, Stepper and VirtualList take the view props (`testID`, `nativeID`, accessibility props …)
  on their outermost view, like Panel or Timeline already did.
