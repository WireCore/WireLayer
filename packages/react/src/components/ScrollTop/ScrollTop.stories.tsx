import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollTop } from './ScrollTop.js';

const sections = Array.from({ length: 30 }, (_, index) => index + 1);

const meta = {
    title: 'Navigation/ScrollTop',
    component: ScrollTop,
    args: { threshold: 200 },
    parameters: { layout: 'fullscreen' },
    render: (args) => (
        <div className="mx-auto flex max-w-xl flex-col gap-4 p-8 text-sm">
            {sections.map((n) => (
                <p key={n}>Section {n}: Scroll down and the “Back to top” button appears.</p>
            ))}
            <ScrollTop {...args} />
        </div>
    ),
} satisfies Meta<typeof ScrollTop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
