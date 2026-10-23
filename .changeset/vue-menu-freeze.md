---
'@wirecore/wirelayer-vue': patch
---

Menus with submenus, Menubar and CascadeSelect no longer freeze in production builds: positioning options are no
longer passed to Ark as a new object on every render.
