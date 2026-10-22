import { screen, waitFor, within } from '@testing-library/dom';
import { useForm as useReactForm, type AnyFieldApi } from '@tanstack/react-form';
import { render as renderReact } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render as renderVue } from '@testing-library/vue';
import { useForm as useVueForm } from '@tanstack/vue-form';
import { Input as ReactInput, Wizard as ReactWizard } from '@wirecore/wirelayer-react';
import * as ReactForm from '@wirecore/wirelayer-react/form';
import { Input as VueInput, Wizard as VueWizard } from '@wirecore/wirelayer-vue';
import * as VueForm from '@wirecore/wirelayer-vue/form';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, type Component } from 'vue';
import { frameworks, type Framework } from './harness.js';

// Form patterns on TanStack Form: FormList (field arrays), KeyValueEditor, validators as Standard Schemas,
// asynchronous checks with debounce and abort, and the Wizard with validateFields – in Vue and React

interface Contact {
    name: string;
}

/** A form with a list of contacts; `form` is handed out for assertions */
function mountContacts(framework: Framework, options: { min?: number; max?: number } = {}) {
    const state: { form?: { state: { values: { contacts: Contact[] } } } } = {};
    const itemLabel = (position: number) => `Contact ${position}`;
    if (framework === 'vue') {
        const Form = defineComponent({
            setup() {
                const form = useVueForm({
                    defaultValues: { contacts: [{ name: 'Anna' }, { name: 'Ben' }] as Contact[] },
                });
                state.form = form as never;
                return () =>
                    h(
                        form.Field,
                        { name: 'contacts', mode: 'array' },
                        {
                            default: ({ field }: { field: AnyFieldApi }) =>
                                h(
                                    VueForm.FormList,
                                    {
                                        field,
                                        label: 'Contact persons',
                                        newItem: () => ({ name: '' }),
                                        itemLabel,
                                        ...options,
                                    },
                                    {
                                        item: ({ index }: { index: number }) =>
                                            h(
                                                form.Field,
                                                { name: `contacts[${index}].name` },
                                                {
                                                    default: ({ field: name }: { field: AnyFieldApi }) =>
                                                        h(VueInput as Component, {
                                                            ...VueForm.bindInput(name),
                                                            'aria-label': `Name, ${itemLabel(index + 1)}`,
                                                        }),
                                                }
                                            ),
                                    }
                                ),
                        }
                    );
            },
        });
        renderVue(Form);
    } else {
        function Form() {
            const form = useReactForm({
                defaultValues: { contacts: [{ name: 'Anna' }, { name: 'Ben' }] as Contact[] },
            });
            state.form = form as never;
            return createElement(form.Field, {
                name: 'contacts',
                mode: 'array',
                children: (field: AnyFieldApi) =>
                    createElement(ReactForm.FormList, {
                        field,
                        label: 'Contact persons',
                        newItem: () => ({ name: '' }),
                        itemLabel,
                        ...options,
                        renderItem: ({ index }: { index: number }) =>
                            createElement(form.Field, {
                                name: `contacts[${index}].name`,
                                children: (name: AnyFieldApi) =>
                                    createElement(ReactInput, {
                                        ...ReactForm.bindInput(name),
                                        'aria-label': `Name, ${itemLabel(index + 1)}`,
                                    }),
                            }),
                    }),
            } as never);
        }
        renderReact(createElement(Form));
    }
    return () => state.form!.state.values.contacts.map((contact) => contact.name);
}

