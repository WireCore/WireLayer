import {
    ArrowRight as VueArrowRight,
    Bell as VueBell,
    Ellipsis as VueEllipsis,
    Check as VueCheck,
    House as VueHouse,
    Mail as VueMail,
    Plus as VuePlus,
} from '@lucide/vue';
import { act, render as renderReact } from '@testing-library/react';
import { render as renderVue } from '@testing-library/vue';
import * as ReactBlocks from '@wirecore/wirelayer-blocks-react';
import * as VueBlocks from '@wirecore/wirelayer-blocks-vue';
import * as ReactComponents from '@wirecore/wirelayer-react';
import * as ReactChart from '@wirecore/wirelayer-react/chart';
import * as ReactCode from '@wirecore/wirelayer-react/code';
import * as ReactEditor from '@wirecore/wirelayer-react/editor';
import * as ReactPdf from '@wirecore/wirelayer-react/pdf';
import * as ReactDataTable from '@wirecore/wirelayer-react/data-table';
import * as ReactVirtual from '@wirecore/wirelayer-react/virtual';
import * as VueComponents from '@wirecore/wirelayer-vue';
import * as VueChart from '@wirecore/wirelayer-vue/chart';
import * as VueCode from '@wirecore/wirelayer-vue/code';
import * as VueEditor from '@wirecore/wirelayer-vue/editor';
import * as VuePdf from '@wirecore/wirelayer-vue/pdf';
import * as VueDataTable from '@wirecore/wirelayer-vue/data-table';
import * as VueVirtual from '@wirecore/wirelayer-vue/virtual';
import { ArrowRight, Bell, Check, Ellipsis, House, Mail, Plus } from 'lucide-react';
import { createElement, type ReactNode } from 'react';
import { h, nextTick, type Component, type VNode } from 'vue';

export type Framework = 'vue' | 'react';
export const frameworks: Framework[] = ['vue', 'react'];

// Chart's generic props type references Chart.js internals that cannot be named here
const VueLib = {
    ...VueComponents,
    ...VueBlocks,
    ...VueDataTable,
    ...VueVirtual,
    ...VueEditor,
    ...VueCode,
    ...VuePdf,
    Chart: VueChart.Chart as Component,
    Sparkline: VueChart.Sparkline as Component,
    BarChart: VueChart.BarChart as Component,
    LineChart: VueChart.LineChart as Component,
    CompositeChart: VueChart.CompositeChart as Component,
    WaterfallChart: VueChart.WaterfallChart as Component,
    PieChart: VueChart.PieChart as Component,
};
const ReactLib = {
    ...ReactComponents,
    ...ReactBlocks,
    ...ReactDataTable,
    ...ReactVirtual,
    ...ReactChart,
    ...ReactEditor,
    ...ReactCode,
    ...ReactPdf,
};
type ComponentName = keyof typeof VueLib & keyof typeof ReactLib;

const icons = {
    ArrowRight: { vue: VueArrowRight, react: ArrowRight },
    Bell: { vue: VueBell, react: Bell },
    Ellipsis: { vue: VueEllipsis, react: Ellipsis },
    House: { vue: VueHouse, react: House },
    Check: { vue: VueCheck, react: Check },
    Mail: { vue: VueMail, react: Mail },
    Plus: { vue: VuePlus, react: Plus },
};

/** Placeholder for an icon prop – resolved to the Lucide icon of the rendering framework. */
export const icon = (name: keyof typeof icons) => ({ $icon: name });

/** Framework-neutral element description: a WireLayer component (capitalised) or an HTML tag. */
export interface El {
    type: ComponentName | keyof HTMLElementTagNameMap | 'svg';
    props: Record<string, unknown>;
    children: (El | string)[];
}

export const el = (type: El['type'], props: Record<string, unknown> = {}, ...children: (El | string)[]): El => ({
    type,
    props,
    children,
});

const isComponent = (type: El['type']): type is ComponentName => /^[A-Z]/.test(type);

