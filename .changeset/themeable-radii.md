---
'@wirecore/wirelayer-tokens': minor
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
---

Corners that stayed rounded in a square theme now follow a variable; without a theme everything looks as before:

- New theme variable `--radius-dialog` (14px, `rounded-dialog`): Dialog, ConfirmDialog, CommandPalette and the
  fullscreen view of Gallery and Image – also in React Native.
- New `--wc-dialog-icon-radius` (10px): the icon box in the header of a Dialog (web and React Native).
- New `--wc-avatar-radius`: Avatar with `shape="square"`, one value for all sizes (defaults by size as before, web and
  React Native).
- New `--wc-checkbox-radius` (5px, 4px in lists): Checkbox, SelectionCard `type="checkbox"` (web and React Native) and
  the check boxes in Listbox, MultiSelect and Tree.
- `--wc-control-radius-sm`/`-md`/`-lg` now also apply to TreeSelect, CascadeSelect, the TimeGrid slots and (`-lg`) the
  drop outline of OrderList and PickList.
- React Native reads `--wc-control-radius-sm`/`-md`/`-lg` as well: Input, Textarea, Select, DurationInput, TagsInput and
  the TimeGrid slots (`-md` in every size, as before 8px).

_Theming › Themes › Square corners_ lists every variable a theme sets to 0 for square corners.
