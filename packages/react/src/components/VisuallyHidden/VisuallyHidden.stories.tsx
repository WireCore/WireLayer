import type { Meta, StoryObj } from '@storybook/react-vite';
import { Trash2 } from 'lucide-react';
import { VisuallyHidden } from './VisuallyHidden.js';

const meta = {
    title: 'Utilities/VisuallyHidden',
    component: VisuallyHidden,
    render: () => (
        <div className="flex flex-col gap-3 text-sm">
            <p className="flex items-center gap-2">
                <Trash2 className="size-4" aria-hidden="true" /> 3 <VisuallyHidden>items in the trash</VisuallyHidden>
            </p>
            <VisuallyHidden as="a" href="#content" focusable>
                Skip to content (appears with Tab)
            </VisuallyHidden>
        </div>
    ),
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Text only for screen readers; `focusable` shows it while it has the focus */
export const Playground: Story = {};
