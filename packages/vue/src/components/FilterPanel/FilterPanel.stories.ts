import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, ref } from 'vue';
import Field from '../Field/Field.vue';
import NativeSelect from '../NativeSelect/NativeSelect.vue';
import NumberInput from '../NumberInput/NumberInput.vue';
import FilterChips from './FilterChips.vue';
import FilterPanel from './FilterPanel.vue';

const locations = [
    { value: 'Frankfurt', label: 'Frankfurt' },
    { value: 'Nuremberg', label: 'Nuremberg' },
    { value: 'Vienna', label: 'Vienna' },
];
const statuses = [
    { value: 'online', label: 'Online' },
    { value: 'maintenance', label: 'Maintenance' },
];

const meta = {
    title: 'Forms/FilterPanel',
    component: FilterPanel,
    args: { display: 'inline' },
    argTypes: { display: { control: 'inline-radio', options: ['inline', 'drawer', 'auto'] } },
    render: (args) => ({
        components: { Field, FilterPanel, NativeSelect, NumberInput },
        setup() {
            const location = ref('Frankfurt');
            const status = ref('');
            const minLoad = ref<number | null>(50);
            const filters = computed(
                () =>
                    [
                        location.value && { id: 'location', label: 'Location', value: location.value },
                        status.value && {
                            id: 'status',
                            label: 'Status',
                            value: statuses.find((entry) => entry.value === status.value)!.label,
                        },
                        minLoad.value !== null && { id: 'load', label: 'Load', value: `from ${minLoad.value}%` },
                    ].filter(Boolean) as { id: string; label: string; value: string }[]
            );
            const remove = (id: string) => {
                if (id === 'location') location.value = '';
                if (id === 'status') status.value = '';
                if (id === 'load') minLoad.value = null;
            };
            const clear = () => ['location', 'status', 'load'].forEach(remove);
            return { args, location, status, minLoad, filters, remove, clear, locations, statuses };
        },
        template: `
            <FilterPanel v-bind="args" :filters="filters" class="w-[min(900px,92vw)]" @remove="remove" @clear="clear">
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Location"><NativeSelect v-model="location" :items="locations" placeholder="All" size="sm" /></Field>
                    <Field label="Status"><NativeSelect v-model="status" :items="statuses" placeholder="All" size="sm" /></Field>
                    <Field label="Minimum load (%)"><NumberInput v-model="minLoad" :min="0" :max="100" size="sm" /></Field>
                </div>
            </FilterPanel>`,
    }),
} satisfies Meta<typeof FilterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The button shows the number of active filters and opens the form; chips remove single filters */
export const Playground: Story = {};

/** On small screens in a drawer (`display="auto"`), here always */
export const Drawer: Story = { args: { display: 'drawer' } };

/** Only the chips, e.g. above search results */
export const Chips: Story = {
    render: () => ({
        components: { FilterChips },
        setup() {
            const filters = ref([
                { id: 'location', label: 'Location', value: 'Frankfurt' },
                { id: 'load', label: 'Load', value: 'over 50%' },
                { id: 'os', label: 'System', value: 'Debian, Ubuntu' },
            ]);
            return { filters };
        },
        template: `
            <FilterChips
                :filters="filters"
                @remove="(id) => (filters = filters.filter((filter) => filter.id !== id))"
                @clear="filters = []"
            />`,
    }),
};
