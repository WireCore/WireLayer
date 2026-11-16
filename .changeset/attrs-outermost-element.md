---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
'@wirecore/wirelayer-mcp': patch
---

Extra attributes and listeners (`data-*`, `id`, `title`, `aria-describedby` …) now land on the outermost element of
these components – before, Vue passed on only `class` and `style`, and the React props did not take them:
AngleSlider, BarChart, BlockUi, Calendar, Carousel, CascadeSelect, Chart, ColorPicker, CompositeChart, CopyButton,
DataView, Editor, Fieldset, Gallery, JsonViewer, Knob, LineChart, Listbox, LogViewer, MeterGroup, NavigationMenu,
NotificationCenter (Vue), OrderList, OrgChart, Panel, PickList, PieChart, PinInput, ProgressCircle, Rating,
ScrollPanel, SidebarNav, SignaturePad, Sortable, SpeedDial (its button), SplitButton, Splitter, Spoiler, Stepper,
TableOfContents, Timeline, Toolbar, Tree, TreeSelect, VirtualTree and WaterfallChart. A `Tour` step or a test can
target them by e.g. `data-tour` without a wrapper element.

- `aria-label` still names what it labels, not the outer element: the list of Sortable and Listbox, the tree of Tree,
  VirtualTree and JsonViewer, the dial of Knob, the field of CascadeSelect, TreeSelect, ColorPicker, PinInput and
  Editor.
- An `id` on a component built on an Ark root (e.g. Carousel, Stepper, Tree) becomes that root's id, so Ark keeps
  finding it. A control's own `id` prop is unchanged; Fieldset takes `id` as the base of its legend's and texts' ids.
