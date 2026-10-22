import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { Mentions, type MentionsProps } from './Mentions.js';

interface Person {
    value: string;
    label: string;
    description?: string;
}

const people: Person[] = [
    { value: 'anna', label: 'Anna Berg', description: 'Project management' },
    { value: 'ben', label: 'Ben Ott', description: 'Engineering' },
    { value: 'clara', label: 'Clara Weiß', description: 'Design' },
    { value: 'david', label: 'David Kurz', description: 'Operations' },
];
const topics: Person[] = [
    { value: 'release', label: 'Release' },
    { value: 'bug', label: 'Bug' },
    { value: 'maintenance', label: 'Maintenance' },
];

function Demo(args: MentionsProps<Person>) {
    const [value, setValue] = useState('Thanks @[Anna Berg](anna)! Please prepare #[Release](release).');
    return (
        <div className="flex w-[440px] flex-col gap-3">
            <Field label="Comment">
                <Mentions
                    {...args}
                    value={value}
                    onValueChange={setValue}
                    triggers={[
                        { char: '@', items: people },
                        { char: '#', items: topics },
                    ]}
                />
            </Field>
            <code className="text-xs break-all text-muted">{value}</code>
        </div>
    );
}

const meta = {
    title: 'Forms/Mentions',
    component: Mentions,
    args: { placeholder: '@ for people, # for topics', rows: 3 },
    render: (args) => <Demo {...(args as MentionsProps<Person>)} />,
} satisfies Meta<typeof Mentions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "@" and "#" open suggestions; the value keeps the ids as markup, the field shows the names marked */
export const Playground: Story = {};

const dataSource: DataSource<Person> = {
    getItems: ({ search }) =>
        new Promise((resolve) =>
            setTimeout(() => {
                const text = (search ?? '').toLowerCase();
                const items = people.filter((person) => person.label.toLowerCase().includes(text));
                resolve({ items, totalCount: items.length });
            }, 400)
        ),
};

function ServerDemo() {
    const [value, setValue] = useState('');
    return (
        <Field label="Message" className="w-[440px]">
            <Mentions value={value} onValueChange={setValue} dataSource={dataSource} />
        </Field>
    );
}

/** Entries from a server: searched after a typing pause */
export const ServerData: Story = { name: 'Server data', render: () => <ServerDemo /> };
