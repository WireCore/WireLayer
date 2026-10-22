import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import OrgChart from './OrgChart.vue';
import type { OrgChartNode } from './types.js';

const company: OrgChartNode = {
    label: 'Florian Laabs',
    title: 'Management',
    children: [
        {
            label: 'Julia Klein',
            title: 'Engineering',
            children: [
                { label: 'Max Schulz', title: 'Frontend' },
                { label: 'Ana Lopez', title: 'Backend' },
            ],
        },
        { label: 'Tom Becker', title: 'Operations', children: [{ label: 'Sara Wolf', title: 'Platform' }] },
        { label: 'Lena Roth', title: 'Sales' },
    ],
};

const meta = {
    title: 'Data/OrgChart',
    component: OrgChart,
    args: { node: company, label: 'Org chart' },
    argTypes: { node: { control: false } },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { OrgChart },
        setup: () => ({ args }),
        template: `<OrgChart v-bind="args" />`,
    }),
} satisfies Meta<typeof OrgChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Departments whose teams load when they are opened
const departments: OrgChartNode = {
    id: 'management',
    label: 'Florian Laabs',
    title: 'Management',
    children: [
        { id: 'engineering', label: 'Julia Klein', title: 'Engineering', hasChildren: true },
        { id: 'operations', label: 'Tom Becker', title: 'Operations', hasChildren: true },
    ],
};
async function loadTeam(node: OrgChartNode): Promise<OrgChartNode[]> {
    await new Promise((done) => setTimeout(done, 700));
    return [1, 2].map((index) => ({ id: `${node.id}-${index}`, label: `Member ${index}`, title: node.title }));
}

/** A button below each manager shows or hides the team; the boxes can be chosen (toggle buttons) */
export const CollapsibleSelectable: Story = {
    name: 'Collapse, expand and select',
    render: (args) => ({
        components: { OrgChart },
        setup: () => ({ args, collapsed: ref<string[]>(['0-1']), selected: ref<string[]>([]) }),
        template: `
            <div class="flex flex-col gap-3">
                <OrgChart v-bind="args" v-model:collapsed-keys="collapsed" v-model:selected-keys="selected" collapsible selection-mode="multiple" />
                <span class="text-xs text-muted">Selected: {{ selected.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** Teams load when they are opened */
export const LazyTeams: Story = {
    name: 'Lazy-loaded teams',
    render: () => ({
        components: { OrgChart },
        setup: () => ({ departments, loadTeam }),
        template: `<OrgChart :node="departments" label="Org chart" collapsible :load-children="loadTeam" />`,
    }),
};

/** Own content of the boxes (slot `content`) */
export const OwnContent: Story = {
    name: 'Custom content',
    render: (args) => ({
        components: { OrgChart },
        setup: () => ({ args }),
        template: `
            <OrgChart v-bind="args">
                <template #content="{ node }">
                    <span class="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">
                        {{ node.label.split(' ').map((part) => part[0]).join('') }}
                    </span>
                    <span class="text-sm font-semibold">{{ node.label }}</span>
                    <span class="text-xs text-muted">{{ node.title }}</span>
                </template>
            </OrgChart>`,
    }),
};
