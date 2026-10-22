import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { el, frameworks, render } from './harness.js';

// Text controls: clear button, success state, counter, masks, password checklist, error summary

describe.each(frameworks)('%s', (framework) => {
    const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';

    it('Input clearable: the clear button empties the field and focuses it', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Input', {
                'aria-label': 'Search',
                clearable: true,
                [framework === 'vue' ? 'onUpdate:modelValue' : 'onChange']: onChange,
            })
        );
        const input = screen.getByRole('textbox', { name: 'Search' });
        expect(screen.queryByRole('button', { name: 'Clear input' })).not.toBeInTheDocument();
        await userEvent.type(input, 'Server');
        const clear = await screen.findByRole('button', { name: 'Clear input' });
        expect(clear).toHaveAttribute('tabindex', '-1');
        await userEvent.click(clear);
        expect(input).toHaveValue('');
        expect(input).toHaveFocus();
        expect(screen.queryByRole('button', { name: 'Clear input' })).not.toBeInTheDocument();
        const last = onChange.mock.lastCall![0];
        expect(framework === 'vue' ? last : last.target.value).toBe('');
    });

    it('Input loading is busy; Field success describes the control', async () => {
        await render(
            framework,
            el('Field', { label: 'Username', success: 'Is still available' }, el('Input', { loading: true }))
        );
        const input = screen.getByRole('textbox', { name: 'Username' });
        expect(input).toHaveAttribute('aria-busy', 'true');
        await waitFor(() => expect(input).toHaveAccessibleDescription('Is still available'));
    });

    it('Field optional marks the label', async () => {
        await render(framework, el('Field', { label: 'Company', optional: true }, el('Input', {})));
        // jsdom joins the label parts without the space browsers keep
        expect(screen.getByRole('textbox', { name: /^Company ?\(optional\)$/ })).toBeInTheDocument();
    });

    it('Textarea counter: visible count, remaining characters announced after a pause', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
        try {
            await render(framework, el('Textarea', { 'aria-label': 'Message', showCount: true, maxLength: 20 }));
            const area = screen.getByRole('textbox', { name: 'Message' });
            expect(screen.getByText('0 / 20')).toBeInTheDocument();
            await userEvent.type(area, 'Hello', { advanceTimers: vi.advanceTimersByTime });
            expect(screen.getByText('5 / 20')).toBeInTheDocument();
            expect(screen.getByRole('status')).toHaveTextContent('');
            await act(async () => vi.advanceTimersByTime(1100));
            expect(screen.getByRole('status')).toHaveTextContent('15 of 20 characters left');
            expect(area).toHaveAccessibleDescription('5 / 20');
        } finally {
            vi.useRealTimers();
        }
    });

    it('MaskInput reports completion, the raw value and clears an incomplete value on blur', async () => {
        const onComplete = vi.fn();
        const onChange = vi.fn();
        await render(
            framework,
            el('MaskInput', {
                mask: '99/99',
                'aria-label': 'Expiry',
                autoClear: true,
                unmask: true,
                onComplete,
                [onValue]: onChange,
            })
        );
        const input = screen.getByRole('textbox', { name: 'Expiry' });
        await userEvent.type(input, '12');
        expect(input).toHaveValue('12');
        await userEvent.tab();
        expect(input).toHaveValue('');
        expect(onChange).toHaveBeenLastCalledWith('', ...(framework === 'react' ? [''] : []));
        await userEvent.type(input, '1234');
        expect(input).toHaveValue('12/34');
        expect(onChange).toHaveBeenLastCalledWith('1234', ...(framework === 'react' ? ['1234'] : []));
        expect(onComplete).toHaveBeenCalledOnce();
        expect(onComplete).toHaveBeenCalledWith('12/34');
        await userEvent.tab();
        expect(input).toHaveValue('12/34');
    });

    it('PasswordInput checklist: each rule with its state, linked to the input', async () => {
        await render(
            framework,
            el('PasswordInput', {
                'aria-label': 'New password',
                requirements: [
                    { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
                    { label: 'One digit', test: /\d/ },
                ],
            })
        );
        const input = screen.getByLabelText('New password');
        const list = screen.getByRole('list', { name: 'Password requirements' });
        const items = () =>
            within(list)
                .getAllByRole('listitem')
                .map((item) => item.textContent?.trim());
        expect(items()).toEqual(['At least 8 characters: not met', 'One digit: not met']);
        await userEvent.type(input, 'abc1');
        expect(items()).toEqual(['At least 8 characters: not met', 'One digit: met']);
        expect(input.getAttribute('aria-describedby')).toContain(list.id);
    });

    it('PasswordInput visible can be controlled', async () => {
        const onVisible = vi.fn();
        await render(
            framework,
            el('PasswordInput', {
                'aria-label': 'Password',
                visible: true,
                [framework === 'vue' ? 'onUpdate:visible' : 'onVisibleChange']: onVisible,
            })
        );
        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
        await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
        expect(onVisible).toHaveBeenCalledWith(false);
    });

    it('FormErrorSummary takes the focus and leads to the field', async () => {
        await render(
            framework,
            el(
                'div',
                {},
                el('FormErrorSummary', {
                    errors: [{ message: 'Please enter the name', id: 'name' }, { message: 'Please agree' }],
                }),
                el('Field', { label: 'Name', id: 'name', error: 'Please enter the name' }, el('Input', {}))
            )
        );
        const summary = screen.getByRole('alert', { name: 'Please correct 2 entries' });
        await waitFor(() => expect(summary).toHaveFocus());
        expect(within(summary).getByText('Please agree')).toBeInTheDocument();
        await userEvent.click(within(summary).getByRole('link', { name: 'Please enter the name' }));
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
    });

    it('FormErrorSummary focuses again when focusKey changes', async () => {
        const errors = [{ message: 'Required', id: 'x' }];
        const { rerender } = await renderWithKey(framework, errors, 1);
        const summary = screen.getByRole('alert');
        await waitFor(() => expect(summary).toHaveFocus());
        fireEvent.blur(summary);
        (document.activeElement as HTMLElement | null)?.blur();
        await rerender(2);
        await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus());
    });
});

/** Renders a FormErrorSummary and lets the test change its focusKey */
async function renderWithKey(framework: 'vue' | 'react', errors: { message: string; id: string }[], key: number) {
    if (framework === 'react') {
        const { render: renderReact } = await import('@testing-library/react');
        const { FormErrorSummary } = await import('@wirecore/wirelayer-react');
        const { createElement } = await import('react');
        const view = renderReact(createElement(FormErrorSummary, { errors, focusKey: key }));
        return {
            rerender: async (next: number) => {
                view.rerender(createElement(FormErrorSummary, { errors, focusKey: next }));
            },
        };
    }
    const { render: renderVue } = await import('@testing-library/vue');
    const { FormErrorSummary } = await import('@wirecore/wirelayer-vue');
    const view = renderVue(FormErrorSummary, { props: { errors, focusKey: key } });
    return {
        rerender: async (next: number) => {
            await view.rerender({ errors, focusKey: next });
        },
    };
}