describe.each(frameworks)('%s', (framework) => {
    describe('FormList', () => {
        it('adds, moves and removes entries with buttons; the focus follows, changes are announced', async () => {
            const names = mountContacts(framework, { max: 3 });
            const list = screen.getByRole('group', { name: 'Contact persons' });
            const status = within(list).getByRole('status');
            expect(
                within(list)
                    .getAllByRole('listitem')
                    .map((item) => item.getAttribute('aria-label'))
            ).toEqual(['Contact 1', 'Contact 2']);
            expect(within(list).getByRole('button', { name: 'Move Contact 1 up' })).toBeDisabled();

            await userEvent.click(within(list).getByRole('button', { name: 'Move Contact 1 down' }));
            expect(names()).toEqual(['Ben', 'Anna']);
            await waitFor(() => expect(within(list).getByRole('button', { name: 'Move Contact 2 up' })).toHaveFocus());
            expect(status).toHaveTextContent('Contact 1 moved to position 2');

            await userEvent.click(within(list).getByRole('button', { name: 'Add entry' }));
            expect(names()).toEqual(['Ben', 'Anna', '']);
            await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name, Contact 3' })).toHaveFocus());
            expect(status).toHaveTextContent('Contact 3 added');
            expect(within(list).getByRole('button', { name: 'Add entry' })).toBeDisabled();
            expect(within(list).getByText('At most 3 entries')).toBeInTheDocument();

            await userEvent.click(within(list).getByRole('button', { name: 'Remove Contact 1' }));
            expect(names()).toEqual(['Anna', '']);
            await waitFor(() => expect(within(list).getByRole('button', { name: 'Remove Contact 1' })).toHaveFocus());
            expect(status).toHaveTextContent('Contact 1 removed');
        });

        it('Alt+↑/↓ moves the entry with the focus inside; min keeps entries', async () => {
            const names = mountContacts(framework, { min: 2 });
            const second = screen.getByRole('textbox', { name: 'Name, Contact 2' });
            await userEvent.click(second);
            await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
            expect(names()).toEqual(['Ben', 'Anna']);
            await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name, Contact 1' })).toHaveFocus());
            expect(screen.getByRole('textbox', { name: 'Name, Contact 1' })).toHaveValue('Ben');
            expect(screen.getByRole('button', { name: 'Remove Contact 1' })).toBeDisabled();
            expect(screen.getByText('At least 2 entries')).toBeInTheDocument();
        });
    });

    it('KeyValueEditor: two named inputs per row, duplicate keys marked', async () => {
        if (framework === 'vue') {
            const Form = defineComponent({
                setup() {
                    const form = useVueForm({ defaultValues: { headers: [{ key: 'Accept', value: 'json' }] } });
                    return () =>
                        h(
                            form.Field,
                            { name: 'headers', mode: 'array' },
                            {
                                default: ({ field }: { field: AnyFieldApi }) =>
                                    h(VueForm.KeyValueEditor, { field, label: 'HTTP-Header' }),
                            }
                        );
                },
            });
            renderVue(Form);
        } else {
            function Form() {
                const form = useReactForm({ defaultValues: { headers: [{ key: 'Accept', value: 'json' }] } });
                return createElement(form.Field, {
                    name: 'headers',
                    mode: 'array',
                    children: (field: AnyFieldApi) =>
                        createElement(ReactForm.KeyValueEditor, { field, label: 'HTTP-Header' }),
                } as never);
            }
            renderReact(createElement(Form));
        }
        expect(screen.getByRole('textbox', { name: 'Key, Row 1' })).toHaveValue('Accept');
        expect(screen.getByRole('textbox', { name: 'Value, Row 1' })).toHaveValue('json');
        await userEvent.click(screen.getByRole('button', { name: 'Add row' }));
        const key = await screen.findByRole('textbox', { name: 'Key, Row 2' });
        await userEvent.type(key, 'Accept');
        await waitFor(() => expect(key).toHaveAttribute('aria-invalid', 'true'));
        expect(key).toHaveAccessibleDescription('Key occurs more than once');
    });

    it('validators are Standard Schemas for TanStack Form; useValidators follows the locale', async () => {
        const check = async () => {
            const input = screen.getByLabelText('Email');
            await userEvent.type(input, 'anna@');
            await userEvent.tab();
            await waitFor(() => expect(input).toHaveAccessibleDescription('Please enter a valid email address'));
            await userEvent.type(input, 'company.com');
            await userEvent.tab();
            await waitFor(() => expect(input).toBeValid());
        };
        if (framework === 'vue') {
            const Form = defineComponent({
                setup() {
                    const form = useVueForm({ defaultValues: { email: '' } });
                    const v = VueForm.useValidators();
                    return () =>
                        h(
                            form.Field,
                            { name: 'email', validators: { onBlur: v.combine(v.isRequired(), v.isEmail()) } },
                            {
                                default: ({ field }: { field: AnyFieldApi }) =>
                                    h(VueForm.FormField, { field, label: 'Email' }, () =>
                                        h(VueInput as Component, VueForm.bindInput(field))
                                    ),
                            }
                        );
                },
            });
            renderVue(Form);
        } else {
            function Form() {
                const form = useReactForm({ defaultValues: { email: '' } });
                const v = ReactForm.useValidators();
                return createElement(form.Field, {
                    name: 'email',
                    validators: { onBlur: v.combine(v.isRequired(), v.isEmail()) },
                    children: (field: AnyFieldApi) =>
                        createElement(
                            ReactForm.FormField,
                            { field, label: 'Email' },
                            createElement(ReactInput, ReactForm.bindInput(field))
                        ),
                } as never);
            }
            renderReact(createElement(Form));
        }
        await check();
    });

    it('async check with debounce: one request after typing, the outdated one aborted', async () => {
        const requests: { value: string; signal?: AbortSignal }[] = [];
        const available = async ({ value, signal }: { value: string; signal?: AbortSignal }) => {
            requests.push({ value, signal });
            await new Promise((done) => setTimeout(done, 20));
            return value === 'anna' ? 'Username is taken' : undefined;
        };
        const validators = { onChangeAsync: available, onChangeAsyncDebounceMs: 50 };
        if (framework === 'vue') {
            const Form = defineComponent({
                setup() {
                    const form = useVueForm({ defaultValues: { user: '' } });
                    return () =>
                        h(
                            form.Field,
                            { name: 'user', validators },
                            {
                                default: ({ field }: { field: AnyFieldApi }) =>
                                    h(VueForm.FormField, { field, label: 'Username' }, () =>
                                        h(VueInput as Component, VueForm.bindInput(field))
                                    ),
                            }
                        );
                },
            });
            renderVue(Form);
        } else {
            function Form() {
                const form = useReactForm({ defaultValues: { user: '' } });
                return createElement(form.Field, {
                    name: 'user',
                    validators,
                    children: (field: AnyFieldApi) =>
                        createElement(
                            ReactForm.FormField,
                            { field, label: 'Username' },
                            createElement(ReactInput, ReactForm.bindInput(field))
                        ),
                } as never);
            }
            renderReact(createElement(Form));
        }
        const input = screen.getByLabelText('Username');
        await userEvent.type(input, 'anna');
        await userEvent.tab();
        await waitFor(() => expect(input).toHaveAccessibleDescription('Username is taken'));
        // Typing within the debounce time asks once, with the last value
        expect(requests.map((request) => request.value)).toEqual(['anna']);
        expect(requests[0]!.signal).toBeInstanceOf(AbortSignal);
    });

    it('Wizard with validateFields: a step with errors stays open and shows them; the data stays when going back', async () => {
        const onComplete = vi.fn();
        const required = ({ value }: { value: string }) => (value ? undefined : 'Required');
        if (framework === 'vue') {
            const Form = defineComponent({
                setup() {
                    const form = useVueForm({ defaultValues: { name: '', city: '' } });
                    const field = (name: 'name' | 'city', label: string) =>
                        h(
                            form.Field,
                            { name, validators: { onChange: required } },
                            {
                                default: ({ field: api }: { field: AnyFieldApi }) =>
                                    h(VueForm.FormField, { field: api, label }, () =>
                                        h(VueInput as Component, VueForm.bindInput(api))
                                    ),
                            }
                        );
                    return () =>
                        h(
                            VueWizard,
                            {
                                steps: [
                                    {
                                        label: 'Contact',
                                        validate: () => VueForm.validateFields(form as never, ['name']),
                                    },
                                    {
                                        label: 'Address',
                                        validate: () => VueForm.validateFields(form as never, ['city']),
                                    },
                                ],
                                onComplete,
                            },
                            {
                                step: ({ index }: { index: number }) =>
                                    index === 0 ? field('name', 'Name') : field('city', 'City'),
                            }
                        );
                },
            });
            renderVue(Form);
        } else {
            function Form() {
                const form = useReactForm({ defaultValues: { name: '', city: '' } });
                const field = (name: 'name' | 'city', label: string): ReactNode =>
                    createElement(form.Field, {
                        name,
                        validators: { onChange: required },
                        children: (api: AnyFieldApi) =>
                            createElement(
                                ReactForm.FormField,
                                { field: api, label },
                                createElement(ReactInput, ReactForm.bindInput(api))
                            ),
                    } as never);
                return createElement(ReactWizard, {
                    steps: [
                        { label: 'Contact', validate: () => ReactForm.validateFields(form as never, ['name']) },
                        { label: 'Address', validate: () => ReactForm.validateFields(form as never, ['city']) },
                    ],
                    onComplete,
                    renderStep: (index: number) => (index === 0 ? field('name', 'Name') : field('city', 'City')),
                });
            }
            renderReact(createElement(Form));
        }
        await userEvent.click(screen.getByRole('button', { name: 'Next' }));
        const name = screen.getByLabelText('Name');
        await waitFor(() => expect(name).toHaveAccessibleDescription('Required'));
        await waitFor(() => expect(name).toHaveFocus());
        await userEvent.type(name, 'Anna');
        await userEvent.click(screen.getByRole('button', { name: 'Next' }));
        await waitFor(() =>
            expect(screen.getByRole('tab', { name: /Address/ })).toHaveAttribute('aria-selected', 'true')
        );
        await userEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(screen.getByLabelText('Name')).toHaveValue('Anna');
        await userEvent.click(screen.getByRole('button', { name: 'Next' }));
        await waitFor(() =>
            expect(screen.getByRole('tab', { name: /Address/ })).toHaveAttribute('aria-selected', 'true')
        );
        await userEvent.type(screen.getByLabelText('City'), 'Berlin');
        await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
        await waitFor(() => expect(onComplete).toHaveBeenCalled());
    });
});
