---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-recipes': minor
---

Fix: `linkAs` works with routers that need `to` – vue-router's `RouterLink`, React Router and TanStack Router `Link`.
Menu, ContextMenu and Menubar items, BottomNavigation items and the MegaMenu links take `to` (a path or a route object);
the link component then gets `to` instead of `href`. Without `to` nothing changes (`href` for NuxtLink, Next.js Link
or `<a>`). MegaMenu also has `moreTo` and `allTo` for its "Show all" links; `href` still identifies a link for
`currentHref`. Recipes: `linkTarget(href, to)` and the type `LinkTo`.
