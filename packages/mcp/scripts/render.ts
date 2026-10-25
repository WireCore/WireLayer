// Renders the collected component API (packages/mcp/data/components.json) as text for AI assistants (llmstxt.org):
//   llmsIndex/llmsFull           the combined files of the docs Storybook (React and Vue side by side, React Native)
//   packageLlms(data, target)    llms.txt and llms-full.txt of one package in its own syntax – written by
//                                scripts/llms.ts (vue, react, native) and by the build of @wirecore/wirelayer-css (cssLlms)
import { importPath, vueEvent, vueName, type Collected, type ComponentInfo, type PropInfo } from '../src/tools.ts';

/** The hosted docs: the composed Storybook with the Vue, React, React Native and HTML Storybooks */
export const STORYBOOK = 'https://wirecore.github.io/WireLayer/';

/** Removes MDX imports and blocks – lines inside fenced code blocks stay as they are */
export function stripMdx(text: string) {
    let fence = false;
    return text
        .split('\n')
        .filter((line) => {
            if (/^\s*(```|~~~)/.test(line)) fence = !fence;
            return fence || !/^import |^<Meta|^<\w+ ?\/>$/.test(line);
        })
        .join('\n');
}

/** Drops empty lines that follow another empty line (left by optional entries) */
const tidy = (lines: string[]) => lines.filter((line, index) => line !== '' || lines[index - 1] !== '').join('\n');
const cell = (text: string) => text.replaceAll('|', '\\|');
const mcpHint =
    'MCP server for AI assistants: `npx -y -p @wirecore/wirelayer-mcp wirelayer-mcp` (tools list_components, get_component, search_components, get_guide).';

export function componentText(component: ComponentInfo, storybook = '') {
    const names = component.props.map((prop) => prop.name);
    const lines = [
        `### ${component.name}`,
        '',
        component.description || '(no description)',
        '',
        `- Import: \`import { ${component.name} } from '${importPath(component, 'react')}'\` · Vue: \`${importPath(component, 'vue')}\``,
        component.category ? `- Category: ${component.category}` : '',
        component.story ? `- Story: ${storybook}?path=/story/react_${component.story}` : '',
        component.extends ? `- Also takes: ${component.extends}` : '',
        '',
        '| Prop (React) | Vue | Type | Description |',
        '| --- | --- | --- | --- |',
        ...component.props.map(
            (prop) =>
                `| ${prop.name}${prop.optional ? '?' : ''} | ${vueName(prop.name, names)} | \`${prop.type.replaceAll('|', '\\|')}\` | ${prop.description.replaceAll('|', '\\|')} |`
        ),
    ];
    return lines.filter((line, index) => line !== '' || lines[index - 1] !== '').join('\n');
}

/** One React Native component: import from @wirecore/wirelayer-native, the props as they are (no Vue names) */
export function nativeComponentText(component: ComponentInfo, storybook = '') {
    const lines = [
        `### ${component.name} (React Native)`,
        '',
        component.description || '(no description)',
        '',
        `- Import: \`import { ${component.name} } from '@wirecore/wirelayer-native${component.subpath}'\``,
        component.category ? `- Category: ${component.category}` : '',
        component.story ? `- Story: ${storybook}?path=/story/native_${component.story}` : '',
        component.extends ? `- Also takes: ${component.extends}` : '',
        '',
        '| Prop | Type | Description |',
        '| --- | --- | --- |',
        ...component.props.map(
            (prop) =>
                `| ${prop.name}${prop.optional ? '?' : ''} | \`${prop.type.replaceAll('|', '\\|')}\` | ${prop.description.replaceAll('|', '\\|')} |`
        ),
    ];
    return lines.filter((line, index) => line !== '' || lines[index - 1] !== '').join('\n');
}

const nativeIntro =
    'React Native (Expo) components with Uniwind: same prop names and values as the React components where they fit on a phone – pickers open as bottom sheets, touch targets are at least 44 pt, no hover, gestures always with accessibility actions. Forms with TanStack Form via `@wirecore/wirelayer-native/form`; DataTable (no TanStack; table or cards per row) via `@wirecore/wirelayer-native/data-table`; charts drawn with react-native-svg (no Chart.js) via `@wirecore/wirelayer-native/chart`; PdfViewer on react-native-pdf (development build, not Expo Go) via `@wirecore/wirelayer-native/pdf`; CodeHighlight with Shiki via `@wirecore/wirelayer-native/code`; file pickers via `@wirecore/wirelayer-native/expo-document-picker` and `@wirecore/wirelayer-native/expo-image-picker`, `useClipboard` via `@wirecore/wirelayer-native/expo-clipboard`, `shareFile`/`shareUri` (DataTable export, PDFs) via `@wirecore/wirelayer-native/expo-sharing` (optional peer dependencies). Overlays: Dialog, Drawer (from every edge), Menu and ContextMenu as sheets, Popover next to its trigger; `toast()`, `confirm()`, `prompt()` and `openDialog()` need `<Toaster />`, `<ConfirmDialog />` and `<DialogHost />` once at the root.';

const intro =
    'WireLayer: a component library for Vue 3 (@wirecore/wirelayer-vue), React (@wirecore/wirelayer-react), React Native (@wirecore/wirelayer-native) and plain HTML (@wirecore/wirelayer-css). Vue and React share the same API and DOM; Tailwind CSS v4 recipes in @wirecore/wirelayer-recipes; WCAG 2.2 AA; English UI texts by default, German and other languages via LocaleProvider.';
const conventions = [
    '## Conventions',
    '',
    '- React props in camelCase; Vue takes the same props in kebab-case. Controlled values: React `value` + `onValueChange`, Vue `v-model`; other `onXChange` pairs are `v-model:x` in Vue, other callbacks `@x` events.',
    '- `className` (React) is `class` (Vue). Every component takes `classes` (extra Tailwind classes per part) and reads defaults from `RecipesProvider`.',
    '- Content: React props of type ReactNode/render functions are named slots in Vue (e.g. DataTable `cell` → `#cell-<id>`, `expansion` → `#expansion`).',
    "- DataTable feature modules in `features` (only these end up in the bundle): `virtualRows` from `@wirecore/wirelayer-react/virtual` for `virtual`; `dateInput` and `numberInput` from `@wirecore/wirelayer-react/data-table` for DatePicker/NumberInput in date and number filters and editors (without them: the browser's inputs). Vue: the same from `@wirecore/wirelayer-vue/…`.",
    '- Texts come from `LocaleProvider` (en-US built in; de, fr, es, it, pt, pt-BR, nl, pl, cs, hu, lv, ar, tr via `registerLocale(\'fr\', fr)` with `fr` from `@wirecore/wirelayer-vue/locales/fr` or `@wirecore/wirelayer-react/locales/fr`); dates are ISO strings ("2026-10-20", "2026-10-20T10:00").',
].join('\n');

export function llmsIndex(data: Collected, storybook = '') {
    const byCategory = new Map<string, ComponentInfo[]>();
    for (const component of data.components) {
        const list = byCategory.get(component.category || 'Other') ?? [];
        list.push(component);
        byCategory.set(component.category || 'Other', list);
    }
    return [
        '# WireLayer',
        '',
        `> ${intro}`,
        '',
        'Full API in llms-full.txt; MCP server: `npx -y -p @wirecore/wirelayer-mcp wirelayer-mcp` (tools list_components, get_component, search_components, get_guide).',
        '',
        conventions,
        '',
        ...[...byCategory].flatMap(([category, components]) => [
            `## ${category}`,
            '',
            ...components.map(
                (component) =>
                    `- ${component.story ? `[${component.name}](${storybook}?path=/story/react_${component.story})` : component.name}: ${component.description || '–'} (\`${importPath(component, 'react')}\`)`
            ),
            '',
        ]),
        '## React Native (@wirecore/wirelayer-native)',
        '',
        nativeIntro,
        '',
        ...(data.native?.components ?? []).map(
            (component) =>
                `- ${component.story ? `[${component.name}](${storybook}?path=/story/native_${component.story})` : component.name}: ${component.description || '–'} (\`@wirecore/wirelayer-native${component.subpath}\`)`
        ),
        '',
        '## Guides',
        '',
        ...data.guides.map((guide) => `- ${guide.title} (${guide.id})`),
        '',
    ].join('\n');
}

export function llmsFull(data: Collected, storybook = '') {
    return [
        '# WireLayer – full API',
        '',
        `> ${intro}`,
        '',
        conventions,
        '',
        '## Components',
        '',
        ...data.components.map((component) => `${componentText(component, storybook)}\n`),
        '## Functions and hooks',
        '',
        ...data.functions.map(
            (fn) => `- \`${fn.name}\` (\`@wirecore/wirelayer-react${fn.subpath}\`): ${fn.description || '–'}`
        ),
        '',
        '## React Native components (@wirecore/wirelayer-native)',
        '',
        nativeIntro,
        '',
        ...(data.native?.components ?? []).map((component) => `${nativeComponentText(component, storybook)}\n`),
        '## React Native functions and hooks',
        '',
        ...(data.native?.functions ?? []).map(
            (fn) => `- \`${fn.name}\` (\`@wirecore/wirelayer-native${fn.subpath}\`): ${fn.description || '–'}`
        ),
        '',
        '## Guides',
        '',
        ...data.guides.map((guide) => `### ${guide.title}\n\n${guide.text}\n`),
    ].join('\n');
}

export type PackageTarget = 'vue' | 'react' | 'native';

const packageNames: Record<PackageTarget, string> = {
    vue: '@wirecore/wirelayer-vue',
    react: '@wirecore/wirelayer-react',
    native: '@wirecore/wirelayer-native',
};
const titles: Record<PackageTarget, string> = { vue: 'Vue 3', react: 'React', native: 'React Native' };

const reactConventions = [
    '## Conventions',
    '',
    '- Controlled values: `value` + `onValueChange`; other controlled props come as `x` + `onXChange`. Every component takes `className` and `classes` (extra Tailwind classes per part) and reads defaults from `RecipesProvider`.',
    '- Content: props of type ReactNode and render functions (e.g. DataTable `cell`, `expansion`, Select `renderItem`).',
    "- DataTable feature modules in `features` (only these end up in the bundle): `virtualRows` from `@wirecore/wirelayer-react/virtual` for `virtual`; `dateInput` and `numberInput` from `@wirecore/wirelayer-react/data-table` for DatePicker/NumberInput in date and number filters and editors (without them: the browser's inputs).",
    '- Texts come from `LocaleProvider` (en-US built in; de, fr, es, it, pt, pt-BR, nl, pl, cs, hu, lv, ar, tr via `registerLocale(\'fr\', fr)` with `fr` from `@wirecore/wirelayer-react/locales/fr`); dates are ISO strings ("2026-10-20", "2026-10-20T10:00").',
].join('\n');

const vueConventions = [
    '## Conventions',
    '',
    '- Props in kebab-case in templates. Controlled values with `v-model` (`modelValue`), further ones with `v-model:<name>`; the events and slots of each component are listed with it.',
    '- `class` goes to the root element. Every component takes `classes` (extra Tailwind classes per part) and reads defaults from `RecipesProvider`.',
    "- DataTable feature modules in `features` (only these end up in the bundle): `virtualRows` from `@wirecore/wirelayer-vue/virtual` for `virtual`; `dateInput` and `numberInput` from `@wirecore/wirelayer-vue/data-table` for DatePicker/NumberInput in date and number filters and editors (without them: the browser's inputs).",
    '- Texts come from `LocaleProvider` (en-US built in; de, fr, es, it, pt, pt-BR, nl, pl, cs, hu, lv, ar, tr via `registerLocale(\'fr\', fr)` with `fr` from `@wirecore/wirelayer-vue/locales/fr`); dates are ISO strings ("2026-10-20", "2026-10-20T10:00").',
].join('\n');

const storyLink = (target: PackageTarget, component: ComponentInfo) =>
    component.story ? `${STORYBOOK}?path=/story/${target}_${component.story}` : '';

/** React types in the Vue docs: icons and link components are Vue components */
const vueType = (type: string) =>
    type.replace(/\bIconComponent\b/g, 'Component').replace(/\bElementType\b/g, 'Component | string');

/**
 * The props a Vue user sets: React-only ones (children, ref, className) are dropped, as are callbacks and content props
 * the Vue component has as events and slots (listed on their own)
 */
function vueProps(component: ComponentInfo): PropInfo[] {
    const events = !!component.vue?.events.length;
    const slots = !!component.vue?.slots.length;
    return component.props.filter(
        (prop) =>
            !['children', 'ref', 'className'].includes(prop.name) &&
            !(events && /^on[A-Z]/.test(prop.name)) &&
            !(slots && /\bReact(Node|Element)\b/.test(prop.type))
    );
}

/** "Omit<ComponentProps<'button'>, 'type'>" → the element whose attributes fall through, and our own interfaces */
function vueExtends(heritage: string | null) {
    if (!heritage) return '';
    const elements = [...heritage.matchAll(/ComponentProps<'(\w+)'>/g)].map((match) => `<${match[1]}>`);
    const own = heritage
        .replace(/\s+/g, ' ')
        .split(/,(?![^<]*>)/)
        .map((part) => part.trim())
        .filter((part) => part && !part.includes('ComponentProps<'));
    return [
        elements.length ? `- Other attributes go to the root element (${elements.join(', ')})` : '',
        own.length ? `- Also takes the props of: ${own.join(', ')}` : '',
    ]
        .filter(Boolean)
        .join('\n');
}

function vueComponentText(component: ComponentInfo) {
    const props = vueProps(component);
    const names = component.props.map((prop) => prop.name);
    const link = storyLink('vue', component);
    return tidy([
        `### ${component.name}`,
        '',
        component.description || '(no description)',
        '',
        `- Import: \`import { ${component.name} } from '${importPath(component, 'vue')}'\``,
        component.category ? `- Category: ${component.category}` : '',
        link ? `- Example: ${link}` : '',
        vueExtends(component.extends),
        '',
        ...(props.length
            ? [
                  '| Prop | Type | Description |',
                  '| --- | --- | --- |',
                  ...props.map(
                      (prop) =>
                          `| ${vueName(prop.name, names).replace(/^\S+/, (name) => (prop.optional ? `${name}?` : name))} | \`${cell(vueType(prop.type))}\` | ${cell(prop.description)} |`
                  ),
                  '',
              ]
            : []),
        ...(component.vue?.events.length
            ? [
                  '| Event | Payload | Description |',
                  '| --- | --- | --- |',
                  ...component.vue.events.map(
                      (event) =>
                          `| ${vueEvent(event.name)} | ${event.payload ? `\`${cell(event.payload)}\`` : '–'} | ${cell(event.description)} |`
                  ),
                  '',
              ]
            : []),
        ...(component.vue?.slots.length
            ? [
                  '| Slot | Slot props | Description |',
                  '| --- | --- | --- |',
                  ...component.vue.slots.map(
                      (slot) =>
                          `| #${slot.name} | ${slot.props ? `\`${cell(slot.props)}\`` : '–'} | ${cell(slot.description)} |`
                  ),
              ]
            : []),
    ]);
}

function reactComponentText(component: ComponentInfo) {
    const link = storyLink('react', component);
    return tidy([
        `### ${component.name}`,
        '',
        component.description || '(no description)',
        '',
        `- Import: \`import { ${component.name} } from '${importPath(component, 'react')}'\``,
        component.category ? `- Category: ${component.category}` : '',
        link ? `- Example: ${link}` : '',
        component.extends ? `- Also takes: ${component.extends.replace(/\s+/g, ' ')}` : '',
        '',
        '| Prop | Type | Description |',
        '| --- | --- | --- |',
        ...component.props.map(
            (prop) => `| ${prop.name}${prop.optional ? '?' : ''} | \`${cell(prop.type)}\` | ${cell(prop.description)} |`
        ),
    ]);
}

const packageIntro = (target: PackageTarget) =>
    target === 'native'
        ? nativeIntro
        : `WireLayer for ${titles[target]}: accessible components (WCAG 2.2 AA) on Ark UI and Tailwind CSS v4, with the same API and DOM in Vue and React. Install \`${packageNames[target]}\` and import \`${packageNames[target]}/styles.css\` after \`tailwindcss\`; English UI texts by default, other languages via LocaleProvider.`;

/** llms.txt and llms-full.txt of a component package (Vue, React or React Native) in that package's own syntax */
export function packageLlms(data: Collected, target: PackageTarget) {
    const name = packageNames[target];
    const components = target === 'native' ? (data.native?.components ?? []) : data.components;
    const functions =
        target === 'native'
            ? (data.native?.functions ?? [])
            : target === 'vue'
              ? (data.vue?.functions ?? [])
              : data.functions;
    // Blocks come from their own package (@wirecore/wirelayer-blocks-vue …) – named in the import line
    const importOf = (component: ComponentInfo) =>
        target === 'native' ? `${name}${component.subpath}` : importPath(component, target);
    const conventions = target === 'vue' ? vueConventions : target === 'react' ? reactConventions : '';
    const text =
        target === 'vue'
            ? vueComponentText
            : target === 'react'
              ? reactComponentText
              : (component: ComponentInfo) => nativeComponentText(component, STORYBOOK);

    const byCategory = new Map<string, ComponentInfo[]>();
    for (const component of components) {
        const list = byCategory.get(component.category || 'Other') ?? [];
        list.push(component);
        byCategory.set(component.category || 'Other', list);
    }
    const index = tidy([
        `# WireLayer for ${titles[target]} (${name})`,
        '',
        `> ${packageIntro(target)}`,
        '',
        `Full API (props, events, slots, examples) in llms-full.txt next to this file. ${mcpHint} Docs: ${STORYBOOK}`,
        '',
        conventions,
        '',
        ...[...byCategory].flatMap(([category, list]) => [
            `## ${category}`,
            '',
            ...list.map((component) => {
                const link = storyLink(target, component);
                return `- ${link ? `[${component.name}](${link})` : component.name}: ${component.description || '–'} (\`${importOf(component)}\`)`;
            }),
            '',
        ]),
        '## Guides (in llms-full.txt)',
        '',
        ...data.guides.map((guide) => `- ${guide.title}`),
        '',
    ]);
    const full = [
        `# WireLayer for ${titles[target]} (${name}) – full API`,
        '',
        `> ${packageIntro(target)}`,
        '',
        conventions,
        '',
        '## Components',
        '',
        ...components.map((component) => `${text(component)}\n`),
        '## Functions and composables',
        '',
        ...functions.map((fn) => `- \`${fn.name}\` (\`${name}${fn.subpath}\`): ${fn.description || '–'}`),
        '',
        '## Guides',
        '',
        ...data.guides.map((guide) => `### ${guide.title}\n\n${guide.text}\n`),
    ].join('\n');
    return { index, full };
}

/** One recipe of @wirecore/wirelayer-css as classes: the block, its parts and the modifiers of its variants */
export interface CssClassReference {
    name: string;
    base: string;
    slots: { slot: string; class: string }[];
    variants: { variant: string; values: { value: string; class: string; default: boolean }[] }[];
}

/** llms.txt and llms-full.txt of @wirecore/wirelayer-css: the class reference and the guide for HTML */
export function cssLlms(classes: CssClassReference[], guide: string, data: Collected) {
    const name = '@wirecore/wirelayer-css';
    const intro =
        'WireLayer for plain HTML and server templates: `.wc-*` classes generated from the same recipes as the Vue and React components – for everything that works without JavaScript. Use `@wirecore/wirelayer-css/wirecore.css` (standalone) or, with an own Tailwind v4 build, `@wirecore/wirelayer-tokens/theme.css` + `@wirecore/wirelayer-css/components.css`. Interactive components (menus, dialogs with focus handling, comboboxes) need @wirecore/wirelayer-vue or @wirecore/wirelayer-react.';
    const scheme =
        'Class scheme: `.wc-<component>` on the root, `.wc-<component>-<part>` on its parts, modifiers `.wc-<component>-<value>` (e.g. `.wc-button-danger`, `.wc-button-sm`) and `.wc-<component>-<flag>` for on/off variants (e.g. `.wc-card-interactive`) next to the root class. A modifier applies to the element that carries it and to all parts inside; default values need no class. ARIA attributes and roles are up to the markup.';
    const index = tidy([
        `# WireLayer for HTML (${name})`,
        '',
        `> ${intro}`,
        '',
        `Class reference (parts and modifiers of every component) and the HTML guide in llms-full.txt next to this file. ${mcpHint} HTML examples: ${STORYBOOK} (HTML / CSS)`,
        '',
        scheme,
        '',
        '## Components',
        '',
        ...classes.map(
            (recipe) =>
                `- \`.${recipe.base}\`${recipe.slots.length ? ` (parts: ${recipe.slots.map((slot) => `.${slot.class}`).join(', ')})` : ''}`
        ),
        '',
    ]);
    const full = [
        `# WireLayer for HTML (${name}) – class reference`,
        '',
        `> ${intro}`,
        '',
        scheme,
        '',
        '## Components',
        '',
        ...classes.map((recipe) =>
            tidy([
                `### .${recipe.base}`,
                '',
                ...recipe.slots.map((slot) => `- Part \`${slot.slot}\`: \`.${slot.class}\``),
                ...recipe.variants.map(
                    (variant) =>
                        `- ${variant.variant}: ${variant.values
                            .map((value) => `\`.${value.class}\`${value.default ? ' (default, no class needed)' : ''}`)
                            .join(', ')}`
                ),
                '',
            ])
        ),
        '## Guide: HTML and server templates',
        '',
        guide.trim(),
        '',
        ...data.guides
            .filter((entry) => /html|server/i.test(entry.title))
            .map((entry) => `### ${entry.title}\n\n${entry.text}\n`),
    ].join('\n');
    return { index, full };
}
