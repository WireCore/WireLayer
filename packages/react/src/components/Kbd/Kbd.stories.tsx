import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from './Kbd.js';

const meta = {
    title: 'Data/Kbd',
    component: Kbd,
    args: { children: 'K' },
    render: () => (
        <p className="flex items-center gap-1 text-sm">
            Search with <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>
        </p>
    ),
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A whole shortcut from `hotkey`: ⌘ on Apple devices, Ctrl elsewhere; sequences with "then" */
export const Hotkey: Story = {
    render: () => (
        <ul className="flex flex-col gap-2 text-sm">
            <li>
                Commands: <Kbd hotkey="mod+k" />
            </li>
            <li>
                New document: <Kbd hotkey="mod+shift+n" />
            </li>
            <li>
                Go to inbox: <Kbd hotkey="g i" />
            </li>
            <li>
                Show keyboard shortcuts: <Kbd hotkey="?" />
            </li>
        </ul>
    ),
};
