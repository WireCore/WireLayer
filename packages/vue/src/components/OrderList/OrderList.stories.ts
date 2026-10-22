import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import type { ListboxItem } from '../Listbox/Listbox.vue';
import OrderListComponent from './OrderList.vue';

// Generic component: Storybook's Vue types can't infer args here
const OrderList = OrderListComponent as unknown as ConcreteComponent;

const steps: ListboxItem[] = [
    { value: 'backup', label: 'Create backup' },
    { value: 'drain', label: 'Drain node' },
    { value: 'update', label: 'Install update' },
    { value: 'reboot', label: 'Restart' },
    { value: 'check', label: 'Check services' },
];

const meta: Meta<typeof OrderList> = {
    title: 'Data/OrderList',
    component: OrderList,
    args: { label: 'Maintenance steps' },
    render: (args) => ({
        components: { OrderList },
        setup: () => ({ args, order: ref(steps) }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <OrderList v-bind="args" v-model="order" />
                <span class="text-xs text-muted">Order: {{ order.map((step) => step.value).join(', ') }}</span>
            </div>`,
    }),
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** Objects as items (itemValue/itemLabel), a search field, own content per item and moving by drag and drop */
export const ObjectsSearchDrag: Story = {
    name: 'Objects, search and drag',
    render: () => ({
        components: { OrderList },
        setup: () => ({
            tasks: ref([
                { id: 1, title: 'Check backup', minutes: 15 },
                { id: 2, title: 'Install updates', minutes: 40 },
                { id: 3, title: 'Restart services', minutes: 5 },
                { id: 4, title: 'Check monitoring', minutes: 10 },
            ]),
        }),
        template: `
            <div class="flex w-96 flex-col gap-3">
                <OrderList v-model="tasks" label="Maintenance steps" item-value="id" item-label="title" filter draggable>
                    <template #item="{ item }">
                        <span class="flex-1 truncate">{{ item.title }}</span>
                        <span class="text-xs text-muted">{{ item.minutes }} min</span>
                    </template>
                </OrderList>
                <span class="text-xs text-muted">Order: {{ tasks.map((task) => task.id).join(', ') }}</span>
            </div>`,
    }),
};
