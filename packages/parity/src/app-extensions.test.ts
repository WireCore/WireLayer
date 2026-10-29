import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { autoselectElement, focusFirst } from '@wirecore/wirelayer-recipes';
import { resolveTokens, watchTokens } from '@wirecore/wirelayer-tokens';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { el, frameworks, render } from './harness.js';

// Extensions from a second desktop app (a terminal: canvas colours, dense lists in dialogs, wizards). All opt-in –
// without the new props the components behave as before
describe.each(frameworks)('%s', (framework) => {
    const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';
    const valueProp = framework === 'vue' ? 'modelValue' : 'value';

    describe('choices without an empty value', () => {
        const resetForm = () => act(() => document.querySelector('form')!.reset());

        it.each([
            ['RadioGroup', 'RadioGroupItem'],
            ['SegmentedControl', 'SegmentedControlItem'],
        ])('%s: a form reset back to no value reports it – with required it does not', async (group, item) => {
            const onChange = vi.fn();
            const onRequiredChange = vi.fn();
            const choices = (props: Record<string, unknown>) =>
                el(
                    group as 'RadioGroup',
                    props,
                    el(item as 'RadioGroupItem', { value: 'ssh' }, 'SSH'),
                    el(item as 'RadioGroupItem', { value: 'sftp' }, 'SFTP')
                );
            await render(
                framework,
                el(
                    'form',
                    {},
                    choices({ label: 'Protocol', [onValue]: onChange }),
                    choices({ label: 'Fallback', required: true, [onValue]: onRequiredChange })
                )
            );
            await userEvent.click(within(screen.getByRole('radiogroup', { name: 'Protocol' })).getByText('SFTP'));
            await userEvent.click(within(screen.getByRole('radiogroup', { name: 'Fallback' })).getByText('SFTP'));
            expect(onChange).toHaveBeenLastCalledWith('sftp');
            expect(onRequiredChange).toHaveBeenLastCalledWith('sftp');
            await resetForm();
            // Ark reports the empty start: undefined (uncontrolled without a default) – a required group does not
            await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
            expect(onChange.mock.lastCall?.[0] ?? null).toBeNull();
            expect(onRequiredChange).toHaveBeenCalledTimes(1);
            expect(screen.getByRole('radiogroup', { name: 'Fallback' })).toHaveAttribute('aria-required', 'true');
        });
    });

    describe('NumberInput emptyFallback', () => {
        const field = () => screen.getByRole('spinbutton', { name: 'Port' });

        it('previous: an emptied field keeps its value and shows it again when it is left', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('NumberInput', {
                    'aria-label': 'Port',
                    defaultValue: 22,
                    emptyFallback: 'previous',
                    [onValue]: onChange,
                })
            );
            await userEvent.clear(field());
            expect(onChange).not.toHaveBeenCalledWith(null);
            await userEvent.tab();
            await waitFor(() => expect(field()).toHaveValue('22'));
            expect(onChange).not.toHaveBeenCalledWith(null);
        });

        it('previous: the last valid number, also after typing another one', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('NumberInput', {
                    'aria-label': 'Port',
                    defaultValue: 22,
                    emptyFallback: 'previous',
                    [onValue]: onChange,
                })
            );
            await userEvent.clear(field());
            await userEvent.type(field(), '2222');
            expect(onChange).toHaveBeenLastCalledWith(2222);
            await userEvent.clear(field());
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(field()).toHaveValue('2,222'));
            expect(onChange).toHaveBeenLastCalledWith(2222);
        });

        it('min: an emptied field becomes the minimum when it is left', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('NumberInput', {
                    'aria-label': 'Port',
                    [valueProp]: 22,
                    min: 1,
                    emptyFallback: 'min',
                    [onValue]: onChange,
                })
            );
            await userEvent.clear(field());
            await userEvent.tab();
            await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(1));
            expect(onChange).not.toHaveBeenCalledWith(null);
        });

        it('without it an emptied field reports null (default)', async () => {
            const onChange = vi.fn();
            await render(framework, el('NumberInput', { 'aria-label': 'Port', defaultValue: 22, [onValue]: onChange }));
            await userEvent.clear(field());
            expect(onChange).toHaveBeenLastCalledWith(null);
            await userEvent.tab();
            expect(field()).toHaveValue('');
        });
    });

    describe('Select emptyValue', () => {
        const items = [
            { value: 'ssh', label: 'SSH' },
            { value: 'sftp', label: 'SFTP' },
        ];
        afterEach(() => vi.restoreAllMocks());

        it('the empty string counts as nothing chosen: placeholder, no warning, clearing gives it back', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const onChange = vi.fn();
            await render(
                framework,
                el('Select', {
                    'aria-label': 'Protocol',
                    items,
                    placeholder: 'Choose',
                    defaultValue: '',
                    emptyValue: '',
                    clearable: true,
                    [onValue]: onChange,
                })
            );
            const trigger = screen.getByRole('combobox', { name: 'Protocol' });
            expect(trigger).toHaveTextContent('Choose');
            await userEvent.click(trigger);
            await userEvent.click(await screen.findByRole('option', { name: 'SFTP' }));
            expect(onChange).toHaveBeenLastCalledWith('sftp');
            await userEvent.click(screen.getByRole('button', { name: /clear/i }));
            expect(onChange).toHaveBeenLastCalledWith('');
            expect(warn.mock.calls.flat().join(' ')).not.toContain('not among its items');
        });

        it('without it clearing gives null (default)', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('Select', {
                    'aria-label': 'Protocol',
                    items,
                    defaultValue: 'ssh',
                    clearable: true,
                    [onValue]: onChange,
                })
            );
            await userEvent.click(screen.getByRole('button', { name: /clear/i }));
            expect(onChange).toHaveBeenLastCalledWith(null);
        });
    });

    describe('Dialog focusFirst', () => {
        it('focuses the field marked data-autoselect and selects its text', async () => {
            let handle: { focusFirst(): HTMLElement | null } | HTMLElement | null = null;
            await render(
                framework,
                el(
                    'Dialog',
                    { defaultOpen: true },
                    el(
                        'DialogContent',
                        {
                            title: 'Rename',
                            ref: (value: typeof handle) => {
                                if (value) handle = value;
                            },
                        },
                        el('input', { 'aria-label': 'Host' }),
                        el('input', { 'aria-label': 'Name', defaultValue: 'my-server', 'data-autoselect': '' })
                    )
                )
            );
            const name = await screen.findByRole<HTMLInputElement>('textbox', { name: 'Name' });
            // Vue exposes focusFirst() on the content, React's ref is the element for the shared helper
            act(() => {
                if (framework === 'vue') (handle as { focusFirst(): HTMLElement | null }).focusFirst();
                else focusFirst(handle as HTMLElement);
            });
            expect(name).toHaveFocus();
            expect([name.selectionStart, name.selectionEnd]).toEqual([0, 'my-server'.length]);
        });
    });

    describe('Wizard', () => {
        const steps = [{ label: 'Host' }, { label: 'Login', validate: () => 'Sign-in was cancelled' }];
        const stepField = (index: number) =>
            index === 0
                ? el('input', { 'aria-label': 'Host' })
                : el('div', {}, el('button', { type: 'button' }, 'Help'), el('input', { 'aria-label': 'User' }));
        const renderStep = {
            $scoped: {
                step: {
                    react: 'renderStep',
                    args: (index: number) => ({ index }),
                    render: ({ index }: { index: number }) => stepField(index),
                },
            },
        };

        it('focusOnStepChange: Next moves the focus to the first field of the new step', async () => {
            await render(framework, el('Wizard', { steps, focusOnStepChange: true, ...renderStep }));
            await userEvent.click(screen.getByRole('button', { name: 'Next' }));
            await waitFor(() => expect(screen.getByRole('textbox', { name: 'User' })).toHaveFocus());
        });

        it('finishLabel names the last button; a text from validate is the error of the step', async () => {
            await render(framework, el('Wizard', { steps, defaultStep: 1, finishLabel: 'Create', ...renderStep }));
            await userEvent.click(screen.getByRole('button', { name: 'Create' }));
            expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in was cancelled');
        });

        it('without them: "Finish", the general error and the focus stays on the button (default)', async () => {
            const plain = [{ label: 'Host' }, { label: 'Login', validate: () => false }];
            await render(framework, el('Wizard', { steps: plain, ...renderStep }));
            const next = screen.getByRole('button', { name: 'Next' });
            await userEvent.click(next);
            await screen.findByRole('textbox', { name: 'User' });
            expect(next).toHaveFocus();
            await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
            expect(await screen.findByRole('alert')).not.toHaveTextContent('Sign-in');
        });
    });

    describe('ContextMenu opened by keyboard', () => {
        const items = [{ value: 'rename', label: 'Rename' }];

        it('before-open tells the keyboard (with the focused element) from the pointer', async () => {
            const onBeforeOpen = vi.fn();
            await render(
                framework,
                el(
                    'ContextMenu',
                    { items, onBeforeOpen },
                    el('ul', {}, el('li', { tabIndex: 0 }, 'host-1'), el('li', { tabIndex: 0 }, 'host-2'))
                )
            );
            const row = screen.getByText('host-2');
            const list = row.parentElement!;
            act(() => row.focus());
            fireEvent.keyDown(row, { key: 'F10', shiftKey: true });
            // Some browsers fire the keyboard's contextmenu on the area, not on the focused row
            fireEvent.contextMenu(list);
            expect(onBeforeOpen).toHaveBeenLastCalledWith(list, { source: 'keyboard', focused: row });
            await screen.findByRole('menu');
            await userEvent.keyboard('{Escape}');
            fireEvent.pointerDown(row, { pointerType: 'mouse', button: 2 });
            fireEvent.contextMenu(row, { clientX: 40, clientY: 40 });
            expect(onBeforeOpen).toHaveBeenLastCalledWith(row, { source: 'pointer', focused: null });
        });
    });

    describe('Tabs with panels elsewhere', () => {
        const tabs = (props: Record<string, unknown>) =>
            el(
                'Tabs',
                { label: 'Sessions', ...props },
                el(
                    'TabsList',
                    {},
                    el('TabsTrigger', { value: 'one', controls: 'pane-one' }, 'One'),
                    el('TabsTrigger', { value: 'two', controls: null }, 'Two'),
                    el('TabsTrigger', { value: 'three' }, 'Three')
                )
            );

        it('controls points a tab at its own element, null at none', async () => {
            await render(framework, tabs({ defaultValue: 'two' }));
            expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-controls', 'pane-one');
            expect(screen.getByRole('tab', { name: 'Two' })).not.toHaveAttribute('aria-controls');
        });

        it('a null value selects no tab; the first one stays reachable with Tab, the arrow keys move on', async () => {
            await render(framework, tabs({ [valueProp]: null }));
            const all = screen.getAllByRole('tab');
            await waitFor(() => expect(all.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]));
            expect(all.every((tab) => tab.getAttribute('aria-selected') === 'false')).toBe(true);
            await userEvent.tab();
            expect(all[0]).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(all[1]).toHaveFocus());
        });

        it('without a value no tab is in the Tab order (default)', async () => {
            await render(framework, tabs({}));
            expect(screen.getAllByRole('tab').map((tab) => tab.tabIndex)).toEqual([-1, -1, -1]);
        });
    });

    describe('display', () => {
        it('Progress status neutral: a grey fill', async () => {
            const container = await render(
                framework,
                el('Progress', { value: 40, label: 'Upload', status: 'neutral', barText: 'cancelled' })
            );
            expect(container.querySelector('[data-part=range]')).toHaveClass('bg-muted');
        });

        it('Avatar initials instead of the ones from the name', async () => {
            await render(framework, el('Avatar', { name: 'my-server', initials: 'MS' }));
            expect(screen.getByRole('img', { name: 'my-server' })).toHaveTextContent('MS');
        });

        it('Card size sm: smaller radius and padding', async () => {
            await render(framework, el('Card', { size: 'sm', title: 'host-1', 'data-testid': 'card' }, 'Linux'));
            expect(screen.getByTestId('card')).toHaveClass('rounded-xl', 'p-[var(--wc-card-p,0.75rem)]');
            expect(screen.getByTestId('card')).not.toHaveClass('rounded-card');
        });

        it('Code: the look of InlineCode, from the prop or the content', async () => {
            await render(framework, el('p', {}, el('Code', { code: 'npm i' }), el('Code', {}, 'pnpm add')));
            expect(screen.getByText('npm i').tagName).toBe('CODE');
            expect(screen.getByText('pnpm add')).toHaveClass('font-mono', 'bg-bg-2');
        });
    });
});

