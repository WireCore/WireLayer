import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import MentionsComponent from './Mentions.vue';

// Generic component: Storybook's Vue types can't infer args here
const Mentions = MentionsComponent as unknown as ConcreteComponent;

const people = [
    { value: 'anna', label: 'Anna Berg', description: 'Project management' },
    { value: 'ben', label: 'Ben Ott', description: 'Engineering' },
    { value: 'clara', label: 'Clara Weiß', description: 'Design' },
    { value: 'david', label: 'David Kurz', description: 'Operations' },
];
const topics = [
    { value: 'release', label: 'Release' },
    { value: 'bug', label: 'Bug' },
    { value: 'maintenance', label: 'Maintenance' },
];

const meta = {
    title: 'Forms/Mentions',
    component: Mentions,
    args: { placeholder: '@ for people, # for topics', rows: 3 },
    render: (args) => ({
        components: { Field, Mentions },
        setup: () => ({
            args,
            value: ref('Thanks @[Anna Berg](anna)! Please prepare #[Release](release).'),
            triggers: [
                { char: '@', items: people },
                { char: '#', items: topics },
            ],
        }),
        template: `
            <div class="flex w-[440px] flex-col gap-3">
                <Field label="Comment"><Mentions v-bind="args" v-model="value" :triggers="triggers" /></Field>
                <code class="text-xs break-all text-muted">{{ value }}</code>
            </div>`,
    }),
} satisfies Meta<typeof Mentions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "@" and "#" open suggestions; the value keeps the ids as markup, the field shows the names marked */
export const Playground: Story = {};

/** Entries from a server: searched after a typing pause */
export const ServerData: Story = {
    name: 'Server data',
    render: () => ({
        components: { Field, Mentions },
        setup: () => ({
            value: ref(''),
            dataSource: {
                getItems: ({ search }: { search?: string }) =>
                    new Promise((resolve) =>
                        setTimeout(() => {
                            const text = (search ?? '').toLowerCase();
                            const items = people.filter((person) => person.label.toLowerCase().includes(text));
                            resolve({ items, totalCount: items.length });
                        }, 400)
                    ),
            },
        }),
        template: `<Field label="Message" class="w-[440px]"><Mentions v-model="value" :data-source="dataSource" /></Field>`,
    }),
};
