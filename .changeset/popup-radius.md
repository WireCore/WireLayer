---
'@wirecore/wirelayer-tokens': minor
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-css': minor
---

One corner radius for all floating surfaces: the new token `--radius-popup` (12px, class `rounded-popup`) is used by
Menu, ContextMenu, Menubar menus, the option lists of Select, MultiSelect, Combobox, Autocomplete, TagsInput, Mentions,
CascadeSelect and TreeSelect, Popover, HoverCard, ConfirmPopup, Tour, DatePicker, ColorPicker, the DataTable filter
panel, NavigationMenu, MegaMenu, FloatingPanel and the editor's bubble menu and mention list. Visible change: menus and
option lists go from 10px to 12px (their items from 6px to 8px, so the corners stay concentric), the editor's menus
from 8px to 12px; the panels already had 12px. Tooltip, Toast and Dialog keep their radius. A theme can set
`--radius-popup` to change all of them at once.
