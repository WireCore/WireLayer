---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-recipes': minor
---

PopoverContent: `hideTitle` keeps the title for screen readers only (it still names the panel) and `closable={false}`
drops the close button, e.g. for an app switcher. Popover recipe: variant `hideTitle`. Fix (React): a PopoverContent
without `description` no longer points `aria-describedby` at a description that does not exist.
