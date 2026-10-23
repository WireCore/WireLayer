---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

The types that appear in the props are exported by the component packages themselves, so apps no longer need
`@wirecore/wirelayer-recipes` (or `NonNullable<BadgeProps['variant']>`) for them – e.g. `BadgeVariant`,
`ButtonVariant`, `ButtonSize`, `AlertStatus`, `DialogPosition`, `OverlaySize`, `StatusDotStatus`, `DataSource`,
`RecipeClasses`. `/data-table` adds `PivotValue`, `/virtual` `ItemAccessor`, React Native's `/pdf` `PdfZoom`.
