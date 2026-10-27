import { screen, waitFor, within } from '@testing-library/dom';
import { render as renderReact } from '@testing-library/react';
import { render as renderVue } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { useForm as useReactForm } from '@tanstack/react-form';
import { useForm as useVueForm } from '@tanstack/vue-form';
import { FormErrorSummary as ReactFormErrorSummary, Input as ReactInput } from '@wirecore/wirelayer-react';
import {
    bindInput as bindReactInput,
    FormField as ReactFormField,
    useFormErrors as useReactFormErrors,
} from '@wirecore/wirelayer-react/form';
import { FormErrorSummary as VueFormErrorSummary, Input as VueInput } from '@wirecore/wirelayer-vue';
import {
    bindInput as bindVueInput,
    FormField as VueFormField,
    useFormErrors as useVueFormErrors,
} from '@wirecore/wirelayer-vue/form';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, type Component } from 'vue';
import { el, frameworks, render } from './harness.js';

const servers = [
    { id: 'web-01', name: 'web-01', location: 'Frankfurt', load: 42 },
    { id: 'db-primary', name: 'db-primary', location: 'Frankfurt', load: 71 },
    { id: 'k8s-node-3', name: 'k8s-node-3', location: 'Nuremberg', load: 18 },
    { id: 'backup-02', name: 'backup-02', location: 'Nuremberg', load: 96 },
];
const columns = [
    { id: 'name', header: 'Name', sortable: true },
    { id: 'location', header: 'Location' },
    { id: 'load', header: 'Load', sortable: true, align: 'end' },
];
const getRowId = (row: { id: string }) => row.id;
const firstColumn = (table: HTMLElement) =>
    within(table)
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.querySelector('td')?.textContent?.trim());

describe.each(frameworks)('%s', (framework) => {
    const on = (vue: string, react: string) => (framework === 'vue' ? vue : react);

    describe('DataTable', () => {
        it('is a table named by its caption and sorts with aria-sort', async () => {
            await render(framework, el('DataTable', { data: servers, columns, caption: 'Server', getRowId }));
            const table = screen.getByRole('table', { name: 'Server' });
            const header = screen.getByRole('columnheader', { name: /Load/ });
            expect(header).toHaveAttribute('aria-sort', 'none');
            expect(screen.getByRole('columnheader', { name: 'Location' })).not.toHaveAttribute('aria-sort');

            await userEvent.click(within(header).getByRole('button'));
            expect(header).toHaveAttribute('aria-sort', 'ascending');
            expect(firstColumn(table)).toEqual(['k8s-node-3', 'web-01', 'db-primary', 'backup-02']);
            await userEvent.click(within(header).getByRole('button'));
            expect(header).toHaveAttribute('aria-sort', 'descending');
            expect(firstColumn(table)[0]).toBe('backup-02');
        });

        it('paginates with the pagination named after the table', async () => {
            const onPage = vi.fn();
            await render(
                framework,
                el('DataTable', {
                    data: servers,
                    columns,
                    caption: 'Server',
                    getRowId,
                    pageSize: 2,
                    [on('onUpdate:page', 'onPageChange')]: onPage,
                })
            );
            const table = screen.getByRole('table', { name: 'Server' });
            expect(firstColumn(table)).toEqual(['web-01', 'db-primary']);
            const nav = screen.getByRole('navigation', { name: 'Server: Pagination' });
            await userEvent.click(within(nav).getByRole('button', { name: 'Page 2 of 2' }));
            expect(firstColumn(table)).toEqual(['k8s-node-3', 'backup-02']);
            expect(onPage).toHaveBeenLastCalledWith(2);
        });

        it('selects single rows and all rows of the page', async () => {
            const onSelection = vi.fn();
            await render(
                framework,
                el('DataTable', {
                    data: servers,
                    columns,
                    caption: 'Server',
                    getRowId,
                    selectable: true,
                    rowLabel: (row: { name: string }) => row.name,
                    [on('onUpdate:selection', 'onSelectionChange')]: onSelection,
                })
            );
            await userEvent.click(screen.getByRole('checkbox', { name: 'Select db-primary' }));
            expect(onSelection).toHaveBeenLastCalledWith(['db-primary']);
            await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
            expect(onSelection.mock.lastCall?.[0]).toHaveLength(4);
        });

        it('leaves sorting and paging to the server in manual mode', async () => {
            const onPage = vi.fn();
            const onSorting = vi.fn();
            await render(
                framework,
                el('DataTable', {
                    data: servers.slice(0, 2),
                    columns,
                    caption: 'Server',
                    getRowId,
                    manual: true,
                    rowCount: 40,
                    pageSize: 2,
                    [on('onUpdate:page', 'onPageChange')]: onPage,
                    [on('onUpdate:sorting', 'onSortingChange')]: onSorting,
                })
            );
            const table = screen.getByRole('table', { name: 'Server' });
            const header = screen.getByRole('columnheader', { name: /Load/ });
            await userEvent.click(within(header).getByRole('button'));
            expect(onSorting).toHaveBeenLastCalledWith({ id: 'load', desc: false });
            expect(firstColumn(table)).toEqual(['web-01', 'db-primary']);
            const nav = screen.getByRole('navigation', { name: 'Server: Pagination' });
            await userEvent.click(within(nav).getByRole('button', { name: 'Page 20 of 20' }));
            expect(onPage).toHaveBeenLastCalledWith(20);
            expect(firstColumn(table)).toEqual(['web-01', 'db-primary']);
        });

        it('shows the empty and loading states', async () => {
            await render(framework, el('DataTable', { data: [], columns, caption: 'Empty' }));
            expect(screen.getByRole('table', { name: 'Empty' })).toHaveTextContent('No entries');
            await render(framework, el('DataTable', { data: [], columns, caption: 'Loading', loading: true }));
            const loading = screen.getByRole('table', { name: 'Loading' });
            expect(loading).toHaveAttribute('aria-busy', 'true');
            expect(within(loading).getByRole('status')).toHaveTextContent('Loading');
        });
    });
});

