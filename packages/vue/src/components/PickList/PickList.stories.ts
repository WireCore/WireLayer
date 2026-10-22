import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import PickListComponent from './PickList.vue';

// Generic component: Storybook's Vue types can't infer args here
const PickList = PickListComponent as unknown as ConcreteComponent;

const people = [
    { value: 'jk', label: 'Julia Klein' },
    { value: 'ms', label: 'Max Schulz' },
    { value: 'al', label: 'Ana Lopez' },
    { value: 'tb', label: 'Tom Becker' },
    { value: 'sw', label: 'Sara Wolf' },
];

const meta = {
    title: 'Data/PickList',
    component: PickList,
    args: { items: people, sourceLabel: 'Team', targetLabel: 'In project' },
    argTypes: { items: { control: false } },
    render: (args) => ({
        components: { PickList },
        setup: () => ({ args, chosen: ref(['ms']) }),
        template: `
            <div class="flex w-[36rem] flex-col gap-3">
                <PickList v-bind="args" v-model="chosen" />
                <span class="text-xs text-muted">In project: {{ chosen.join(', ') || '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** Objects as values, a search field and "Select all" per list, drag and drop between the lists */
export const ObjectsSearchDrag: Story = {
    name: 'Objects, search and drag',
    render: () => ({
        components: { PickList },
        setup: () => ({
            members: [
                { id: 1, name: 'Julia Klein', role: 'Project lead' },
                { id: 2, name: 'Max Schulz', role: 'Frontend' },
                { id: 3, name: 'Ana Lopez', role: 'Backend' },
                { id: 4, name: 'Tom Becker', role: 'Operations' },
                { id: 5, name: 'Sara Wolf', role: 'Design' },
            ],
            chosen: ref([{ id: 2, name: 'Max Schulz', role: 'Frontend' }]),
        }),
        template: `
            <div class="flex w-[40rem] flex-col gap-3">
                <PickList v-model="chosen" :items="members" :item-value="(member) => member" item-label="name" value-key="id"
                    source-label="Team" target-label="In project" filter select-all draggable>
                    <template #item="{ item }">
                        <span class="flex min-w-0 flex-1 flex-col"><span class="truncate">{{ item.name }}</span><span class="text-xs text-muted">{{ item.role }}</span></span>
                    </template>
                </PickList>
                <span class="text-xs text-muted">In project: {{ chosen.map((member) => member.name).join(', ') || '–' }}</span>
            </div>`,
    }),
};
