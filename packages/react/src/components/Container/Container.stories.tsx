import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container } from './Container.js';

const meta = {
    title: 'Layout/Container',
    component: Container,
    args: { size: 'md' },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', 'full'] } },
    parameters: { layout: 'fullscreen' },
    render: (args) => (
        <Container {...args} className="bg-bg-2 py-6">
            <h2 className="text-lg font-semibold">One team for the entire stack</h2>
            <p className="mt-2 text-sm text-muted">
                Software, AI, hosting and cloud from a single source – the content stays readable on wide screens.
            </p>
        </Container>
    ),
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Centered with a maximum width and side padding */
export const Playground: Story = {};
