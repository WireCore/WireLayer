import { fireEvent } from '@testing-library/dom';
import { describe, expect, it, vi } from 'vitest';
import { cases } from './cases.js';
import { el, frameworks, normalize, render, renderSettled, type El } from './harness.js';

// Attributes without a prop of their own (id, data-*, aria-describedby …) land on the outermost element in Vue and
// React – e.g. for a Tour step (`target: '[data-tour="canvas"]'`) or a test selector. Components that name an inner
// element (the list, the tree, the field) with aria-label keep it there.

/**
 * Components that passed on only class and style before. `id: false`: the component has an id prop of its own (it
 * names the control), or – Fieldset – Ark takes the id as the base of the legend's and texts' ids. `node`: another
 * root of the same component.
 */
const components: { name: string; node?: El; id?: false; innerLabel?: true }[] = [
    { name: 'Chart' },
    { name: 'PieChart' },
    { name: 'BarChart' },
    { name: 'LineChart' },
    { name: 'CompositeChart' },
    { name: 'WaterfallChart' },
    { name: 'AngleSlider', id: false },
    { name: 'BlockUi' },
    { name: 'Calendar' },
    { name: 'Carousel' },
    { name: 'CascadeSelect', id: false, innerLabel: true },
    {
        name: 'CascadeSelect (filter)',
        node: el('CascadeSelect', {
            items: [{ value: 'de', label: 'Germany' }],
            filter: true,
            'aria-label': 'Location',
        }),
        id: false,
        innerLabel: true,
    },
    { name: 'ColorPicker', id: false, innerLabel: true },
    { name: 'CopyButton' },
    { name: 'DataView' },
    { name: 'Fieldset', id: false },
    { name: 'Gallery' },
    { name: 'JsonViewer', innerLabel: true },
    { name: 'Knob', id: false, innerLabel: true },
    { name: 'Listbox', id: false, innerLabel: true },
    { name: 'LogViewer' },
    { name: 'MeterGroup' },
    { name: 'NavigationMenu' },
    { name: 'NotificationCenter' },
    { name: 'OrderList' },
    { name: 'OrgChart' },
    { name: 'Panel' },
    { name: 'Panel (toggleable)', node: el('Panel', { title: 'Details', toggleable: true }, 'Content') },
    { name: 'PickList' },
    { name: 'PinInput', id: false, innerLabel: true },
    { name: 'ProgressCircle' },
    { name: 'Rating', id: false },
    { name: 'ScrollTop' },
    { name: 'ScrollPanel' },
    { name: 'SidebarNav' },
    { name: 'SignaturePad' },
    { name: 'Sparkline' },
    { name: 'Sortable', innerLabel: true },
    { name: 'SpeedDial' },
    { name: 'SplitButton' },
    { name: 'Splitter' },
    { name: 'Spoiler' },
    { name: 'Stepper' },
    { name: 'TableOfContents' },
    { name: 'Timeline' },
    { name: 'Toolbar' },
    { name: 'Tree', innerLabel: true },
    { name: 'TreeSelect', id: false, innerLabel: true },
    { name: 'Editor', innerLabel: true },
    { name: 'VirtualList' },
    { name: 'VirtualTree', innerLabel: true },
];

const fallbacks: Record<string, El> = {
    Toolbar: el('Toolbar', { label: 'Format' }, el('button', { type: 'button' }, 'Bold')),
};

/** The component's node (or its first parity case) with the given attributes added */
const withAttributes = ({ name, node: own }: (typeof components)[number], attributes: Record<string, unknown>): El => {
    const node = own ?? cases.find(([, node]) => node.type === name)?.[1] ?? fallbacks[name];
    if (!node) throw new Error(`No parity case for ${name}`);
    return { ...node, props: { ...node.props, ...attributes } };
};

describe('extra attributes land on the outermost element', () => {
    it.each(components)('$name', async (component) => {
        const { id } = component;
        const node = withAttributes(component, { 'data-tour': 'target', ...(id === false ? {} : { id: 'outer' }) });
        const vue = await renderSettled('vue', node);
        const react = await renderSettled('react', node);
        for (const container of [vue, react]) {
            const root = container.firstElementChild!;
            expect(root.getAttribute('data-tour')).toBe('target');
            if (id !== false) expect(root.id).toBe('outer');
        }
        expect(normalize(vue)).toBe(normalize(react));
    });

    it.each(components.filter((component) => component.innerLabel))(
        '$name keeps aria-label on its inner element',
        async (component) => {
            for (const framework of frameworks) {
                const node = withAttributes(component, {
                    label: undefined,
                    'aria-label': 'Named',
                    'data-tour': 'target',
                });
                const root = (await render(framework, node)).firstElementChild!;
                expect(root.getAttribute('data-tour')).toBe('target');
                expect(root.hasAttribute('aria-label')).toBe(false);
                // On the element it names (or the hidden text an aria-labelledby points to)
                expect(root.innerHTML).toContain('Named');
            }
        }
    );

    it.each(frameworks)('%s: Sortable names its list, not the wrapper', async (framework) => {
        const node = el('Sortable', {
            defaultValue: [{ id: 'a', label: 'Write' }],
            'aria-label': 'Tasks',
            'data-tour': 'canvas',
            id: 'board',
        });
        const root = (await render(framework, node)).firstElementChild!;
        expect(root.tagName).toBe('DIV');
        expect(root.id).toBe('board');
        expect(root.getAttribute('data-tour')).toBe('canvas');
        expect(root.hasAttribute('aria-label')).toBe(false);
        expect(root.querySelector('ul')!.getAttribute('aria-label')).toBe('Tasks');
    });

    // Components with a key handler of their own on the outermost element: a listener given to them runs as well
    const keyHandlers: [string, string, boolean][] = [
        ['JsonViewer', 'KeyDown', false],
        ['Timeline feed, loading older', 'KeyDown', false],
        ['Tree', 'KeyDown', true],
        ['VirtualTree', 'KeyDown', true],
    ];
    describe.each(frameworks)('%s', (framework) => {
        it.each(keyHandlers)('%s runs a given key listener next to its own', async (name, event, capture) => {
            const node = cases.find(
                ([caseName, node]) => caseName === name || (node.type === name && caseName.startsWith(name))
            )![1];
            const listener = vi.fn();
            // React: onKeyDown(Capture), Vue: onKeydown(Capture)
            const prop = `on${framework === 'react' ? event : 'Keydown'}${capture ? 'Capture' : ''}`;
            const root = (await render(framework, { ...node, props: { ...node.props, [prop]: listener } }))
                .firstElementChild!;
            fireEvent.keyDown(root.querySelector('[tabindex="0"]') ?? root, { key: 'ArrowDown' });
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });
});
