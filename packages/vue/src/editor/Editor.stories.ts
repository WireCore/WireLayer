import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../components/Field/Field.vue';
import Editor from './Editor.vue';

const initial =
    '<h2>Project brief</h2><p>We are building a <strong>customer portal</strong> with login, invoices and support.</p><ul><li><p>Kickoff in November</p></li><li><p>Go-live in March</p></li></ul>';

const meta = {
    title: 'Forms/Editor',
    component: Editor,
    args: { disabled: false, invalid: false },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { Editor, Field },
        setup: () => ({ args, html: ref(initial) }),
        template: `
            <div class="flex max-w-2xl flex-col gap-3">
                <Field label="Description" helper-text="Format via the toolbar or keyboard shortcuts (Ctrl+B …)">
                    <Editor v-bind="args" v-model="html" />
                </Field>
                <pre class="rounded-lg bg-bg-2 p-3 font-mono text-xs break-all whitespace-pre-wrap text-muted">{{ html || '–' }}</pre>
            </div>`,
    }),
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const FewTools: Story = { args: { toolbar: ['bold', 'italic', '|', 'bulletList', '|', 'link'] } };

const plan =
    '<h2>Go-live plan</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked><span></span></label><div><p>Move the domain</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Load test with 500 users</p></div></li></ul><table><tbody><tr><th><p>Phase</p></th><th><p>Date</p></th></tr><tr><td><p>Beta</p></td><td><p>03/02/2027</p></td></tr><tr><td><p>Go-live</p></td><td><p>03/30/2027</p></td></tr></tbody></table>';

/** Task list, table and image – images can also be uploaded (here as a local preview) */
export const Content: Story = {
    render: (args) => ({
        components: { Editor, Field },
        setup: () => ({
            args,
            html: ref(plan),
            upload: async (file: File) => URL.createObjectURL(file),
        }),
        template: `
            <div class="flex max-w-2xl flex-col gap-3">
                <Field label="Plan">
                    <Editor v-bind="args" v-model="html" :upload-image="upload" />
                </Field>
                <pre class="rounded-lg bg-bg-2 p-3 font-mono text-xs break-all whitespace-pre-wrap text-muted">{{ html || '–' }}</pre>
            </div>`,
    }),
};

const people = [
    { id: 'anna', label: 'Anna Berg' },
    { id: 'ben', label: 'Ben Ott' },
    { id: 'clara', label: 'Clara Weiß' },
    { id: 'david', label: 'David Kurz' },
];
const findPeople = (query: string) =>
    people.filter((person) => person.label.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

/** Bubble menu at selected text, floating menu in empty lines (both via Alt+F10), mentions, counter, image paste */
export const Menus: Story = {
    render: (args) => ({
        components: { Editor, Field },
        setup: () => ({
            args,
            html: ref('<p>Select text: the menu appears next to it. In an empty line: the insert menu.</p><p></p>'),
            findPeople,
            upload: async (file: File) => URL.createObjectURL(file),
        }),
        template: `
            <div class="flex max-w-2xl flex-col gap-3">
                <Field label="Note" helper-text="Alt+F10 opens the menu at the selection, Escape returns. @ mentions a person.">
                    <Editor
                        v-bind="args"
                        v-model="html"
                        :toolbar="['bold', 'italic', '|', 'undo', 'redo']"
                        bubble-menu
                        floating-menu
                        :mentions="findPeople"
                        placeholder="Write something …"
                        counter
                        :max-length="500"
                        :upload-image="upload"
                    />
                </Field>
                <pre class="rounded-lg bg-bg-2 p-3 font-mono text-xs break-all whitespace-pre-wrap text-muted">{{ html || '–' }}</pre>
            </div>`,
    }),
};

const report =
    '<h2>Report</h2><p style="text-align: center">Centered paragraph with <span style="color: color-mix(in srgb, var(--wc-danger) 75%, var(--wc-fg))">red</span> and <span style="background-color: color-mix(in oklab, var(--wc-warn) 20%, transparent)">highlighted</span> text, H<sub>2</sub>O and E = mc<sup>2</sup>.</p><h3>Appendix</h3><details open><summary>More details</summary><div data-type="detailsContent"><p>Expanded.</p></div></details>';

/** Alignment, token colors (contrast-checked), sub/superscript, details, invisible characters, HTML source */
export const MoreTools: Story = {
    render: (args) => ({
        components: { Editor, Field },
        setup: () => ({
            args,
            html: ref(report),
            toolbar: [
                'bold',
                'italic',
                'textColor',
                'backgroundColor',
                '|',
                'alignLeft',
                'alignCenter',
                'alignRight',
                'alignJustify',
                '|',
                'subscript',
                'superscript',
                'heading2',
                'heading3',
                'details',
                '|',
                'invisibleCharacters',
                'source',
                '|',
                'undo',
                'redo',
            ],
        }),
        template: `
            <div class="flex max-w-3xl flex-col gap-3">
                <Field label="Report">
                    <Editor v-bind="args" v-model="html" sticky-toolbar table-of-contents :toolbar="toolbar" />
                </Field>
                <pre class="rounded-lg bg-bg-2 p-3 font-mono text-xs break-all whitespace-pre-wrap text-muted">{{ html || '–' }}</pre>
            </div>`,
    }),
};

/** Read only: no toolbar, the text can be read and selected */
export const ReadOnly: Story = { args: { readonly: true } };
