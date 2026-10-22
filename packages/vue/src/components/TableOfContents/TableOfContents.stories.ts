import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TableOfContents from './TableOfContents.vue';

const items = [
    { id: 'toc-services', label: 'Services' },
    { id: 'toc-term', label: 'Term', depth: 2 },
    { id: 'toc-termination', label: 'Termination', depth: 2 },
    { id: 'toc-data-protection', label: 'Data protection' },
    { id: 'toc-liability', label: 'Liability' },
];

const meta = {
    title: 'Navigation/TableOfContents',
    component: TableOfContents,
    args: { items },
    argTypes: { items: { control: false } },
    parameters: { layout: 'fullscreen' },
    render: (args) => ({
        components: { TableOfContents },
        setup: () => ({ args, items }),
        template: `
            <div class="mx-auto flex max-w-3xl gap-10 p-8">
                <article class="flex-1 text-sm leading-relaxed">
                    <section v-for="item in items" :key="item.id" class="mb-10">
                        <component :is="item.depth === 2 ? 'h3' : 'h2'" :id="item.id" class="mb-2 font-semibold" :class="item.depth === 2 ? 'text-base' : 'text-xl'">{{ item.label }}</component>
                        <p v-for="n in 4" :key="n" class="mb-3">This section covers {{ item.label }} under the agreement.</p>
                    </section>
                </article>
                <aside class="sticky top-8 h-fit w-48"><TableOfContents v-bind="args" /></aside>
            </div>`,
    }),
} satisfies Meta<typeof TableOfContents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
