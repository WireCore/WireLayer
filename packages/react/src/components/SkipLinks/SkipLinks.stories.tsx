import type { Meta, StoryObj } from '@storybook/react-vite';
import { SkipLinks } from './SkipLinks.js';

const meta = {
    title: 'Utilities/SkipLinks',
    component: SkipLinks,
    args: {
        links: [
            { href: '#content', label: 'Skip to content' },
            { href: '#search', label: 'Skip to search' },
            { href: '#footer', label: 'Skip to footer' },
        ],
    },
    render: (args) => (
        <div className="text-sm">
            <SkipLinks {...args} />
            <p className="text-muted">Press Tab: the skip links appear one after another at the top left.</p>
        </div>
    ),
} satisfies Meta<typeof SkipLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Several skip links as a named navigation (AppShell `skipLinks` adds them after its own) */
export const Playground: Story = {};
