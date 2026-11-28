---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-css': patch
---

Focus ring visible again in 22 parts: with Tailwind v4, `outline-none` sets `--tw-outline-style: none`, and the
`focus-visible:outline-2` ring took that style – active but invisible (WCAG 2.4.7). The redundant `outline-none` is gone
where a part draws its own focus ring: SidebarNav links, Stepper, Menubar, menu search, Gantt rows, CodeTabs,
CodeHighlight, Editor source, ScrollPanel, LogViewer, JsonViewer, ChatMessages, PdfViewer, FloatingPanel, ImageCropper,
AngleSlider, Knob, ColorPicker, SpeedDial and the form error summary. A test keeps it so.
