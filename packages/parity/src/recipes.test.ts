import { screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { button, buttonColorKey, tv, withRecipeOverrides } from '@wirecore/wirelayer-recipes';
import { el, frameworks, icon, render } from './harness.js';

// Own defaults and classes: RecipesProvider for every component below, `classes` for one component

describe.each(frameworks)('%s recipes', (framework) => {
    it('classes add to the parts of one component; its own class still wins', async () => {
        await render(
            framework,
            el(
                'Button',
                {
                    leadingIcon: icon('Plus'),
                    class: 'rounded-full',
                    classes: { base: 'rounded-none ring-2', icon: 'size-6' },
                },
                'New'
            )
        );
        const button = screen.getByRole('button', { name: 'New' });
        expect(button).toHaveClass('ring-2', 'rounded-full');
        expect(button).not.toHaveClass('rounded-none');
        expect(button.querySelector('svg')).toHaveClass('size-6');
    });

    it('a provider sets defaults and classes below it; explicit props and inner providers win', async () => {
        await render(
            framework,
            el(
                'RecipesProvider',
                {
                    recipes: {
                        button: {
                            defaultVariants: { size: 'sm', variant: 'outline' },
                            classes: { base: 'tracking-wide' },
                        },
                        badge: { classes: { base: 'uppercase' } },
                    },
                },
                el('Button', {}, 'Klein'),
                el('Button', { size: 'lg' }, 'Large'),
                el(
                    'RecipesProvider',
                    { recipes: { button: { defaultVariants: { size: 'md' }, classes: { base: 'italic' } } } },
                    el('Button', {}, 'Inner')
                ),
                el('Badge', {}, 'New')
            )
        );
        expect(screen.getByRole('button', { name: 'Klein' })).toHaveClass(
            'h-[var(--wc-control-h-sm,2rem)]',
            'border',
            'tracking-wide'
        );
        expect(screen.getByRole('button', { name: 'Large' })).toHaveClass('h-[var(--wc-control-h-lg,3rem)]');
        const inner = screen.getByRole('button', { name: 'Inner' });
        expect(inner).toHaveClass('h-[var(--wc-control-h-md,2.5rem)]', 'border', 'tracking-wide', 'italic');
        expect(screen.getByText('New')).toHaveClass('uppercase');
    });

    it('reaches the parts of composite components (DataTable rows, Tabs triggers)', async () => {
        await render(
            framework,
            el(
                'RecipesProvider',
                { recipes: { tabs: { classes: { trigger: 'px-8' } } } },
                el('DataTable', {
                    data: [{ id: 'a', name: 'web-01' }],
                    columns: [{ id: 'name', header: 'Name' }],
                    caption: 'Server',
                    classes: { row: 'h-16', th: 'text-fg' },
                }),
                el(
                    'Tabs',
                    { defaultValue: 'a', label: 'Sections' },
                    el('TabsList', {}, el('TabsTrigger', { value: 'a' }, 'All')),
                    el('TabsContent', { value: 'a' }, 'Contents')
                )
            )
        );
        const table = screen.getByRole('table', { name: 'Server' });
        expect(within(table).getAllByRole('row')[1]).toHaveClass('h-16');
        expect(within(table).getByRole('columnheader', { name: 'Name' })).toHaveClass('text-fg');
        expect(screen.getByRole('tab', { name: 'All' })).toHaveClass('px-8');
    });
});

describe.each(frameworks)('%s states with overrides', (framework) => {
    // A provider (or `classes`) changes the border of the fields – their states still show
    const provider = (...children: ReturnType<typeof el>[]) =>
        el(
            'RecipesProvider',
            {
                recipes: {
                    input: { classes: { base: 'border-line-2' } },
                    textarea: { classes: { base: 'border-line-2' } },
                    numberInput: { classes: { control: 'border-line-2' } },
                    passwordInput: { classes: { control: 'border-line-2' } },
                    select: { classes: { trigger: 'border-line-2' } },
                    datePicker: { classes: { control: 'border-line-2' } },
                },
            },
            ...children
        );
    const box = (name: string) => screen.getByRole('textbox', { name }).parentElement!;

    it('Input and Textarea: the override applies, invalid, success and disabled still show', async () => {
        await render(
            framework,
            provider(
                el('Input', { 'aria-label': 'Plain' }),
                el('Input', { 'aria-label': 'Invalid', invalid: true }),
                el('Input', { 'aria-label': 'Success', success: true }),
                el('Input', { 'aria-label': 'Disabled', disabled: true }),
                el('Textarea', { 'aria-label': 'Note' }),
                el('Textarea', { 'aria-label': 'Invalid note', invalid: true })
            )
        );
        expect(box('Plain')).toHaveClass('border-line-2');
        expect(box('Invalid')).toHaveClass('border-danger');
        expect(box('Invalid')).not.toHaveClass('border-line-2');
        expect(box('Success')).toHaveClass('border-success');
        expect(box('Disabled')).toHaveClass('border-line', 'bg-bg-2');
        expect(screen.getByRole('textbox', { name: 'Note' })).toHaveClass('border-line-2');
        expect(screen.getByRole('textbox', { name: 'Invalid note' })).toHaveClass('border-danger');
        expect(screen.getByRole('textbox', { name: 'Invalid note' })).not.toHaveClass('border-line-2');
    });

    it('NumberInput and PasswordInput: success shows, invalid wins by its attribute selector', async () => {
        await render(
            framework,
            provider(
                el('NumberInput', { 'aria-label': 'Count', success: true }),
                el('NumberInput', { 'aria-label': 'Wrong count', invalid: true }),
                el('PasswordInput', { 'aria-label': 'Password', success: true })
            )
        );
        const control = (input: HTMLElement) => input.closest('[data-part=control]')!;
        expect(control(screen.getByRole('spinbutton', { name: 'Count' }))).toHaveClass('border-success');
        expect(control(screen.getByRole('spinbutton', { name: 'Count' }))).not.toHaveClass('border-line-2');
        const wrong = control(screen.getByRole('spinbutton', { name: 'Wrong count' }));
        // data-invalid:border-danger beats border-line-2 through its specificity (class + attribute)
        expect(wrong).toHaveClass('border-line-2', 'data-invalid:border-danger');
        expect(wrong).toHaveAttribute('data-invalid');
        expect(control(screen.getByLabelText('Password'))).toHaveClass('border-success');
    });

    it('Select and DatePicker: invalid keeps its attribute selector next to the override', async () => {
        await render(
            framework,
            provider(
                el('Select', { items: [{ value: 'a', label: 'A' }], 'aria-label': 'Choice', invalid: true }),
                el('DatePicker', { 'aria-label': 'Day', invalid: true })
            )
        );
        const trigger = screen.getByRole('combobox', { name: 'Choice' });
        expect(trigger).toHaveClass('border-line-2', 'data-invalid:border-danger');
        expect(trigger).toHaveAttribute('data-invalid');
        const control = document.querySelector('[data-scope=date-picker][data-part=control]')!;
        expect(control).toHaveClass('border-line-2', 'data-invalid:border-danger');
        expect(control).toHaveAttribute('data-invalid');
    });

    it('the class passed to the component still wins over a state', async () => {
        await render(
            framework,
            provider(el('Input', { 'aria-label': 'Own', invalid: true, class: 'border-line-strong' }))
        );
        expect(box('Own')).toHaveClass('border-line-strong');
        expect(box('Own')).not.toHaveClass('border-danger');
    });
});

describe('withRecipeOverrides and states', () => {
    const field = tv({
        slots: { base: 'border border-line', label: 'text-fg' },
        variants: {
            size: { sm: { base: 'h-8' }, md: { base: 'h-10' } },
            invalid: { true: { base: 'border-danger', label: 'text-danger' } },
            disabled: { true: 'opacity-40' },
        },
        compoundVariants: [{ invalid: true, size: 'sm', class: { base: 'border-2' } }],
        defaultVariants: { size: 'md' },
    });
    const box = tv({ base: 'border border-line', variants: { invalid: { true: 'border-danger' } } });

    it('adds the active states after the override classes, the own class last', () => {
        const styled = withRecipeOverrides(field, [
            { classes: { base: 'border-line-2 border-0', label: 'text-muted' } },
        ]);
        expect(styled({}).base()).toContain('border-line-2');
        const invalid = styled({ invalid: true });
        expect(invalid.base()).toContain('border-danger');
        expect(invalid.base()).not.toContain('border-line-2');
        expect(invalid.label()).toContain('text-danger');
        expect(invalid.base({ class: 'border-line-strong' })).toContain('border-line-strong');
        expect(invalid.base({ class: 'border-line-strong' })).not.toContain('border-danger');
        // A string value counts for the base part; compound variants with a state, too (default size md: no match)
        expect(styled({ disabled: true }).base()).toContain('opacity-40');
        expect(styled({ invalid: true, size: 'sm' }).base()).toContain('border-2');
        expect(styled({ invalid: true }).base()).toContain('border-0');
    });

    it('leaves parts without override classes and recipes without overrides alone', () => {
        expect(withRecipeOverrides(field, [undefined])).toBe(field);
        const styled = withRecipeOverrides(field, [{ classes: { label: 'text-muted' } }]);
        expect(styled({ invalid: true }).base()).toBe(field({ invalid: true }).base());
    });

    it('recipes without parts: the states join the class of the call', () => {
        const styled = withRecipeOverrides(box, [{ classes: { base: 'border-line-2' } }]);
        expect(styled({})).toContain('border-line-2');
        expect(styled({ invalid: true })).toContain('border-danger');
        expect(styled({ invalid: true })).not.toContain('border-line-2');
        expect(styled({ invalid: true, class: 'border-fg' })).toContain('border-fg');
    });
});

describe.each(frameworks)('%s CodeHighlight', (framework) => {
    it('colours the tokens once Shiki is loaded; the plain code is there before', async () => {
        await render(
            framework,
            el('CodeHighlight', { code: 'const answer = 42;', language: 'ts', title: 'answer.ts' })
        );
        const code = document.querySelector('code')!;
        expect(code).toHaveTextContent('const answer = 42;');
        await waitFor(
            () => expect(code.querySelector('[style*="--wc-code-token-keyword"]')).toHaveTextContent('const'),
            { timeout: 8000 }
        );
        expect(screen.getByRole('button', { name: 'Copy code: answer.ts' })).toBeInTheDocument();
    });
});

const files = [
    {
        id: 'docs',
        label: 'Documents',
        children: [
            { id: 'offer', label: 'Proposal.pdf' },
            { id: 'archive', label: 'Archive', children: [{ id: 'report', label: 'Report.pdf' }] },
        ],
    },
    { id: 'notes', label: 'Notes.txt' },
];

describe('button colour × style', () => {
    const base = (props: Parameters<typeof button>[0]) => button(props).base();
    it('colours outline/text/soft/link and replaces the fill of filled variants', () => {
        expect(base({ variant: 'text', color: buttonColorKey('danger') })).toContain('text-danger');
        expect(base({ variant: 'text', color: buttonColorKey('danger') })).not.toContain('text-fg');
        expect(base({ variant: 'outline', color: buttonColorKey('secondary') })).toContain('text-muted');
        expect(base({ variant: 'soft', color: buttonColorKey('success') })).toContain('bg-success/10');
        expect(base({ color: buttonColorKey('danger') })).toContain('bg-danger');
        expect(base({ color: buttonColorKey('danger') })).not.toContain('bg-primary');
        expect(base({ variant: 'warn' })).toContain('hover:opacity-90');
        // Without a colour nothing changes
        expect(base({})).toBe(base({ color: undefined }));
        expect(buttonColorKey('contrast')).toBe('colorContrast');
    });
});

describe('tree moves', () => {
    it('moves by keyboard and by drop, never into itself', async () => {
        const { moveTreeNode, treeDropMove, treeKeyboardMove } = await import('@wirecore/wirelayer-recipes');
        expect(treeKeyboardMove(files, 'notes', 'up')).toEqual({ id: 'notes', parentId: null, index: 0 });
        expect(treeKeyboardMove(files, 'notes', 'in')).toEqual({ id: 'notes', parentId: 'docs', index: 2 });
        expect(treeKeyboardMove(files, 'report', 'out')).toEqual({ id: 'report', parentId: 'docs', index: 2 });
        expect(treeKeyboardMove(files, 'docs', 'out')).toBeUndefined();
        expect(treeDropMove(files, 'docs', 'report', 'before')).toBeUndefined();
        const moved = moveTreeNode(files, treeDropMove(files, 'notes', 'archive', 'inside')!);
        expect(moved[0]!.children![1]!.children!.map((node) => node.id)).toEqual(['report', 'notes']);
        expect(moved).toHaveLength(1);
        expect(files).toHaveLength(2);
    });
});

describe.each(frameworks)('%s Tree reorderable', (framework) => {
    it('Alt+arrow keys report the move and announce it', async () => {
        const onMove = vi.fn();
        await render(
            framework,
            el('Tree', { items: files, label: 'Files', defaultExpandedValue: ['docs'], reorderable: true, onMove })
        );
        const node = screen.getByRole('treeitem', { name: 'Notes.txt' });
        expect(node).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight');
        node.focus();
        await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
        expect(onMove).toHaveBeenLastCalledWith({ id: 'notes', parentId: null, index: 0 });
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Notes.txt moved, position 1 of 2'));
        screen.getByRole('treeitem', { name: 'Proposal.pdf' }).focus();
        await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
        expect(onMove).toHaveBeenLastCalledWith({ id: 'offer', parentId: null, index: 1 });
    });
});

describe.each(frameworks)('%s Scheduler', (framework) => {
    const events = [
        { id: 'a', title: 'Planning', start: '2027-03-16T09:00', end: '2027-03-16T10:30' },
        { id: 'b', title: 'Review', start: '2027-03-16T10:00', end: '2027-03-16T11:00' },
    ];

    it('lays out overlapping events side by side; arrows switch weeks; a day opens', async () => {
        await render(framework, el('Scheduler', { events, defaultDate: '2027-03-16' }));
        const region = screen.getByRole('region', { name: 'Calendar' });
        expect(within(region).getByRole('heading', { level: 2 })).toHaveTextContent('March 15 – 21, 2027');
        const day = screen.getByRole('group', { name: 'Tuesday, March 16, 2027' });
        const [planning, review] = within(day).getAllByRole('button', { name: /Planning|Review/ });
        expect(planning).toHaveStyle({ width: '50%' });
        expect(review).toHaveAccessibleName(/^Review ?10:00 AM–11:00 AM$/);
        await userEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(within(region).getByRole('heading', { level: 2 })).toHaveTextContent('March 22 – 28, 2027');
        await userEvent.click(screen.getByRole('button', { name: /^Mon.*Monday, March 22, 2027$/ }));
        expect(within(region).getByRole('heading', { level: 2 })).toHaveTextContent('Monday, March 22, 2027');
    });

    it('Alt+arrow keys move and resize an event; the change is reported and announced', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Scheduler', {
                events,
                defaultDate: '2027-03-16',
                editable: true,
                [framework === 'vue' ? 'onEventChange' : 'onEventChange']: onChange,
            })
        );
        screen.getByRole('button', { name: /^Planning/ }).focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ start: '2027-03-16T09:30', end: '2027-03-16T11:00' })
        );
        await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ start: '2027-03-17T09:00', end: '2027-03-17T10:30' })
        );
        await userEvent.keyboard('{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ start: '2027-03-16T09:00', end: '2027-03-16T11:00' })
        );
        await waitFor(() =>
            expect(within(screen.getByRole('region')).getAllByRole('status').at(-1)).toHaveTextContent(
                'Planning: Tuesday, March 16, 2027, 09:00 AM–11:00 AM'
            )
        );
    });

    it('new event button and month and agenda views', async () => {
        const onSlot = vi.fn();
        await render(framework, el('Scheduler', { events, defaultDate: '2027-03-16', onSlotSelect: onSlot }));
        await userEvent.click(screen.getByRole('button', { name: 'New event on Wednesday, March 17, 2027' }));
        expect(onSlot).toHaveBeenLastCalledWith({ start: '2027-03-17T07:00', end: '2027-03-17T07:30', allDay: false });
        await userEvent.click(screen.getByRole('radio', { name: 'Month' }));
        expect(screen.getByRole('table', { name: 'March 2027' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('radio', { name: 'List' }));
        expect(screen.getByRole('heading', { level: 3, name: 'Tuesday, March 16, 2027' })).toBeInTheDocument();
    });
});
