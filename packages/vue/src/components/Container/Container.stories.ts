import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Container from './Container.vue';

const meta = {
    title: 'Layout/Container',
    component: Container,
    args: { size: 'md' },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', 'full'] } },
    parameters: { layout: 'fullscreen' },
    render: (args) => ({
        components: { Container },
        setup: () => ({ args }),
        template: `
            <Container v-bind="args" class="bg-bg-2 py-6">
                <h2 class="text-lg font-semibold">One team for the entire stack</h2>
                <p class="mt-2 text-sm text-muted">
                    Software, AI, hosting and cloud from a single source – the content stays readable on wide screens.
                </p>
            </Container>`,
    }),
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Centered with a maximum width and side padding */
export const Playground: Story = {};
