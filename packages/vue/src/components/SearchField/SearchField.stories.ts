import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import SearchField from './SearchField.vue';

const meta = {
    title: 'Forms/SearchField',
    component: SearchField,
    render: (args) => ({
        components: { SearchField },
        setup() {
            const query = ref('');
            const scope = ref(args.scope);
            const searched = ref('');
            return { args, query, scope, searched };
        },
        template: `
            <div class="flex w-[min(480px,90vw)] flex-col gap-2">
                <SearchField v-bind="args" v-model="query" v-model:scope="scope" @submit="(value, scope) => (searched = scope ? value + ' in ' + scope : value)" />
                <p class="text-xs text-muted" aria-live="polite">{{ searched ? 'Searched: ' + searched : '' }}</p>
            </div>`,
    }),
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A search landmark: Enter searches, Escape empties, the button clears */
export const Playground: Story = {};

/** With a select for the area */
export const WithScope: Story = {
    name: 'With scope',
    args: {
        label: 'Search customers',
        scope: 'all',
        scopes: [
            { value: 'all', label: 'All fields' },
            { value: 'name', label: 'Name' },
            { value: 'number', label: 'Customer number' },
        ],
    },
};

/** Suggestions while typing (combobox pattern) */
export const Suggestions: Story = {
    name: 'Suggestions',
    args: { suggestions: ['web-01', 'web-02', 'db-primary', 'backup-02', 'cache-01'] },
};

/** Search running */
export const Loading: Story = { name: 'Loading', args: { loading: true, defaultValue: 'web' } };
