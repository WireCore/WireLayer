---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

SidebarNav: router links like Menu and BottomNavigation – `linkAs` renders the links (RouterLink, NuxtLink, the Link of
React Router or Next.js …) and gets `to` for items with `to`, else `href`. `currentHref` (the item with exactly this
`href`) or `isCurrent` mark the current page with `aria-current="page"` and open its groups; an item's own `current`
still wins.