/** Replaces icon placeholders – also inside arrays and plain objects, e.g. `items: [{ icon }]`. */
function resolveIcons(value: unknown, framework: Framework): unknown {
    const iconName = (value as { $icon?: keyof typeof icons } | null)?.$icon;
    if (iconName) return icons[iconName][framework];
    if (Array.isArray(value)) return value.map((item) => resolveIcons(item, framework));
    if (value && Object.getPrototypeOf(value) === Object.prototype) {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveIcons(item, framework)]));
    }
    return value;
}

function resolveProps(props: Record<string, unknown>, framework: Framework) {
    return Object.fromEntries(
        Object.entries(props).map(([key, value]) => {
            if (key === 'class' && framework === 'react') return ['className', value];
            return [key, resolveIcons(value, framework)];
        })
    );
}

/**
 * Named content of a component: `$slots: { actions: el(…) }` becomes named slots in Vue and
 * props of the same name in React (e.g. SiteHeader `actions`/`logo`).
 */
type NamedContent = Record<string, El | string>;
/**
 * Content per row: `$render: { expansion: (row) => el(…) }` becomes a scoped slot (`{ row }`) in Vue and a
 * function prop `(row) => …` in React (e.g. DataTable `expansion`).
 */
type RowContent = Record<string, (row: never) => El | string>;
/**
 * Scoped content with named slot props: `$scoped: { item: { react: 'renderItem', args: (item, state) => ({ item,
 * ...state }), render: ({ item }) => el(…) } }` becomes the scoped slot `item` in Vue and the render function
 * `renderItem(item, state)` in React (e.g. Select `item`/`renderItem`).
 */
export interface ScopedContent {
    react: string;
    args: (...args: never[]) => Record<string, unknown>;
    render: (props: never) => El | string;
}

/**
 * The editor of the DataTable's advanced filter: ConditionBuilder from the blocks packages, in the `advancedFilter`
 * slot (Vue: `{ fields, value, setValue, label }`) or as `renderAdvancedFilter` (React: ConditionBuilder's props)
 */
export const advancedFilterEditor: Record<string, ScopedContent> = {
    advancedFilter: {
        react: 'renderAdvancedFilter',
        args: (props: Record<string, unknown>) => props,
        render: ({ setValue, value, ...rest }: Record<string, unknown>) =>
            el(
                'ConditionBuilder',
                setValue ? { ...rest, modelValue: value, 'onUpdate:modelValue': setValue } : { ...rest, value }
            ),
    },
};

export function toReact(node: El | string): ReactNode {
    if (typeof node === 'string') return node;
    const type = isComponent(node.type) ? ReactLib[node.type] : node.type;
    const { $slots, $render, $scoped, ...rest } = node.props as {
        $slots?: NamedContent;
        $render?: RowContent;
        $scoped?: Record<string, ScopedContent>;
    };
    const named = Object.fromEntries(Object.entries($slots ?? {}).map(([name, content]) => [name, toReact(content)]));
    const rendered = Object.fromEntries(
        Object.entries($render ?? {}).map(([name, content]) => [name, (row: never) => toReact(content(row))])
    );
    const scoped = Object.fromEntries(
        Object.values($scoped ?? {}).map((content) => [
            content.react,
            (...args: never[]) => toReact(content.render(content.args(...args) as never)),
        ])
    );
    return createElement(
        type as string,
        { ...resolveProps(rest, 'react'), ...named, ...rendered, ...scoped },
        ...node.children.map(toReact)
    );
}

