---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-tokens': patch
'@wirecore/wirelayer-css': minor
---

Component variables for the measures a brand usually changes – set them on `:root`, a `[data-theme]` or any element.
Their defaults are the values the recipes had, nothing looks different without them:

- `--wc-control-h-sm` / `-md` / `-lg` (2rem / 2.5rem / 3rem): height of buttons, icon buttons and fields per size
- `--wc-control-radius-sm` / `-md` / `-lg` (6px / 8px / 10px) and `--wc-control-text-sm` / `-md` / `-lg` (13px / 15px /
  16px): corners and text of the fields (Input, Textarea, NativeSelect, Select, MultiSelect, Combobox, NumberInput,
  PasswordInput, the date and time fields, ColorPicker, TagsInput)
- `--wc-button-radius` (8px): Button and IconButton with `shape="rounded"`
- `--wc-card-p` (1.5rem): padding of Card
- `--wc-backdrop` (`rgb(0 0 0 / 0.6)`): dimming behind Dialog, Drawer and ConfirmDialog

The recipes use the variables instead of fixed classes (`h-10` is now `h-[var(--wc-control-h-md,2.5rem)]`) – selectors
on the old class names (`[&.h-10]:…`) no longer match; use `variants` in `RecipesProvider` instead.

Fix: `--radius-card`, `--radius-panel` and `--radius-popup` were compiled into the utilities (`@theme inline`), so a
theme could not change them at runtime. The utilities now read the variables; the values stay the same.
