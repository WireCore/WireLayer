import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AiLabel from './AiLabel.vue';

const meta = {
    title: 'Data/AiLabel',
    component: AiLabel,
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
} satisfies Meta<typeof AiLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "AI-generated" as text; the (i) button explains it (toggletip) */
export const Playground: Story = {};

/** Next to generated content, with an own explanation */
export const NextToContent: Story = {
    name: 'Next to content',
    render: () => ({
        components: { AiLabel },
        template: `
            <article class="flex max-w-md flex-col gap-2 rounded-xl border border-line p-4">
                <div class="flex items-center justify-between gap-2">
                    <h3 class="m-0 text-sm font-semibold">Ticket summary</h3>
                    <AiLabel size="sm" explanation="Created automatically from the history. Details are in the ticket." />
                </div>
                <p class="m-0 text-sm text-muted">Since Monday, the customer has been reporting slow load times in the portal. The cache server is the likely cause.</p>
            </article>`,
    }),
};
