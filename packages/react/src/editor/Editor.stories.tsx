import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../components/Field/Field.js';
import { Editor, type EditorProps } from './Editor.js';

const initial =
    '<h2>Project brief</h2><p>We are building a <strong>customer portal</strong> with login, invoices and support.</p><ul><li><p>Kickoff in November</p></li><li><p>Go-live in March</p></li></ul>';

function Demo(args: EditorProps) {
    const [html, setHtml] = useState(initial);
    return (
        <div className="flex max-w-2xl flex-col gap-3">
            <Field label="Description" helperText="Format via the toolbar or keyboard shortcuts (Ctrl+B …)">
                <Editor {...args} value={html} onValueChange={setHtml} />
            </Field>
            <pre className="rounded-lg bg-bg-2 p-3 font-mono text-xs break-all whitespace-pre-wrap text-muted">
                {html || '–'}
            </pre>
        </div>
    );
}

const meta = {
    title: 'Forms/Editor',
    component: Editor,
    args: { disabled: false, invalid: false },
    parameters: { layout: 'padded' },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const FewTools: Story = { args: { toolbar: ['bold', 'italic', '|', 'bulletList', '|', 'link'] } };

const plan =
    '<h2>Go-live plan</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked><span></span></label><div><p>Move the domain</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Load test with 500 users</p></div></li></ul><table><tbody><tr><th><p>Phase</p></th><th><p>Date</p></th></tr><tr><td><p>Beta</p></td><td><p>03/02/2027</p></td></tr><tr><td><p>Go-live</p></td><td><p>03/30/2027</p></td></tr></tbody></table>';
const upload = async (file: File) => URL.createObjectURL(file);

function ContentDemo(args: EditorProps) {
    const [html, setHtml] = useState(plan);
    return (
        <div className="flex max-w-2xl flex-col gap-3">
            <Field label="Plan">
                <Editor {...args} value={html} onValueChange={setHtml} uploadImage={upload} />
            </Field>
            <pre className="rounded-lg bg-bg-2 p-3 font-mono text-xs break-all whitespace-pre-wrap text-muted">
                {html || '–'}
            </pre>
        </div>
    );
}

/** Task list, table and image – images can also be uploaded (here as a local preview) */
export const Content: Story = { render: (args) => <ContentDemo {...args} /> };

const people = [
    { id: 'anna', label: 'Anna Berg' },
    { id: 'ben', label: 'Ben Ott' },
    { id: 'clara', label: 'Clara Weiß' },
    { id: 'david', label: 'David Kurz' },
];
const findPeople = (query: string) =>
    people.filter((person) => person.label.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

function MenusDemo(args: EditorProps) {
    const [html, setHtml] = useState(
        '<p>Select text: the menu appears next to it. In an empty line: the insert menu.</p><p></p>'
    );
    return (
        <div className="flex max-w-2xl flex-col gap-3">
            <Field
                label="Note"
                helperText="Alt+F10 opens the menu at the selection, Escape returns. @ mentions a person."
            >
                <Editor
                    {...args}
                    value={html}
                    onValueChange={setHtml}
                    toolbar={['bold', 'italic', '|', 'undo', 'redo']}
                    bubbleMenu
                    floatingMenu
                    mentions={findPeople}
                    placeholder="Write something …"
                    counter
                    maxLength={500}
                    uploadImage={upload}
                />
            </Field>
            <pre className="rounded-lg bg-bg-2 p-3 font-mono text-xs break-all whitespace-pre-wrap text-muted">
                {html || '–'}
            </pre>
        </div>
    );
}

/** Bubble menu at selected text, floating menu in empty lines (both via Alt+F10), mentions, counter, image paste */
export const Menus: Story = { render: (args) => <MenusDemo {...args} /> };

const report =
    '<h2>Report</h2><p style="text-align: center">Centered paragraph with <span style="color: color-mix(in srgb, var(--wc-danger) 75%, var(--wc-fg))">red</span> and <span style="background-color: color-mix(in oklab, var(--wc-warn) 20%, transparent)">highlighted</span> text, H<sub>2</sub>O and E = mc<sup>2</sup>.</p><h3>Appendix</h3><details open><summary>More details</summary><div data-type="detailsContent"><p>Expanded.</p></div></details>';

function ToolsDemo(args: EditorProps) {
    const [html, setHtml] = useState(report);
    return (
        <div className="flex max-w-3xl flex-col gap-3">
            <Field label="Report">
                <Editor
                    {...args}
                    value={html}
                    onValueChange={setHtml}
                    stickyToolbar
                    tableOfContents
                    toolbar={[
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
                    ]}
                />
            </Field>
            <pre className="rounded-lg bg-bg-2 p-3 font-mono text-xs break-all whitespace-pre-wrap text-muted">
                {html || '–'}
            </pre>
        </div>
    );
}

/** Alignment, token colors (contrast-checked), sub/superscript, details, invisible characters, HTML source */
export const MoreTools: Story = { render: (args) => <ToolsDemo {...args} /> };

/** Read only: no toolbar, the text can be read and selected */
export const ReadOnly: Story = { args: { readonly: true } };