export function toVue(node: El | string): VNode | string {
    if (typeof node === 'string') return node;
    const { $slots, $render, $scoped, ...rest } = node.props as {
        $slots?: NamedContent;
        $render?: RowContent;
        $scoped?: Record<string, ScopedContent>;
    };
    const props = resolveProps(rest, 'vue');
    if (!isComponent(node.type)) return h(node.type, props, node.children.map(toVue));
    const slots = {
        ...Object.fromEntries(Object.entries($slots ?? {}).map(([name, content]) => [name, () => toVue(content)])),
        ...Object.fromEntries(
            Object.entries($render ?? {}).map(([name, content]) => [
                name,
                ({ row }: { row: never }) => toVue(content(row)),
            ])
        ),
        ...Object.fromEntries(
            Object.entries($scoped ?? {}).map(([name, content]) => [
                name,
                (props: never) => toVue(content.render(props)),
            ])
        ),
    };
    const children =
        node.children.length || $slots || $render || $scoped
            ? { ...slots, default: () => node.children.map(toVue) }
            : undefined;
    // Props are untyped here (Record<string, unknown>), so the component union is widened like on the React side
    return h(VueLib[node.type] as Component, props, children);
}

/**
 * Renders the description with the given framework and returns the testing-library container.
 * Waits until post-mount updates (e.g. Ark wiring aria-describedby, measured carousel pages) are flushed.
 */
export async function render(framework: Framework, node: El): Promise<HTMLElement> {
    if (framework === 'react') {
        const { container } = renderReact(toReact(node));
        // Ark React measures some layouts (carousel pages) one task later than Ark Vue
        await act(() => new Promise((done) => setTimeout(done)));
        return container;
    }
    const { container } = renderVue({ render: () => toVue(node) });
    await nextTick();
    return container as HTMLElement;
}

/**
 * For comparing Vue and React: renders, then waits task by task until the DOM stops changing – on a slow machine
 * Ark's effects (e.g. the open state of tree branches in React) can take longer than one task, and the two would be
 * compared half done. Behavior tests use render(), they look at states in between (loading, …)
 */
export async function renderSettled(framework: Framework, node: El): Promise<HTMLElement> {
    const container = await render(framework, node);
    const task =
        framework === 'react'
            ? () => act(() => new Promise((done) => setTimeout(done)))
            : () => new Promise<void>((done) => setTimeout(done)).then(() => nextTick());
    let last: string | undefined;
    for (let round = 0; round < 10 && container.innerHTML !== last; round++) {
        last = container.innerHTML;
        await task();
    }
    return container;
}

const ID_ATTRIBUTES = new Set(['id', 'for', 'aria-describedby', 'aria-labelledby', 'aria-controls', 'headers']);
/** Framework-internal attributes that differ between Ark React and Ark Vue without any effect */
// suppresscontenteditablewarning: a React-only prop that Ark Vue writes into the DOM (DateInput segments)
const IGNORED_ATTRIBUTES = new Set(['data-ssr', 'suppresscontenteditablewarning']);
/** Generated ids inside other attribute values: React useId (`_r_0_`, `:r0:`) and Vue useId (`v-0`) */
const GENERATED_ID = /_r_[0-9a-z]+_|:r[0-9a-z]+:|\bv-\d+(?:-\d+)*\b/g;
const SVG_ATTRIBUTES = new Set(['class', 'role', 'aria-hidden', 'aria-label']);
const HIDDEN_SELECT_ATTRIBUTES = new Set(['name', 'required', 'disabled', 'aria-hidden']);

/**
 * Serialises a DOM tree so that Vue and React output can be compared:
 * sorted attributes and classes, generated ids replaced by stable placeholders,
 * comments/whitespace dropped and icon SVGs reduced to their outer element.
 */