describe('focusFirst and autoselectElement', () => {
    afterEach(() => document.body.replaceChildren());
    const mount = (html: string) => {
        document.body.innerHTML = html;
        return document.body.firstElementChild as HTMLElement;
    };

    it('takes the marked element (selecting with data-autoselect), otherwise the first field', () => {
        const box = mount(
            '<div><button>Help</button><input aria-label="A"><span data-autoselect><input aria-label="B" value="abc"></span></div>'
        );
        const b = box.querySelector<HTMLInputElement>('[aria-label=B]')!;
        expect(focusFirst(box)).toBe(b);
        expect([b.selectionStart, b.selectionEnd]).toEqual([0, 3]);
        const plain = mount('<div><button>Help</button><input aria-label="A" disabled><input aria-label="C"></div>');
        expect(focusFirst(plain)).toBe(plain.querySelector('[aria-label=C]'));
        expect(focusFirst(mount('<div><button>Only a button</button></div>'))).toBeNull();
    });

    it('autoselectElement: the element for a dialog to focus, selected once it has the focus', () => {
        const box = mount('<div><input aria-label="A"><input aria-label="B" value="abc" data-autoselect></div>');
        const b = autoselectElement(box)!;
        expect(b).toBe(box.querySelector('[aria-label=B]'));
        b.focus();
        expect([(b as HTMLInputElement).selectionStart, (b as HTMLInputElement).selectionEnd]).toEqual([0, 3]);
        expect(autoselectElement(mount('<div><input></div>'))).toBeUndefined();
    });
});

describe('resolveTokens and watchTokens', () => {
    const root = document.documentElement;
    afterEach(() => {
        root.removeAttribute('style');
        root.removeAttribute('data-mode');
    });

    it('gives the token colours as hex – translucent ones with alpha', () => {
        root.style.setProperty('--wc-bg', '#112233');
        root.style.setProperty('--wc-line', 'rgba(0, 0, 0, 0.5)');
        root.style.setProperty('--wc-primary', 'oklch(0.5 0 0)');
        const tokens = resolveTokens();
        expect(tokens.bg).toBe('#112233');
        expect(tokens.line).toBe('#00000080');
        expect(tokens.primary).toMatch(/^#([0-9a-f]{2})\1\1$/);
    });

    it('reports another mode on the page', async () => {
        const onChange = vi.fn();
        const stop = watchTokens(onChange);
        root.dataset.mode = 'dark';
        await waitFor(() => expect(onChange).toHaveBeenCalled());
        stop();
    });
});
