import type { Meta, StoryObj } from '@storybook/react-vite';
import { Splitter } from './Splitter.js';

const meta = {
    title: 'Layout/Splitter',
    component: Splitter,
    args: {
        orientation: 'horizontal',
        panels: [
            { id: 'nav', label: 'Navigation', defaultSize: 30, minSize: 15 },
            { id: 'editor', label: 'Editor', minSize: 30 },
        ],
        children: (id: string) => <div className="p-4 text-sm">{id === 'nav' ? 'Navigation' : 'Editor'}</div>,
        className: 'h-72 w-[40rem]',
    },
    argTypes: {
        orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
        panels: { control: false },
        children: { control: false },
    },
} satisfies Meta<typeof Splitter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Vertical: Story = { args: { orientation: 'vertical' } };

/** Sizes in px, a collapsible panel (snaps shut below its minimum, Enter folds it), bigger Shift steps, remembered */
export const PixelsAndCollapsible: Story = {
    args: {
        panels: [
            { id: 'nav', label: 'Navigation', defaultSize: '220px', minSize: '160px', collapsible: true },
            { id: 'editor', label: 'Editor', minSize: 30 },
        ],
        step: 2,
        shiftStep: 20,
        storageKey: 'wirecore-story-splitter',
    },
};

/** A splitter inside a panel of another one */
export const Nested: Story = {
    args: {
        panels: [
            { id: 'nav', label: 'Navigation', defaultSize: 25 },
            { id: 'work', label: 'Workspace' },
        ],
        children: (id: string) =>
            id === 'nav' ? (
                <div className="p-4 text-sm">Navigation</div>
            ) : (
                <Splitter
                    orientation="vertical"
                    panels={[
                        { id: 'code', label: 'Code', defaultSize: 70 },
                        { id: 'terminal', label: 'Terminal', collapsible: true, minSize: 15 },
                    ]}
                    className="h-full rounded-none border-0"
                >
                    {(inner) => <div className="p-4 text-sm">{inner === 'code' ? 'Code' : 'Terminal'}</div>}
                </Splitter>
            ),
    },
};