describe('FormField (TanStack Form)', () => {
    const required = ({ value }: { value: string }) => (value ? undefined : 'Please enter an email address');

    async function check(framework: 'vue' | 'react') {
        const input = screen.getByLabelText('E-Mail');
        // classes reach the parts of the Field, class/className its root
        expect(screen.getByText('E-Mail')).toHaveClass('text-base');
        expect(input.closest('.col-span-2')).not.toBeNull();
        expect(input).toBeValid();
        await userEvent.click(input);
        await userEvent.tab();
        await waitFor(() => expect(input).toBeInvalid());
        expect(input).toHaveAccessibleDescription('Please enter an email address');
        await userEvent.type(input, 'max@company.com');
        // onBlur errors are re-validated when the field is left again
        await userEvent.tab();
        await waitFor(() => expect(input).toBeValid());
        expect(input).toHaveValue('max@company.com');
        if (framework === 'vue') await nextTick();
    }

    it('vue: label, error after blur, aria-invalid and value binding', async () => {
        const Form = defineComponent({
            setup() {
                const form = useVueForm({ defaultValues: { email: '' } });
                return () =>
                    h(
                        form.Field,
                        { name: 'email', validators: { onBlur: required, onChange: required } },
                        {
                            default: ({ field }: { field: Parameters<typeof bindVueInput>[0] }) =>
                                h(
                                    VueFormField,
                                    { field, label: 'E-Mail', classes: { label: 'text-base' }, class: 'col-span-2' },
                                    () => h(VueInput as Component, bindVueInput(field))
                                ),
                        }
                    );
            },
        });
        renderVue(Form);
        await check('vue');
    });

    it('react: label, error after blur, aria-invalid and value binding', async () => {
        function Form() {
            const form = useReactForm({ defaultValues: { email: '' } });
            return createElement(form.Field, {
                name: 'email',
                validators: { onBlur: required, onChange: required },
                children: (field) =>
                    createElement(
                        ReactFormField,
                        { field, label: 'E-Mail', classes: { label: 'text-base' }, className: 'col-span-2' },
                        createElement(ReactInput, bindReactInput(field))
                    ),
            });
        }
        renderReact(createElement(Form));
        await check('react');
    });
});

describe('FormErrorSummary with useFormErrors (TanStack Form)', () => {
    const required = ({ value }: { value: string }) => (value ? undefined : 'Please enter the name');

    async function check() {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Send' }));
        const summary = await screen.findByRole('alert', { name: 'Please correct 1 entry' });
        await waitFor(() => expect(summary).toHaveFocus());
        await userEvent.click(within(summary).getByRole('link', { name: 'Please enter the name' }));
        expect(screen.getByLabelText('Name')).toHaveFocus();
        // A second attempt focuses the summary again
        await userEvent.click(screen.getByRole('button', { name: 'Send' }));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus());
    }

    it('vue: lists the errors after submitting and links to the fields', async () => {
        const Form = defineComponent({
            setup() {
                const form = useVueForm({ defaultValues: { name: '' } });
                const summary = useVueFormErrors(form);
                return () =>
                    h('form', { onSubmit: (event: Event) => (event.preventDefault(), void form.handleSubmit()) }, [
                        h(VueFormErrorSummary as Component, {
                            errors: summary.errors.value,
                            focusKey: summary.attempts.value,
                        }),
                        h(
                            form.Field,
                            { name: 'name', validators: { onSubmit: required } },
                            {
                                default: ({ field }: { field: Parameters<typeof bindVueInput>[0] }) =>
                                    h(VueFormField, { field, label: 'Name', id: 'name' }, () =>
                                        h(VueInput as Component, bindVueInput(field))
                                    ),
                            }
                        ),
                        h('button', { type: 'submit' }, 'Send'),
                    ]);
            },
        });
        renderVue(Form);
        await check();
    });

    it('react: lists the errors after submitting and links to the fields', async () => {
        function Form() {
            const form = useReactForm({ defaultValues: { name: '' } });
            const summary = useReactFormErrors(form);
            return createElement(
                'form',
                {
                    onSubmit: (event: { preventDefault(): void }) => {
                        event.preventDefault();
                        void form.handleSubmit();
                    },
                },
                createElement(ReactFormErrorSummary, { errors: summary.errors, focusKey: summary.attempts }),
                createElement(form.Field, {
                    name: 'name',
                    validators: { onSubmit: required },
                    children: (field) =>
                        createElement(
                            ReactFormField,
                            { field, label: 'Name', id: 'name' },
                            createElement(ReactInput, bindReactInput(field))
                        ),
                }),
                createElement('button', { type: 'submit' }, 'Send')
            );
        }
        renderReact(createElement(Form));
        await check();
    });
});