export function normalize(root: Element): string {
    const ids = new Map<string, string>();
    const stableId = (value: string) => {
        if (!ids.has(value)) ids.set(value, `id-${ids.size}`);
        return ids.get(value);
    };

    const attributes = (element: Element, allowed?: Set<string>) =>
        // Sorted first: stable ids are numbered in this order, which must not depend on the framework
        [...element.attributes]
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter((attr) => !IGNORED_ATTRIBUTES.has(attr.name) && (!allowed || allowed.has(attr.name)))
            // Ark Vue already sets aria-controls on a closed popup trigger, Ark React only once the popup is
            // mounted – both point to the popup when it is open, so ignore it while collapsed
            .filter((attr) => !(attr.name === 'aria-controls' && element.getAttribute('aria-expanded') === 'false'))
            // Ark's presence keeps data-state="open" on expanded collapsible content in jsdom (no animation end event)
            // in React, not in Vue – in the browser both drop it, so it says nothing about parity here
            .filter((attr) => !(attr.name === 'data-state' && element.hasAttribute('data-collapsible')))
            // A controlled <select>: Vue also writes its value as attribute (which <select> does not have), React only
            // sets the property – the chosen option is the same
            .filter((attr) => !(attr.name === 'value' && element.tagName === 'SELECT'))
            .map((attr) => {
                let value = attr.value;
                if (attr.name === 'class') {
                    value = value
                        .split(/\s+/)
                        .filter((token) => token && !token.startsWith('lucide'))
                        .sort()
                        .join(' ');
                } else if (attr.name === 'style') {
                    // Ark measures slider thumbs differently (Vue: size 0 in jsdom, React: hidden until measured) –
                    // in the browser both end up visible with the real size
                    value = value
                        .replace(/\s*--slider-thumb-(width|height): [^;]+;/g, '')
                        .replace(/visibility: (hidden|visible);\s*(?=.*--slider-thumb-transform)/, '');
                } else if (attr.name === 'inert') {
                    // jsdom has no inert property, so Vue writes "true" – browsers get the property (empty attribute)
                    value = '';
                } else if (ID_ATTRIBUTES.has(attr.name)) {
                    value = value.split(/\s+/).map(stableId).join(' ');
                } else {
                    value = value.replace(GENERATED_ID, (id) => stableId(id) ?? id);
                }
                return `${attr.name}="${value}"`;
            })
            .sort()
            .map((attr) => ` ${attr}`)
            .join('');

    const walk = (node: Node, depth: number): string[] => {
        const indent = '  '.repeat(depth);
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            return text ? [`${indent}${text}`] : [];
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return [];
        const element = node as Element;
        const tag = element.tagName.toLowerCase();
        if (tag === 'svg') return [`${indent}<svg${attributes(element, SVG_ATTRIBUTES)} />`];
        // Native select behind a custom one (form submission only): Vue and React set its value differently
        // (attribute vs. selected option) – compare its actual state instead
        if (tag === 'select' && element.getAttribute('aria-hidden') === 'true') {
            const select = element as HTMLSelectElement;
            const options = [...select.options].map((option) => option.value).join(',');
            return [
                `${indent}<select${attributes(element, HIDDEN_SELECT_ATTRIBUTES)} options="${options}" value="${select.value}" />`,
            ];
        }
        // A controlled <textarea>: React writes the value as text content, Vue (Ark's factory) also as attribute –
        // compare the value given to it
        if (tag === 'textarea') {
            const bare = element.cloneNode(false) as Element;
            bare.removeAttribute('value');
            const value = element.getAttribute('value') ?? element.textContent ?? '';
            return [`${indent}<textarea${attributes(bare)} value="${value}" />`];
        }
        // A controlled text <input>: React also writes the value as attribute (defaultValue), Vue only sets the
        // property – compare the current value
        if (tag === 'input' && !['checkbox', 'radio', 'hidden'].includes((element as HTMLInputElement).type)) {
            const bare = element.cloneNode(false) as Element;
            bare.removeAttribute('value');
            const { value } = element as HTMLInputElement;
            const children = [...element.childNodes].flatMap((child) => walk(child, depth + 1));
            return [
                `${indent}<input${attributes(bare)}${value ? ` value="${value}"` : ''}>`,
                ...children,
                `${indent}</input>`,
            ];
        }
        const children = [...element.childNodes].flatMap((child) => walk(child, depth + 1));
        return [`${indent}<${tag}${attributes(element)}>`, ...children, `${indent}</${tag}>`];
    };

    return [...root.childNodes].flatMap((child) => walk(child, 0)).join('\n');
}
