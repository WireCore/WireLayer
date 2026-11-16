import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import Tabs from '../Tabs/Tabs.vue';
import TabsContent from '../Tabs/TabsContent.vue';
import TabsList from '../Tabs/TabsList.vue';
import TabsTrigger from '../Tabs/TabsTrigger.vue';
import Tour, { type TourStep } from './Tour.vue';

const steps: TourStep[] = [
    { id: 'welcome', title: 'Welcome', description: 'Your first server in three steps.' },
    {
        id: 'create',
        title: 'Create server',
        description: 'Create new servers here.',
        target: '#tour-create',
        placement: 'bottom',
    },
    {
        id: 'reports',
        title: 'Reports',
        description: 'Load and costs at a glance.',
        target: '#tour-reports',
        placement: 'bottom',
    },
];

const meta = {
    title: 'Overlays/Tour',
    component: Tour,
    args: { steps },
    argTypes: { steps: { control: false } },
    render: (args) => ({
        components: { Button, Tour },
        setup: () => ({ args, open: ref(false), done: ref(false) }),
        template: `
            <div class="flex flex-col items-center gap-6">
                <div class="flex gap-3">
                    <Button id="tour-create" variant="outline">Create server</Button>
                    <Button id="tour-reports" variant="outline">Reports</Button>
                </div>
                <Button @click="open = true">Start tour</Button>
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ done ? 'Tour completed' : '' }}</p>
                <Tour v-bind="args" v-model:open="open" @complete="done = true" />
            </div>`,
    }),
} satisfies Meta<typeof Tour>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Steps that need the app first: `before` switches the tab, `waitFor` waits for the chart while it loads (1.5 s).
 * A step whose target is not there ("Beta") is skipped. v-model:step shows the current step.
 */
export const WaitingForTargets: Story = {
    render: () => ({
        components: { Button, Tabs, TabsContent, TabsList, TabsTrigger, Tour },
        setup() {
            const tab = ref('servers');
            const loaded = ref(false);
            const open = ref(false);
            const step = ref<string | null>(null);
            let timer: ReturnType<typeof setTimeout> | undefined;
            const steps: TourStep[] = [
                {
                    id: 'servers',
                    title: 'Servers',
                    description: 'Add servers here.',
                    target: '#tour-add-server',
                    placement: 'bottom',
                    before: () => {
                        tab.value = 'servers';
                    },
                },
                {
                    id: 'load',
                    title: 'Load',
                    description: 'The chart of the reports – the tour waits until it has loaded.',
                    target: '#tour-load-chart',
                    placement: 'bottom',
                    before: () => {
                        tab.value = 'reports';
                        clearTimeout(timer);
                        timer = setTimeout(() => (loaded.value = true), 1500);
                    },
                    waitFor: 5000,
                },
                { id: 'beta', title: 'Beta', description: 'Not there – skipped.', target: '#tour-beta' },
                { id: 'end', title: 'That is it', description: 'Start the tour again at any time.' },
            ];
            return { tab, loaded, open, step, steps };
        },
        template: `
            <div class="flex flex-col items-center gap-6">
                <Tabs v-model="tab" class="w-[380px]">
                    <TabsList>
                        <TabsTrigger value="servers">Servers</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                    </TabsList>
                    <TabsContent value="servers">
                        <Button id="tour-add-server" variant="outline">Add server</Button>
                    </TabsContent>
                    <TabsContent value="reports">
                        <div v-if="loaded" id="tour-load-chart" class="h-20 rounded-md bg-line" aria-label="Load chart" role="img" />
                        <p v-else class="text-sm text-muted">Loading …</p>
                    </TabsContent>
                </Tabs>
                <Button @click="open = true">Start tour</Button>
                <p class="h-4 text-xs text-muted">Step: {{ step ?? '–' }}</p>
                <Tour v-model:open="open" v-model:step="step" :steps="steps" />
            </div>`,
    }),
};
