import { GitCommitHorizontal, Layers, LayoutDashboard } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Tabs from './Tabs.vue';
import TabsContent from './TabsContent.vue';
import TabsList from './TabsList.vue';
import TabsTrigger from './TabsTrigger.vue';

const meta = {
    title: 'Navigation/Tabs',
    component: Tabs,
    args: { defaultValue: 'overview', label: 'About WireLayer' },
    render: (args) => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup: () => ({ args, GitCommitHorizontal, Layers, LayoutDashboard }),
        template: `
            <Tabs v-bind="args" class="w-[380px]">
                <TabsList>
                    <TabsTrigger value="overview" :icon="LayoutDashboard">Overview</TabsTrigger>
                    <TabsTrigger value="services" :icon="Layers">Services</TabsTrigger>
                    <TabsTrigger value="process" :icon="GitCommitHorizontal">Process</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" class="text-sm leading-[1.55] text-muted">
                    One team for the whole stack – from software to the network cable.
                </TabsContent>
                <TabsContent value="services" class="text-sm leading-[1.55] text-muted">
                    Software, AI, hosting, cloud, hardware and network.
                </TabsContent>
                <TabsContent value="process" class="text-sm leading-[1.55] text-muted">
                    Understand, build, ship and operate.
                </TabsContent>
            </Tabs>`,
    }),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Closable tabs (Delete or the x), a scrolling list with arrows on overflow */
export const ClosableAndScrollable: Story = {
    render: () => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            const files = ref([
                'quote.pdf',
                'contract.docx',
                'notes.txt',
                'invoice-2026-10.pdf',
                'minutes.md',
                'budget.xlsx',
            ]);
            const current = ref('quote.pdf');
            const close = (file: string) => {
                const index = files.value.indexOf(file);
                files.value = files.value.filter((name) => name !== file);
                if (current.value === file) current.value = files.value[Math.min(index, files.value.length - 1)] ?? '';
            };
            return { files, current, close };
        },
        template: `
            <Tabs v-model="current" label="Open files" class="w-[380px]">
                <TabsList scrollable>
                    <TabsTrigger v-for="file in files" :key="file" :value="file" closable @close="close">{{ file }}</TabsTrigger>
                </TabsList>
                <TabsContent v-for="file in files" :key="file" :value="file" class="text-sm text-muted">Content of {{ file }}</TabsContent>
                <p v-if="!files.length" class="text-sm text-muted">All files closed.</p>
            </Tabs>`,
    }),
};

/** Tabs beside the panels; manual activation: arrow keys move the focus, Enter/Space select */
export const VerticalManual: Story = {
    args: { orientation: 'vertical', activationMode: 'manual', lazyMount: true },
    render: (args) => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup: () => ({ args }),
        template: `
            <Tabs v-bind="args" class="w-[480px]">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="process">Process</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" class="text-sm text-muted">One team for the whole stack.</TabsContent>
                <TabsContent value="services" class="text-sm text-muted">Software, AI, hosting, cloud.</TabsContent>
                <TabsContent value="process" class="text-sm text-muted">Understand, build, operate.</TabsContent>
            </Tabs>`,
    }),
};
