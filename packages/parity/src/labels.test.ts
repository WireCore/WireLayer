import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { el, frameworks, render, type El } from './harness.js';

// A control with its own id, named by a native <label for> instead of a Field: the id must land on the element the
// label points to (the trigger or input), and Ark has to keep finding its parts.

const items = [
    { value: 'web', label: 'Software & Web' },
    { value: 'hosting', label: 'Hosting' },
];
const locations = [
    { value: 'de', label: 'Germany', children: [{ value: 'fra', label: 'Frankfurt' }] },
    { value: 'vie', label: 'Vienna' },
];
const fileTree = [{ id: 'documents', label: 'Documents', children: [{ id: 'report', label: 'Report.pdf' }] }];

/** Controls whose id lands on one element a label can point to, with the role of that element */
const labelled: [string, Record<string, unknown>, string][] = [
    ['Select', { items }, 'combobox'],
    ['MultiSelect', { items }, 'combobox'],
    ['VirtualSelect', { items }, 'combobox'],
    ['Combobox', { items }, 'combobox'],
    ['Autocomplete', { items: ['Berlin', 'Bremen'] }, 'combobox'],
    ['NumberInput', { defaultValue: 2 }, 'spinbutton'],
    ['TagsInput', {}, 'textbox'],
    ['Checkbox', {}, 'checkbox'],
    ['Switch', {}, 'switch'],
    ['QuarterPicker', {}, 'textbox'],
    ['CascadeSelect', { items: locations }, 'button'],
    ['TreeSelect', { items: fileTree }, 'button'],
    ['ColorPicker', { defaultValue: '#1e66f5' }, 'button'],
    ['ColorInput', { defaultValue: '#1e66f5' }, 'textbox'],
    ['Mentions', { items: [{ value: 'anna', label: 'Anna Berg' }] }, 'textbox'],
];

/**
 * Controls no label element can name (spin buttons, sliders, groups): the id lands on the element that stands for the
 * control (`true`) or stays Ark's id of the root (`false`), and a <label for> pointing at it warns in development
 */
const unlabelable: [string, Record<string, unknown>, El[], boolean][] = [
    ['DatePicker', {}, [], true],
    ['DateRangePicker', {}, [], true],
    ['MonthPicker', {}, [], true],
    ['YearPicker', {}, [], true],
    ['TimePicker', {}, [], true],
    ['TimeRangePicker', {}, [], true],
    ['DurationInput', {}, [], true],
    ['Knob', { defaultValue: 40 }, [], true],
    ['Rating', { defaultValue: 3 }, [], true],
    ['PinInput', {}, [], true],
    ['Listbox', { items }, [], true],
    ['AngleSlider', { defaultValue: 45 }, [], true],
    ['Slider', { label: 'Volume', defaultValue: [40] }, [], false],
    ['RadioGroup', { label: 'Size' }, [el('RadioGroupItem', { value: 's' }, 'Small')], false],
    ['SegmentedControl', { label: 'View' }, [el('SegmentedControlItem', { value: 'list' }, 'List')], false],
];

describe.each(frameworks)('%s', (framework) => {
    const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';
    const labelFor = framework === 'vue' ? 'for' : 'htmlFor';
    const withLabel = (control: El) => el('div', {}, el('label', { [labelFor]: 'x' }, 'Name'), control);

    it.each(labelled)('%s: the label names the control that carries the id', async (name, props, role) => {
        await render(framework, withLabel(el(name as El['type'], { ...props, id: 'x' })));
        expect(screen.getAllByRole(role, { name: 'Name' })[0]).toHaveAttribute('id', 'x');
    });

    it('PasswordInput: the label names the input that carries the id', async () => {
        await render(framework, withLabel(el('PasswordInput', { id: 'x' })));
        expect(screen.getByLabelText('Name')).toHaveAttribute('id', 'x');
    });

    it.each(unlabelable)('%s: an own id is kept, a <label for> warns', async (name, props, children, placed) => {
        // One id per framework and component – the warning is logged once per message
        const id = `${framework}-${name}`;
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        await render(
            framework,
            el(
                'div',
                {},
                el('label', { [labelFor]: id }, 'Name'),
                el(name as El['type'], { ...props, id }, ...children)
            )
        );
        if (placed) expect(document.getElementById(id)).not.toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(`<label for="${id}"> does not name the ${name}`));
        warn.mockRestore();
    });

    // Ark finds the trigger by its id to return the focus (keyboard and position: e2e/labels.spec.ts)
    it('Select: choosing returns the focus to the trigger with an own id', async () => {
        const onChange = vi.fn();
        await render(framework, withLabel(el('Select', { items, id: 'x', [onValue]: onChange })));
        const trigger = screen.getByRole('combobox', { name: 'Name' });
        await userEvent.click(trigger);
        await userEvent.click(await screen.findByRole('option', { name: 'Hosting' }));
        expect(onChange).toHaveBeenLastCalledWith('hosting');
        await waitFor(() => expect(trigger).toHaveFocus());
        expect(trigger).toHaveTextContent('Hosting');
    });

    it('NumberInput: arrow keys step the value with an own id', async () => {
        const onChange = vi.fn();
        await render(framework, withLabel(el('NumberInput', { defaultValue: 2, id: 'x', [onValue]: onChange })));
        const input = screen.getByRole('spinbutton', { name: 'Name' });
        input.focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(onChange).toHaveBeenLastCalledWith(3);
    });

    it('Combobox: typing filters and Enter chooses with an own id', async () => {
        const onChange = vi.fn();
        await render(framework, withLabel(el('Combobox', { items, id: 'x', [onValue]: onChange })));
        await userEvent.type(screen.getByRole('combobox', { name: 'Name' }), 'Host', { delay: 10 });
        await screen.findByRole('option', { name: 'Hosting' });
        await userEvent.keyboard('{ArrowDown}{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('hosting');
    });

    it('Checkbox: a click on the label checks it', async () => {
        const onChecked = vi.fn();
        const prop = framework === 'vue' ? 'onUpdate:checked' : 'onCheckedChange';
        await render(framework, withLabel(el('Checkbox', { id: 'x', [prop]: onChecked })));
        await userEvent.click(screen.getByText('Name'));
        expect(onChecked).toHaveBeenLastCalledWith(true);
    });

    it('Select inside a Field keeps the Field label, an own id included', async () => {
        await render(framework, el('Field', { label: 'Service', id: 'svc' }, el('Select', { items })));
        expect(screen.getByRole('combobox', { name: 'Service' })).toBeInTheDocument();
    });
});
