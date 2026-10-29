import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { el, frameworks, render } from './harness.js';

// Extensions from the migration of a desktop app (dense UI, many dialogs with window shortcuts)
describe.each(frameworks)('%s', (framework) => {
    const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';
    const onOpen = framework === 'vue' ? 'onUpdate:open' : 'onOpenChange';
    const valueProp = framework === 'vue' ? 'modelValue' : 'value';

    describe('focus API of the text fields', () => {
        it.each<[string, Record<string, unknown>]>([
            ['Input', {}],
            ['PasswordInput', {}],
            ['NumberInput', {}],
            ['Textarea', {}],
            ['Textarea', { clearable: true }],
            ['MaskInput', { mask: '99999' }],
        ])(
            '%s %j: focus, select, setSelectionRange, blur and the native element through the ref',
            async (name, props) => {
                let handle: {
                    element?: HTMLInputElement;
                    focus(): void;
                    blur(): void;
                    select(): void;
                    setSelectionRange(start: number, end: number): void;
                } | null = null;
                await render(
                    framework,
                    el(name as 'Input', {
                        'aria-label': 'Field',
                        ...props,
                        ref: (value: typeof handle) => {
                            if (value) handle = value;
                        },
                    })
                );
                const field = screen.getByLabelText<HTMLInputElement>('Field');
                // Vue exposes a handle with `element`, React's ref is the native element itself
                expect(framework === 'vue' ? handle!.element : handle).toBe(field);
                act(() => handle!.focus());
                expect(field).toHaveFocus();
                await userEvent.type(field, '12345');
                act(() => handle!.select());
                expect([field.selectionStart, field.selectionEnd]).toEqual([0, field.value.length]);
                act(() => handle!.setSelectionRange(1, 3));
                expect([field.selectionStart, field.selectionEnd]).toEqual([1, 3]);
                act(() => handle!.blur());
                expect(field).not.toHaveFocus();
            }
        );

        // The initial focus of a dialog on a field marked data-autofocus: in the browser (e2e/overlays.spec.ts) – jsdom has
        // no layout, so the focus trap takes no field as focusable
    });

    describe('PasswordInput autocomplete', () => {
        const autocomplete = framework === 'vue' ? 'autocomplete' : 'autoComplete';

        it('off for secrets the browser should not save; current-password stays the default', async () => {
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('PasswordInput', { 'aria-label': 'Token', [autocomplete]: 'off' }),
                    el('PasswordInput', { 'aria-label': 'Code', [autocomplete]: 'one-time-code' }),
                    el('PasswordInput', { 'aria-label': 'Password' })
                )
            );
            expect(screen.getByLabelText('Token')).toHaveAttribute('autocomplete', 'off');
            expect(screen.getByLabelText('Code')).toHaveAttribute('autocomplete', 'one-time-code');
            expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
        });
    });

    describe('typed values', () => {
        it('RadioGroup gives number values back as numbers', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el(
                    'RadioGroup',
                    { label: 'Port', defaultValue: 22, [onValue]: onChange },
                    el('RadioGroupItem', { value: 22 }, 'SSH'),
                    el('RadioGroupItem', { value: 443 }, 'HTTPS')
                )
            );
            expect(screen.getByRole('radio', { name: 'SSH' })).toBeChecked();
            await userEvent.click(screen.getByRole('radio', { name: 'HTTPS' }));
            expect(onChange).toHaveBeenLastCalledWith(443);
        });

        it('RadioGroup takes a controlled number value', async () => {
            await render(
                framework,
                el(
                    'RadioGroup',
                    { label: 'Port', [valueProp]: 443 },
                    el('RadioGroupItem', { value: 22 }, 'SSH'),
                    el('RadioGroupItem', { value: 443 }, 'HTTPS')
                )
            );
            expect(screen.getByRole('radio', { name: 'HTTPS' })).toBeChecked();
        });

        it('NativeSelect gives number values back as numbers, the placeholder as empty string', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('NativeSelect', {
                    'aria-label': 'Timeout',
                    placeholder: 'Choose',
                    items: [
                        { value: 10, label: '10 s' },
                        { value: 30, label: '30 s' },
                    ],
                    [onValue]: onChange,
                })
            );
            const select = screen.getByRole('combobox', { name: 'Timeout' });
            await userEvent.selectOptions(select, '30 s');
            expect(onChange).toHaveBeenLastCalledWith(30);
            await userEvent.selectOptions(select, 'Choose');
            expect(onChange).toHaveBeenLastCalledWith('');
        });

        it('NativeSelect with string values stays as it was', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('NativeSelect', {
                    'aria-label': 'City',
                    items: [
                        { value: 'fra', label: 'Frankfurt' },
                        { value: 'vie', label: 'Vienna' },
                    ],
                    [onValue]: onChange,
                })
            );
            await userEvent.selectOptions(screen.getByRole('combobox', { name: 'City' }), 'Vienna');
            expect(onChange).toHaveBeenLastCalledWith('vie');
        });
    });

    describe('Select and Combobox in a dialog with window shortcuts', () => {
        const keys: string[] = [];
        const listener = (event: KeyboardEvent) => keys.push(event.key);
        const listen = () => {
            keys.length = 0;
            window.addEventListener('keydown', listener);
        };
        afterEach(() => window.removeEventListener('keydown', listener));
        const items = [
            { value: 'ssh', label: 'SSH' },
            { value: 'sftp', label: 'SFTP' },
        ];

        it('Select: open state reported; with stopKeyPropagation the open list keeps Enter and Escape', async () => {
            const onOpenChange = vi.fn();
            const onChange = vi.fn();
            await render(
                framework,
                el('Select', {
                    'aria-label': 'Protocol',
                    items,
                    stopKeyPropagation: true,
                    [onOpen]: onOpenChange,
                    [onValue]: onChange,
                })
            );
            listen();
            const trigger = screen.getByRole('combobox', { name: 'Protocol' });
            await userEvent.click(trigger);
            expect(onOpenChange).toHaveBeenLastCalledWith(true);
            await waitFor(() => expect(screen.getByRole('listbox')).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}{Enter}');
            await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
            expect(onChange).toHaveBeenCalled();
            await userEvent.click(trigger);
            await waitFor(() => expect(screen.getByRole('listbox')).toHaveFocus());
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
            expect(keys).not.toContain('Enter');
            expect(keys).not.toContain('Escape');
            // Closed: Escape is not the Select's – it reaches the dialog
            await waitFor(() => expect(trigger).toHaveFocus());
            await userEvent.keyboard('{Escape}');
            expect(keys).toContain('Escape');
        });

        it('Select with stopKeyPropagation: Enter on the field opens the list and stays in it', async () => {
            await render(framework, el('Select', { 'aria-label': 'Protocol', items, stopKeyPropagation: true }));
            listen();
            act(() => screen.getByRole('combobox', { name: 'Protocol' }).focus());
            await userEvent.keyboard('{Enter}');
            expect(keys).not.toContain('Enter');
        });

        it('Select without stopKeyPropagation lets the keys through (default)', async () => {
            await render(framework, el('Select', { 'aria-label': 'Protocol', items }));
            listen();
            act(() => screen.getByRole('combobox', { name: 'Protocol' }).focus());
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(screen.getByRole('listbox')).toHaveFocus());
            await userEvent.keyboard('{Escape}');
            expect(keys).toEqual(['Enter', 'Escape']);
        });

        it('Combobox: open state reported; with stopKeyPropagation the open list keeps Enter and Escape', async () => {
            const onOpenChange = vi.fn();
            const onChange = vi.fn();
            await render(
                framework,
                el('Combobox', {
                    'aria-label': 'Protocol',
                    items,
                    stopKeyPropagation: true,
                    [onOpen]: onOpenChange,
                    [onValue]: onChange,
                })
            );
            listen();
            const input = screen.getByRole('combobox', { name: 'Protocol' });
            await userEvent.click(input);
            await userEvent.keyboard('s');
            await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(true));
            await userEvent.keyboard('{ArrowDown}{Enter}');
            await waitFor(() => expect(onChange).toHaveBeenCalled());
            await userEvent.clear(input);
            await userEvent.keyboard('s');
            await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(true));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
            expect(keys).not.toContain('Enter');
            expect(keys).not.toContain('Escape');
            // Closed: the keys reach the dialog again
            await new Promise((done) => setTimeout(done, 10));
            await userEvent.keyboard('{Escape}');
            expect(keys).toContain('Escape');
        });
    });

    describe('ContextMenu', () => {
        const items = [
            { value: 'rename', label: 'Rename' },
            { value: 'delete', label: 'Delete', danger: true },
        ];

        it('reports the element before opening and the open state; highlightFirst makes Enter take the first item', async () => {
            const onBeforeOpen = vi.fn();
            const onOpenChange = vi.fn();
            const onSelect = vi.fn();
            await render(
                framework,
                el(
                    'ContextMenu',
                    { items, highlightFirst: true, onBeforeOpen, [onOpen]: onOpenChange, onSelect },
                    el('ul', {}, el('li', {}, 'host-1'), el('li', {}, 'host-2'))
                )
            );
            const row = screen.getByText('host-2');
            fireEvent.contextMenu(row, { clientX: 40, clientY: 40 });
            expect(onBeforeOpen).toHaveBeenCalledWith(row, { source: 'pointer', focused: null });
            const menu = await screen.findByRole('menu');
            expect(onOpenChange).toHaveBeenLastCalledWith(true);
            await waitFor(() =>
                expect(within(menu).getByRole('menuitem', { name: 'Rename' })).toHaveAttribute('data-highlighted')
            );
            await userEvent.keyboard('{Enter}');
            expect(onSelect).toHaveBeenLastCalledWith('rename');
            await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
        });

        it('without highlightFirst no item is highlighted after a right click (default)', async () => {
            await render(framework, el('ContextMenu', { items }, el('div', {}, 'Area')));
            fireEvent.contextMenu(screen.getByText('Area'), { clientX: 40, clientY: 40 });
            const menu = await screen.findByRole('menu');
            await new Promise((done) => setTimeout(done, 50));
            expect(menu.querySelector('[data-highlighted]')).toBeNull();
        });
    });

    describe('Menu closeOnScroll, closeOnResize, closeOnBlur', () => {
        const items = [{ value: 'copy', label: 'Copy' }];
        const open = async (props: Record<string, unknown>) => {
            await render(framework, el('Menu', { items, defaultOpen: true, ...props }, el('Button', {}, 'Actions')));
            return screen.findByRole('menu');
        };

        it.each([
            ['closeOnScroll', 'scroll'],
            ['closeOnResize', 'resize'],
            ['closeOnBlur', 'blur'],
        ])('%s closes the menu on %s of the window', async (prop, type) => {
            await open({ [prop]: true });
            act(() => {
                window.dispatchEvent(new Event(type));
            });
            await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        });

        it('stays open by default, and a scroll inside the menu does not close it', async () => {
            const menu = await open({ closeOnScroll: true, closeOnResize: false });
            act(() => {
                menu.dispatchEvent(new Event('scroll'));
                window.dispatchEvent(new Event('resize'));
            });
            await new Promise((done) => setTimeout(done, 50));
            expect(screen.getByRole('menu')).toBeInTheDocument();
        });
    });

    describe('Dialog titlePosition', () => {
        it('header: the title in the row of the close button still names the dialog', async () => {
            await render(
                framework,
                el(
                    'Dialog',
                    { defaultOpen: true },
                    el('DialogContent', { title: 'Edit connection', description: 'web-01', titlePosition: 'header' })
                )
            );
            const dialog = await screen.findByRole('dialog', { name: 'Edit connection' });
            expect(dialog).toHaveAccessibleDescription('web-01');
            const close = within(dialog).getByRole('button', { name: 'Close' });
            expect(close.parentElement).toContainElement(within(dialog).getByText('Edit connection'));
        });
    });

    describe('Alert actions', () => {
        it('buttons inside the message, next to its text', async () => {
            const onClick = vi.fn();
            await render(
                framework,
                el(
                    'Alert',
                    {
                        status: 'warn',
                        title: 'Workspace locked',
                        $slots: { actions: el('Button', { size: 'sm', onClick }, 'Unlock') },
                    },
                    'Unlock it to see the connections.'
                )
            );
            const alert = screen.getByRole('alert');
            await userEvent.click(within(alert).getByRole('button', { name: 'Unlock' }));
            expect(onClick).toHaveBeenCalled();
            expect(within(alert).getByText('Workspace locked').parentElement).toHaveTextContent(
                'Workspace lockedUnlock it to see the connections.'
            );
        });
    });

    describe('Progress compact', () => {
        it('hidden label still names the bar, text in the bar follows the value, status colours the fill', async () => {
            const container = await render(
                framework,
                el('Progress', { value: 42, label: 'Upload', hideLabel: true, barText: 'waiting', status: 'warn' })
            );
            const bar = screen.getByRole('progressbar', { name: 'Upload' });
            expect(bar).toHaveAttribute('aria-valuetext', '42 %, waiting');
            expect(screen.queryByText('Upload')).toBeNull();
            expect(screen.getAllByText('waiting')).toHaveLength(2);
            expect(container.querySelector('[data-part=range]')).toHaveClass('bg-warn');
            expect(container.querySelector('[data-part=range]')).toHaveTextContent('waiting');
        });

        it('xs: a thin bar; the value text alone when it is the same as the bar text', async () => {
            const container = await render(
                framework,
                el('Progress', { value: 42, label: 'Disk', size: 'xs', barText: '42 %' })
            );
            expect(screen.getByRole('progressbar', { name: 'Disk' })).toHaveAttribute('aria-valuetext', '42 %');
            expect(container.querySelector('[data-part=track]')).toHaveClass('h-3.5');
        });
    });

    describe('mono', () => {
        it('Input, PasswordInput and Textarea in the monospace font', async () => {
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('Input', { 'aria-label': 'Path', mono: true }),
                    el('PasswordInput', { 'aria-label': 'Token', mono: true }),
                    el('Textarea', { 'aria-label': 'Key', mono: true }),
                    el('Input', { 'aria-label': 'Name' })
                )
            );
            expect(screen.getByLabelText('Path')).toHaveClass('font-mono');
            expect(screen.getByLabelText('Token')).toHaveClass('font-mono');
            expect(screen.getByLabelText('Key')).toHaveClass('font-mono');
            expect(screen.getByLabelText('Name')).not.toHaveClass('font-mono');
        });
    });
});
