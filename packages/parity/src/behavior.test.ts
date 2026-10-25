import { screen, waitFor, within } from '@testing-library/dom';
import { act } from '@testing-library/react';
import { toast as reactToast, toaster as reactToaster } from '@wirecore/wirelayer-react';
import { toast as vueToast, toaster as vueToaster } from '@wirecore/wirelayer-vue';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { el, frameworks, icon, render } from './harness.js';

describe.each(frameworks)('%s', (framework) => {
    /** v-model events in Vue, callbacks in React */
    const onChecked = framework === 'vue' ? 'onUpdate:checked' : 'onCheckedChange';
    const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';

    describe('SiteHeader', () => {
        const header = (props: Record<string, unknown> = {}) =>
            el('SiteHeader', {
                brand: 'WireLayer',
                items: [
                    { label: 'Software', href: '/software', current: true },
                    { label: 'Hosting', href: '/hosting' },
                ],
                ...props,
            });

        it('is a banner with a named navigation, a home link and the current page marked', async () => {
            await render(framework, header());
            expect(screen.getByRole('banner')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'WireLayer' })).toHaveAttribute('href', '/');
            const nav = screen.getByRole('navigation', { name: 'Main navigation' });
            expect(within(nav).getByRole('link', { name: 'Software' })).toHaveAttribute('aria-current', 'page');
        });

        it('opens and closes the mobile menu, a link click closes it', async () => {
            await render(framework, header());
            const toggle = screen.getByRole('button', { name: 'Menu' });
            expect(toggle).toHaveAttribute('aria-expanded', 'false');
            await userEvent.click(toggle);
            expect(toggle).toHaveAttribute('aria-expanded', 'true');
            const panelNavs = screen.getAllByRole('navigation', { name: 'Main navigation' });
            expect(panelNavs).toHaveLength(2);
            await userEvent.click(within(panelNavs[1]!).getByRole('link', { name: 'Hosting' }));
            await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'false'));
        });
    });

    describe('CtaSection', () => {
        it('is a region named by its title', async () => {
            await render(framework, el('CtaSection', { title: 'Tell us what you are planning.' }));
            expect(screen.getByRole('region', { name: 'Tell us what you are planning.' })).toBeInTheDocument();
            expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Tell us');
        });
    });

    describe('ModeToggle', () => {
        it('switches data-mode on the document and names the next action', async () => {
            localStorage.removeItem('wirecore-mode');
            delete document.documentElement.dataset.mode;
            await render(framework, el('ModeToggle', {}));
            const toggle = await screen.findByRole('button', { name: 'Switch to dark mode' });
            expect(document.documentElement.dataset.mode).toBe('light');
            await userEvent.click(toggle);
            expect(document.documentElement.dataset.mode).toBe('dark');
            expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
            expect(localStorage.getItem('wirecore-mode')).toBe('dark');
            delete document.documentElement.dataset.mode;
        });
    });

    describe('Menu', () => {
        it('opens a menu from its trigger and reports the selected item', async () => {
            const onSelect = vi.fn();
            await render(
                framework,
                el(
                    'Menu',
                    {
                        items: [
                            { value: 'edit', label: 'Edit', shortcut: '⌘E' },
                            { value: 'delete', label: 'Clear', danger: true },
                        ],
                        onSelect,
                    },
                    el('IconButton', { icon: icon('Ellipsis'), label: 'Actions' })
                )
            );
            const trigger = screen.getByRole('button', { name: 'Actions' });
            expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            await userEvent.click(trigger);
            expect(await screen.findByRole('menu')).toBeInTheDocument();
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
            await userEvent.click(screen.getByRole('menuitem', { name: 'Clear' }));
            expect(onSelect).toHaveBeenLastCalledWith('delete');
        });
    });

    describe('Dialog', () => {
        it('is named by its title, described by its description and closes with its close button', async () => {
            await render(
                framework,
                el(
                    'Dialog',
                    { role: 'alertdialog' },
                    el('DialogTrigger', {}, el('Button', {}, 'Delete server')),
                    el('DialogContent', {
                        title: 'Delete server?',
                        description: 'This cannot be undone.',
                    })
                )
            );
            await userEvent.click(screen.getByRole('button', { name: 'Delete server' }));
            const dialog = await screen.findByRole('alertdialog', { name: 'Delete server?' });
            expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            await userEvent.click(screen.getByRole('button', { name: 'Close' }));
            await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
        });
    });

    describe('Tooltip', () => {
        it('describes its trigger when focused', async () => {
            await render(
                framework,
                el('Tooltip', { content: 'Copy configuration', openDelay: 0 }, el('Button', {}, 'Copy'))
            );
            const trigger = screen.getByRole('button', { name: 'Copy' });
            await userEvent.tab();
            expect(trigger).toHaveFocus();
            await waitFor(() => expect(trigger).toHaveAccessibleDescription('Copy configuration'));
        });
    });

    describe('Toaster', () => {
        it('shows toasts in a named live region', async () => {
            const toast = framework === 'vue' ? vueToast : reactToast;
            const toaster = framework === 'vue' ? vueToaster : reactToaster;
            await render(framework, el('Toaster', {}));
            const region = screen.getByRole('region', { name: /Notifications/ });
            await act(async () => {
                toast({ title: 'Deployment complete', description: 'customer-portal · v2.4.1', type: 'success' });
            });
            const status = await within(region).findByRole('status');
            expect(status).toHaveTextContent('Deployment complete');
            expect(within(region).getByRole('button', { name: 'Close' })).toBeInTheDocument();
            await act(async () => toaster.remove());
        });
    });

    describe('Select', () => {
        it('is a combobox labelled by its Field and selects an option', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el(
                    'Field',
                    { label: 'Service' },
                    el('Select', {
                        items: [
                            { value: 'web', label: 'Software & Web' },
                            { value: 'hosting', label: 'Hosting' },
                        ],
                        [onValue]: onChange,
                    })
                )
            );
            const trigger = screen.getByRole('combobox', { name: 'Service' });
            expect(trigger).toHaveTextContent('Select');
            await userEvent.click(trigger);
            await userEvent.click(await screen.findByRole('option', { name: 'Hosting' }));
            expect(onChange).toHaveBeenLastCalledWith('hosting');
            expect(trigger).toHaveTextContent('Hosting');
        });
    });

    describe('Tabs', () => {
        it('is a named tablist and switches panels on click', async () => {
            await render(
                framework,
                el(
                    'Tabs',
                    { defaultValue: 'a', label: 'Project' },
                    el(
                        'TabsList',
                        {},
                        el('TabsTrigger', { value: 'a' }, 'Overview'),
                        el('TabsTrigger', { value: 'b' }, 'Process')
                    ),
                    el('TabsContent', { value: 'a' }, 'Content A'),
                    el('TabsContent', { value: 'b' }, 'Content B')
                )
            );
            expect(screen.getByRole('tablist', { name: 'Project' })).toBeInTheDocument();
            expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
            expect(screen.getByRole('tabpanel', { name: 'Overview' })).toHaveTextContent('Content A');
            await userEvent.click(screen.getByRole('tab', { name: 'Process' }));
            expect(screen.getByRole('tab', { name: 'Process' })).toHaveAttribute('aria-selected', 'true');
            expect(screen.getByRole('tabpanel', { name: 'Process' })).toHaveTextContent('Content B');
        });
    });

    describe('Steps', () => {
        it('marks the current step and tells screen readers the status of each step', async () => {
            await render(
                framework,
                el('Steps', {
                    items: [{ label: 'Understand' }, { label: 'Build' }, { label: 'Run' }],
                    current: 1,
                    label: 'Project process',
                })
            );
            const list = screen.getByRole('list', { name: 'Project process' });
            const items = list.querySelectorAll('li');
            expect(items[0]).toHaveTextContent('Understand, completed');
            expect(items[1]).toHaveAttribute('aria-current', 'step');
            expect(items[1]).toHaveTextContent('Build, current step');
            expect(items[2]).toHaveTextContent('Run, to do');
        });
    });

    describe('Pagination', () => {
        it('is a named navigation with labelled pages and an updating summary', async () => {
            const onChange = vi.fn();
            const onPage = framework === 'vue' ? 'onUpdate:page' : 'onPageChange';
            await render(framework, el('Pagination', { count: 12, pageSize: 4, [onPage]: onChange }));
            expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
            expect(screen.getByText('1–4 of 12')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
            expect(screen.getByRole('button', { name: 'Page 1 of 3' })).toHaveAttribute('aria-current', 'page');
            await userEvent.click(screen.getByRole('button', { name: 'Page 2 of 3' }));
            expect(onChange).toHaveBeenLastCalledWith(2);
            expect(screen.getByText('5–8 of 12')).toBeInTheDocument();
        });
    });

    describe('Progress', () => {
        it('is a named progressbar with value and German value text', async () => {
            await render(framework, el('Progress', { value: 68, label: 'BUILD' }));
            const bar = screen.getByRole('progressbar', { name: 'BUILD' });
            expect(bar).toHaveAttribute('aria-valuenow', '68');
            expect(bar).toHaveAttribute('aria-valuetext', '68 %');
            expect(screen.getByText('68 %')).toBeInTheDocument();
        });
    });

    describe('Checkbox', () => {
        it('is a named checkbox that toggles on click', async () => {
            const onChange = vi.fn();
            await render(framework, el('Checkbox', { [onChecked]: onChange, required: true }, 'I agree'));
            const checkbox = screen.getByRole('checkbox', { name: 'I agree' });
            expect(checkbox).not.toBeChecked();
            expect(checkbox).toBeRequired();
            await userEvent.click(screen.getByText('I agree'));
            expect(checkbox).toBeChecked();
            expect(onChange).toHaveBeenLastCalledWith(true);
        });

        it('cannot be toggled while disabled', async () => {
            await render(framework, el('Checkbox', { disabled: true }, 'Locked'));
            const checkbox = screen.getByRole('checkbox', { name: 'Locked' });
            await userEvent.click(screen.getByText('Locked'));
            expect(checkbox).toBeDisabled();
            expect(checkbox).not.toBeChecked();
        });
    });

    describe('Switch', () => {
        it('is announced as a switch with its description', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('Switch', { description: 'Notify on outages', [onChecked]: onChange }, 'Monitoring alerts')
            );
            const toggle = screen.getByRole('switch', { name: 'Monitoring alerts' });
            expect(toggle).toHaveAccessibleDescription('Notify on outages');
            await userEvent.click(screen.getByText('Monitoring alerts'));
            expect(toggle).toBeChecked();
            expect(onChange).toHaveBeenLastCalledWith(true);
        });
    });

    describe('RadioGroup', () => {
        it('is a named radiogroup and selects on click', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el(
                    'RadioGroup',
                    { label: 'Company size', [onValue]: onChange },
                    el('RadioGroupItem', { value: 'startup' }, 'Startup'),
                    el('RadioGroupItem', { value: 'corporate' }, 'Corporation')
                )
            );
            expect(screen.getByRole('radiogroup', { name: 'Company size' })).toBeInTheDocument();
            await userEvent.click(screen.getByText('Corporation'));
            expect(screen.getByRole('radio', { name: 'Corporation' })).toBeChecked();
            expect(onChange).toHaveBeenLastCalledWith('corporate');
        });
    });

    describe('ChipGroup', () => {
        it('toggles chips as pressed buttons in a named group', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el(
                    'ChipGroup',
                    { label: 'Services', defaultValue: ['web'], [onValue]: onChange },
                    el('Chip', { value: 'web' }, 'Software & Web'),
                    el('Chip', { value: 'ai' }, 'AI & LLM')
                )
            );
            expect(screen.getByRole('group', { name: 'Services' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Software & Web' })).toHaveAttribute('aria-pressed', 'true');
            await userEvent.click(screen.getByRole('button', { name: 'AI & LLM' }));
            expect(screen.getByRole('button', { name: 'AI & LLM' })).toHaveAttribute('aria-pressed', 'true');
            expect(onChange).toHaveBeenLastCalledWith(['web', 'ai']);
        });
    });

    describe('SegmentedControl', () => {
        it('is a named radiogroup and selects on click', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el(
                    'SegmentedControl',
                    { label: 'View', defaultValue: 'list', [onValue]: onChange },
                    el('SegmentedControlItem', { value: 'list' }, 'List'),
                    el('SegmentedControlItem', { value: 'grid' }, 'Grid')
                )
            );
            expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument();
            expect(screen.getByRole('radio', { name: 'List' })).toBeChecked();
            await userEvent.click(screen.getByText('Grid'));
            expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked();
            expect(onChange).toHaveBeenLastCalledWith('grid');
        });
    });

    describe('Button', () => {
        it('calls onClick', async () => {
            const onClick = vi.fn();
            await render(framework, el('Button', { onClick }, 'Save'));
            await userEvent.click(screen.getByRole('button', { name: 'Save' }));
            expect(onClick).toHaveBeenCalledOnce();
        });

        it('does not call onClick when disabled', async () => {
            const onClick = vi.fn();
            await render(framework, el('Button', { onClick, disabled: true }, 'Save'));
            await userEvent.click(screen.getByRole('button'));
            expect(onClick).not.toHaveBeenCalled();
        });

        it('stays focusable but ignores clicks while loading', async () => {
            const onClick = vi.fn();
            await render(framework, el('Button', { onClick, loading: true }, 'Sending'));
            const button = screen.getByRole('button', { name: 'Sending' });
            expect(button).toHaveAttribute('aria-busy', 'true');
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(button).toBeEnabled();
            button.focus();
            expect(button).toHaveFocus();
            await userEvent.click(button);
            expect(onClick).not.toHaveBeenCalled();
        });

        it('does not submit its form while loading', async () => {
            const onSubmit = vi.fn((event: Event) => event.preventDefault());
            await render(framework, el('form', { onSubmit }, el('Button', { type: 'submit', loading: true }, 'Send')));
            await userEvent.click(screen.getByRole('button', { name: 'Send' }));
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('renders the child element with asChild', async () => {
            await render(framework, el('Button', { asChild: true }, el('a', { href: '/contact' }, 'Contact')));
            expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
            expect(screen.queryByRole('button')).toBeNull();
        });
    });

    describe('IconButton', () => {
        it('uses the label as accessible name', async () => {
            await render(framework, el('IconButton', { icon: icon('Plus'), label: 'Add' }));
            expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
        });

        it('iconProps reach the icon of IconButton, Button and Badge – e.g. a filled icon', async () => {
            const filled = { fill: 'currentColor' };
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('IconButton', { icon: icon('Bell'), label: 'Favourite', iconProps: filled }),
                    el('Button', { leadingIcon: icon('Plus'), trailingIcon: icon('Check'), iconProps: filled }, 'Add'),
                    el('Badge', { icon: icon('Check'), iconProps: filled }, 'Done')
                )
            );
            const icons = [
                ...screen.getByRole('button', { name: 'Favourite' }).querySelectorAll('svg'),
                ...screen.getByRole('button', { name: 'Add' }).querySelectorAll('svg'),
                ...screen.getByText('Done').querySelectorAll('svg'),
            ];
            expect(icons).toHaveLength(4);
            for (const svg of icons) {
                expect(svg).toHaveAttribute('fill', 'currentColor');
                expect(svg).toHaveAttribute('aria-hidden', 'true');
            }
        });
    });

    describe('ToggleButton', () => {
        it('pressedIcon and pressedIconProps while pressed – the name stays the same', async () => {
            await render(
                framework,
                el(
                    'ToggleButton',
                    { icon: icon('Bell'), pressedIcon: icon('Check'), pressedIconProps: { fill: 'currentColor' } },
                    'Flagged only'
                )
            );
            const button = screen.getByRole('button', { name: 'Flagged only' });
            expect(button.querySelector('svg')).toHaveClass('lucide-bell');
            expect(button.querySelector('svg')).not.toHaveAttribute('fill', 'currentColor');
            await userEvent.click(button);
            expect(button).toHaveAttribute('aria-pressed', 'true');
            expect(screen.getByRole('button', { name: 'Flagged only' })).toBe(button);
            expect(button.querySelector('svg')).toHaveClass('lucide-check');
            expect(button.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
        });
    });

    describe('IconButton badge', () => {
        it('adds the badge to the accessible name', async () => {
            await render(framework, el('IconButton', { icon: icon('Bell'), label: 'Alerts', badge: 4 }));
            await render(framework, el('IconButton', { icon: icon('Mail'), label: 'Mailbox', badge: true }));
            expect(screen.getByRole('button', { name: 'Alerts, 4 new' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Mailbox, new' })).toBeInTheDocument();
        });

        it('accepts a custom badge label', async () => {
            const badgeLabel = (count: string | null) => `${count} unread`;
            await render(framework, el('IconButton', { icon: icon('Bell'), label: 'Inbox', badge: 120, badgeLabel }));
            const button = screen.getByRole('button', { name: 'Inbox, 99+ unread' });
            expect(button).toHaveTextContent('99+');
        });
    });

    describe('Avatar', () => {
        it('is one image named after the person, showing the initials', async () => {
            await render(framework, el('Avatar', { name: 'Anna Maria Schmidt' }));
            expect(screen.getByRole('img', { name: 'Anna Maria Schmidt' })).toHaveTextContent('AS');
        });

        it('is hidden from assistive tech without a name', async () => {
            const container = await render(framework, el('Avatar', {}));
            expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
            expect(screen.queryByRole('img')).toBeNull();
        });
    });

    describe('AvatarGroup', () => {
        it('is a named group with an announced overflow', async () => {
            await render(
                framework,
                el('AvatarGroup', { label: 'Project team', more: 5 }, el('Avatar', { name: 'Julia Klein' }))
            );
            expect(screen.getByRole('group', { name: 'Project team' })).toBeInTheDocument();
            expect(screen.getByRole('img', { name: '5 more' })).toHaveTextContent('+5');
        });

        it('passes its size to the avatars', async () => {
            await render(framework, el('AvatarGroup', { size: 'lg' }, el('Avatar', { name: 'Julia Klein' })));
            expect(screen.getByRole('img', { name: 'Julia Klein' })).toHaveClass('size-12');
        });
    });

    describe('Breadcrumb', () => {
        it('is a named navigation with the current page marked', async () => {
            await render(
                framework,
                el(
                    'Breadcrumb',
                    {},
                    el('BreadcrumbItem', { href: '/', icon: icon('House'), iconOnly: true }, 'Home'),
                    el('BreadcrumbItem', { href: '/services' }, 'Services'),
                    el('BreadcrumbItem', { current: true }, 'Hosting')
                )
            );
            const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
            expect(nav.querySelectorAll('ol > li')).toHaveLength(3);
            expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
            expect(screen.getByText('Hosting').closest('[aria-current]')).toHaveAttribute('aria-current', 'page');
        });
    });

    describe('StatusDot', () => {
        it('shows its label and hides the decorative dot', async () => {
            const container = await render(framework, el('StatusDot', { status: 'success' }, 'ONLINE'));
            expect(container).toHaveTextContent('ONLINE');
            expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
        });
    });

    describe('Spinner', () => {
        it('announces its label', async () => {
            await render(framework, el('Spinner', {}));
            expect(screen.getByRole('status')).toHaveTextContent('Loading');
        });
    });

    describe('Alert', () => {
        it('uses role alert for danger and status for info', async () => {
            await render(framework, el('Alert', { status: 'danger', title: 'Error' }));
            await render(framework, el('Alert', { status: 'info', title: 'Info' }));
            expect(screen.getByRole('alert')).toHaveTextContent('Error');
            expect(screen.getByRole('status')).toHaveTextContent('Info');
        });

        it('calls onDismiss', async () => {
            const onDismiss = vi.fn();
            await render(framework, el('Alert', { title: 'Note', dismissible: true, onDismiss }));
            await userEvent.click(screen.getByRole('button', { name: 'Close' }));
            expect(onDismiss).toHaveBeenCalledOnce();
        });
    });

    describe('Field + Input', () => {
        it('connects label, helper text and input', async () => {
            await render(framework, el('Field', { label: 'Name', helperText: 'First and last name' }, el('Input', {})));
            const input = screen.getByLabelText('Name');
            expect(input.tagName).toBe('INPUT');
            expect(input).toHaveAccessibleDescription('First and last name');
        });

        it('marks the input invalid and describes it with the error', async () => {
            await render(framework, el('Field', { label: 'Email', error: 'Invalid address' }, el('Input', {})));
            const input = screen.getByLabelText('Email');
            expect(input).toBeInvalid();
            expect(input).toHaveAccessibleDescription('Invalid address');
        });

        it('describes the input with helper text, prefix and suffix', async () => {
            await render(
                framework,
                el(
                    'Field',
                    { label: 'Domain', helperText: 'Without www' },
                    el('Input', { prefix: 'https://', suffix: '.de' })
                )
            );
            expect(screen.getByLabelText('Domain')).toHaveAccessibleDescription('Without www https:// .de');
        });

        it('passes required and disabled to the input', async () => {
            await render(framework, el('Field', { label: 'Name', required: true, disabled: true }, el('Input', {})));
            const input = screen.getByLabelText(/Name/);
            expect(input).toBeRequired();
            expect(input).toBeDisabled();
        });

        it('accepts typed text', async () => {
            const onInput = vi.fn();
            await render(framework, el('Input', { placeholder: 'Search', onInput }));
            const input = screen.getByPlaceholderText('Search');
            await userEvent.type(input, 'Hosting');
            expect(input).toHaveValue('Hosting');
            expect(onInput).toHaveBeenCalledTimes(7);
        });
    });

    describe('Textarea', () => {
        it('is labelled by its Field', async () => {
            await render(framework, el('Field', { label: 'Message' }, el('Textarea', {})));
            expect(screen.getByLabelText('Message').tagName).toBe('TEXTAREA');
        });
    });

    describe('ActionBar', () => {
        it('is a named toolbar with the count; the clear button reports it', async () => {
            const onClear = vi.fn();
            await render(framework, el('ActionBar', { count: 3, onClear }, el('Button', {}, 'Clear')));
            const bar = screen.getByRole('toolbar', { name: 'Actions for the selection' });
            expect(within(bar).getByRole('status')).toHaveTextContent('3 selected');
            await userEvent.click(within(bar).getByRole('button', { name: 'Clear selection' }));
            expect(onClear).toHaveBeenCalledOnce();
        });

        it('is not rendered without a selection', async () => {
            await render(framework, el('ActionBar', { count: 0 }));
            expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
        });
    });

    describe('Countdown', () => {
        it('shows the time left and reports the end', async () => {
            vi.useFakeTimers({
                now: new Date('2026-10-20T10:00:00'),
                toFake: ['Date', 'setInterval', 'clearInterval'],
            });
            try {
                const onComplete = vi.fn();
                await render(
                    framework,
                    el('Countdown', { target: '2026-10-20T10:01:02', label: 'Start in', onComplete })
                );
                const timer = screen.getByRole('timer', { name: 'Start in' });
                expect(timer).toHaveTextContent('00Days00Hours01Minute02Seconds');
                await act(async () => vi.advanceTimersByTime(62_000));
                await waitFor(() => expect(timer).toHaveTextContent('00Days00Hours00Minutes00Seconds'));
                expect(onComplete).toHaveBeenCalledOnce();
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe('NumberFormatter', () => {
        it('formats for the locale', async () => {
            await render(
                framework,
                el('NumberFormatter', { value: 1234.5, formatOptions: { style: 'currency', currency: 'EUR' } })
            );
            expect(document.body).toHaveTextContent('€1,234.50');
        });
    });
});

describe('Vue v-model', () => {
    it('emits update:modelValue for Input and Textarea', async () => {
        const onInputModel = vi.fn();
        const onTextareaModel = vi.fn();
        await render('vue', el('Input', { placeholder: 'a', 'onUpdate:modelValue': onInputModel }));
        await render('vue', el('Textarea', { placeholder: 'b', 'onUpdate:modelValue': onTextareaModel }));
        await userEvent.type(screen.getByPlaceholderText('a'), 'Web');
        await userEvent.type(screen.getByPlaceholderText('b'), 'AI');
        expect(onInputModel).toHaveBeenLastCalledWith('Web');
        expect(onTextareaModel).toHaveBeenLastCalledWith('AI');
    });
});

describe.each(frameworks)('%s option lists', (framework) => {
    const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';
    const services = [
        { value: 'web', label: 'Software & Web' },
        { value: 'hosting', label: 'Hosting' },
        { value: 'hardware', label: 'Hardware', disabled: true },
    ];
    const grouped = [
        { value: 'web', label: 'Software & Web', group: 'Development' },
        { value: 'fra', label: 'Frankfurt', group: 'Data centers', description: 'Tier III' },
        { value: 'ai', label: 'AI & LLM', group: 'Development' },
        { value: 'nbg', label: 'Nürnberg', group: 'Data centers', disabled: true },
    ];
    const people = [
        { id: 1, name: 'Anna Berg', team: 'Sales' },
        { id: 2, name: 'Jonas Weber', team: 'Engineering' },
    ];
    const names = (options: HTMLElement[]) => options.map((option) => option.textContent?.trim());
    const open = async (name: string) => {
        await userEvent.click(screen.getByRole('combobox', { name }));
        return screen.findAllByRole('option');
    };

    it('Select returns objects as they are', async () => {
        const onObject = vi.fn();
        await render(
            framework,
            el('Select', { items: people, itemLabel: 'name', 'aria-label': 'Person', [onValue]: onObject })
        );
        await open('Person');
        await userEvent.click(screen.getByRole('option', { name: 'Jonas Weber' }));
        expect(onObject).toHaveBeenLastCalledWith({ id: 2, name: 'Jonas Weber', team: 'Engineering' });
        expect(screen.getByRole('combobox', { name: 'Person' })).toHaveTextContent('Jonas Weber');
    });

    it('Select returns numbers as numbers', async () => {
        const onNumber = vi.fn();
        await render(
            framework,
            el('Select', {
                items: people,
                itemValue: 'id',
                itemLabel: 'name',
                'aria-label': 'Number',
                [onValue]: onNumber,
            })
        );
        await open('Number');
        await userEvent.click(screen.getByRole('option', { name: 'Anna Berg' }));
        expect(onNumber).toHaveBeenLastCalledWith(1);
    });

    it('Select recognises an object value by valueKey and shows a value that is not loaded yet', async () => {
        await render(
            framework,
            el('Select', {
                items: people,
                itemLabel: 'name',
                valueKey: 'id',
                defaultValue: { id: 2, name: 'Jonas Weber' },
                'aria-label': 'Person',
            })
        );
        expect(screen.getByRole('combobox', { name: 'Person' })).toHaveTextContent('Jonas Weber');
        await open('Person');
        expect(screen.getByRole('option', { name: 'Jonas Weber' })).toHaveAttribute('aria-selected', 'true');
    });

    it('Select clears with its button (not a tab stop) and with Backspace', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Select', {
                items: services,
                defaultValue: 'web',
                clearable: true,
                'aria-label': 'Service',
                [onValue]: onChange,
            })
        );
        const trigger = screen.getByRole('combobox', { name: 'Service' });
        const clear = screen.getByRole('button', { name: 'Clear selection' });
        expect(clear).toHaveAttribute('tabindex', '-1');
        await userEvent.click(clear);
        expect(onChange).toHaveBeenLastCalledWith(null);
        expect(trigger).toHaveTextContent('Select');
        expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();

        await open('Service');
        await userEvent.click(screen.getByRole('option', { name: 'Hosting' }));
        expect(onChange).toHaveBeenLastCalledWith('hosting');
        trigger.focus();
        await userEvent.keyboard('{Backspace}');
        expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it('Select shows loading state and lists grouped items under named groups', async () => {
        await render(framework, el('Select', { items: grouped, loading: true, 'aria-label': 'Service' }));
        expect(screen.getByRole('combobox', { name: 'Service' })).toHaveAttribute('aria-busy', 'true');
        await open('Service');
        expect(screen.getByText('Loading')).toBeInTheDocument();
        const development = screen.getByRole('group', { name: 'Development' });
        expect(names(within(development).getAllByRole('option'))).toEqual(['Software & Web', 'AI & LLM']);
        const centres = screen.getByRole('group', { name: 'Data centers' });
        expect(within(centres).getByRole('option', { name: /Frankfurt/ })).toHaveTextContent('Tier III');
    });

    it('Select filters with the search field, ignoring case and accents', async () => {
        const onFilter = vi.fn();
        await render(
            framework,
            el('Select', { items: grouped, filter: true, 'aria-label': 'Service', onFilterChange: onFilter })
        );
        await open('Service');
        const search = screen.getByRole('combobox', { name: 'Filter options' });
        await userEvent.type(search, 'NU');
        expect(names(screen.getAllByRole('option'))).toEqual(['Nürnberg']);
        expect(onFilter).toHaveBeenLastCalledWith('NU');
        await userEvent.type(search, 'x');
        expect(screen.getByRole('option', { name: 'No results' })).toHaveAttribute('aria-disabled', 'true');
    });

    it('Select: an item with the value null ("All") is a choice of its own', async () => {
        const onChange = vi.fn();
        const choices = [
            { value: null, label: 'All' },
            { value: true, label: 'Active' },
            { value: false, label: 'Archived' },
        ];
        await render(
            framework,
            el('Select', { items: choices, defaultValue: null, 'aria-label': 'Status', [onValue]: onChange })
        );
        const trigger = screen.getByRole('combobox', { name: 'Status' });
        expect(trigger).toHaveTextContent('All');
        await open('Status');
        expect(screen.getByRole('option', { name: 'All' })).toHaveAttribute('aria-selected', 'true');
        await userEvent.click(screen.getByRole('option', { name: 'Archived' }));
        expect(onChange).toHaveBeenLastCalledWith(false);
        await open('Status');
        await userEvent.click(screen.getByRole('option', { name: 'All' }));
        expect(onChange).toHaveBeenLastCalledWith(null);
        expect(trigger).toHaveTextContent('All');
    });

    it('Select, MultiSelect and Combobox also find items by itemKeywords', async () => {
        const categories = [
            { value: 'rent', label: 'Rent', parent: 'Housing' },
            { value: 'power', label: 'Electricity', parent: 'Housing' },
            { value: 'fuel', label: 'Fuel', parent: 'Car' },
        ];
        await render(
            framework,
            el(
                'div',
                {},
                el('Select', { items: categories, itemKeywords: 'parent', filter: true, 'aria-label': 'Category' }),
                el('MultiSelect', {
                    items: categories,
                    itemKeywords: (item: { parent: string }) => [item.parent],
                    filter: true,
                    'aria-label': 'Categories',
                })
            )
        );
        await open('Category');
        await userEvent.type(screen.getByRole('combobox', { name: 'Filter options' }), 'hous');
        expect(names(screen.getAllByRole('option'))).toEqual(['Rent', 'Electricity']);
        await userEvent.keyboard('{Escape}');
        await open('Categories');
        await userEvent.type(screen.getByRole('combobox', { name: 'Filter options' }), 'car');
        expect(names(screen.getAllByRole('option'))).toEqual(['Fuel']);
    });

    it('Combobox finds items by itemKeywords', async () => {
        const categories = [
            { value: 'rent', label: 'Rent', parent: 'Housing' },
            { value: 'fuel', label: 'Fuel', parent: 'Car' },
        ];
        await render(
            framework,
            el('Combobox', { items: categories, itemKeywords: 'parent', 'aria-label': 'Category' })
        );
        await userEvent.type(screen.getByRole('combobox', { name: 'Category' }), 'car');
        expect(names(await screen.findAllByRole('option'))).toEqual(['Fuel']);
    });

    it('MultiSelect with manualFilter reports the text and leaves the items alone', async () => {
        const onFilter = vi.fn();
        await render(
            framework,
            el('MultiSelect', {
                items: grouped,
                filter: true,
                manualFilter: true,
                'aria-label': 'Services',
                onFilterChange: onFilter,
            })
        );
        await open('Services');
        await userEvent.type(screen.getByRole('combobox', { name: 'Filter options' }), 'zz');
        expect(onFilter).toHaveBeenLastCalledWith('zz');
        expect(screen.getAllByRole('option')).toHaveLength(4);
    });

    it('MultiSelect stops at max and announces it', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('MultiSelect', { items: services, max: 1, 'aria-label': 'Services', [onValue]: onChange })
        );
        await open('Services');
        await userEvent.click(screen.getByRole('option', { name: 'Software & Web' }));
        expect(onChange).toHaveBeenLastCalledWith(['web']);
        expect(screen.getByRole('option', { name: 'Hosting' })).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByRole('status')).toHaveTextContent('At most 1 can be selected');
    });

    it('MultiSelect "select all" takes the enabled options in view', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('MultiSelect', {
                items: grouped,
                selectAll: true,
                filter: true,
                'aria-label': 'Services',
                [onValue]: onChange,
            })
        );
        await open('Services');
        const all = screen.getByRole('checkbox', { name: 'Select all' });
        expect(all).toHaveAttribute('aria-checked', 'false');
        await userEvent.click(all);
        expect(onChange).toHaveBeenLastCalledWith(['web', 'fra', 'ai']);
        expect(all).toHaveAttribute('aria-checked', 'true');
        await userEvent.type(screen.getByRole('combobox', { name: 'Filter options' }), 'ai');
        await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
        expect(onChange).toHaveBeenLastCalledWith(['web', 'fra']);
    });

    it('MultiSelect chips: named remove buttons, Backspace removes the last chip', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('MultiSelect', {
                items: services,
                defaultValue: ['web', 'hosting'],
                display: 'chips',
                'aria-label': 'Services',
                [onValue]: onChange,
            })
        );
        await userEvent.click(screen.getByRole('button', { name: 'Remove Software & Web' }));
        expect(onChange).toHaveBeenLastCalledWith(['hosting']);
        expect(screen.getByRole('status')).toHaveTextContent('Software & Web removed');
        screen.getByRole('combobox', { name: 'Services' }).focus();
        await userEvent.keyboard('{Backspace}');
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(screen.getByRole('combobox', { name: 'Services' })).toHaveTextContent('Select');
    });

    it('renders options and the value with own content (slots / render functions)', async () => {
        await render(
            framework,
            el('Select', {
                items: people,
                itemValue: 'id',
                itemLabel: 'name',
                defaultValue: 1,
                'aria-label': 'Person',
                $scoped: {
                    item: {
                        react: 'renderItem',
                        args: (item: never, state: Record<string, unknown>) => ({ item, ...state }),
                        render: ({ item, selected }: { item: { name: string; team: string }; selected: boolean }) =>
                            el('span', {}, `${item.name} · ${item.team}${selected ? ' (selected)' : ''}`),
                    },
                    value: {
                        react: 'renderValue',
                        args: (item: never) => ({ item }),
                        render: ({ item }: { item: { name: string } }) => el('strong', {}, item.name),
                    },
                },
            })
        );
        expect(screen.getByRole('combobox', { name: 'Person' }).querySelector('strong')).toHaveTextContent('Anna Berg');
        await open('Person');
        expect(screen.getByRole('option', { name: 'Anna Berg · Sales (selected)' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Jonas Weber · Engineering' })).toBeInTheDocument();
    });

    it('asks for more items when the end of the list comes into view (hasMore)', async () => {
        const onLoadMore = vi.fn();
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                readonly callback: (entries: { isIntersecting: boolean }[]) => void;
                constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
                    this.callback = callback;
                }
                observe() {
                    this.callback([{ isIntersecting: true }]);
                }
                disconnect() {}
            }
        );
        await render(framework, el('Select', { items: services, hasMore: true, 'aria-label': 'Service', onLoadMore }));
        await open('Service');
        await waitFor(() => expect(onLoadMore).toHaveBeenCalled());
        vi.unstubAllGlobals();
    });

    it('Combobox shows the label of an object value and takes own entries (allowCustomValue)', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Combobox', {
                items: people,
                itemValue: 'id',
                itemLabel: 'name',
                defaultValue: 2,
                allowCustomValue: true,
                'aria-label': 'Person',
                [onValue]: onChange,
            })
        );
        const input = screen.getByRole('combobox', { name: 'Person' });
        expect(input).toHaveValue('Jonas Weber');
        // Pasted in one go: typed key by key, Ark's input sync (effects) can overwrite a key on a slow machine in jsdom
        // ("John De") – the own entry is what this test is about
        const user = userEvent.setup();
        await user.clear(input);
        await user.paste('John Doe');
        await waitFor(() => expect(input).toHaveValue('John Doe'));
        await user.keyboard('{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('John Doe');
        expect(input).toHaveValue('John Doe');
    });

    it('Listbox: named groups, filter and object values', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Listbox', {
                label: 'Contact person',
                items: people,
                itemValue: 'id',
                itemLabel: 'name',
                itemGroup: 'team',
                filter: true,
                [onValue]: onChange,
            })
        );
        expect(screen.getByRole('group', { name: 'Engineering' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('option', { name: 'Jonas Weber' }));
        expect(onChange).toHaveBeenLastCalledWith([2]);
        await userEvent.type(screen.getByRole('textbox', { name: 'Filter options' }), 'anna');
        expect(names(screen.getAllByRole('option'))).toEqual(['Anna Berg']);
    });

    it('TagsInput suggests entries; arrow keys and Enter add one', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('TagsInput', {
                'aria-label': 'Keywords',
                defaultValue: ['hosting'],
                suggestions: ['hosting', 'linux', 'docker'],
                [onValue]: onChange,
            })
        );
        const input = screen.getByRole('combobox', { name: 'Keywords' });
        await userEvent.type(input, 'LI');
        const list = screen.getByRole('listbox', { name: 'Suggestions' });
        expect(names(within(list).getAllByRole('option'))).toEqual(['linux']);
        await userEvent.keyboard('{ArrowDown}{Enter}');
        expect(onChange).toHaveBeenLastCalledWith(['hosting', 'linux']);
        expect(input).toHaveValue('');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('TagsInput suggestions from a data source: asked with the typed text', async () => {
        const onChange = vi.fn();
        const getItems = vi.fn(async ({ search = '' }: { search?: string }) => ({
            items: ['linux', 'lighttpd', 'docker'].filter((entry) => entry.startsWith(search.toLowerCase())),
        }));
        await render(
            framework,
            el('TagsInput', {
                'aria-label': 'Keywords',
                dataSource: { getItems },
                [onValue]: onChange,
            })
        );
        const input = screen.getByRole('combobox', { name: 'Keywords' });
        await userEvent.type(input, 'li');
        const list = await screen.findByRole('listbox', { name: 'Suggestions' });
        await waitFor(() => expect(names(within(list).getAllByRole('option'))).toEqual(['linux', 'lighttpd']));
        expect(getItems).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'li' }));
        await userEvent.keyboard('{ArrowDown}{Enter}');
        expect(onChange).toHaveBeenLastCalledWith(['linux']);
    });

    it('Autocomplete with multiple keeps several entries (values)', async () => {
        const onValues = vi.fn();
        await render(
            framework,
            el('Autocomplete', {
                items: [{ label: 'Purchasing' }, { label: 'Sales' }],
                multiple: true,
                'aria-label': 'Departments',
                [framework === 'vue' ? 'onUpdate:values' : 'onValuesChange']: onValues,
            })
        );
        const input = screen.getByRole('combobox', { name: 'Departments' });
        await userEvent.type(input, 'sal');
        await userEvent.click(screen.getByRole('option', { name: 'Sales' }));
        expect(onValues).toHaveBeenLastCalledWith(['Sales']);
        expect(input).toHaveValue('');
        // Ark empties the field directly – user-event still remembers the typed text
        await userEvent.clear(input);
        await userEvent.type(input, 'Warehouse{Enter}');
        expect(onValues).toHaveBeenLastCalledWith(['Sales', 'Warehouse']);
    });
});
