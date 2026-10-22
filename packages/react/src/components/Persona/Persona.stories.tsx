import type { Meta, StoryObj } from '@storybook/react-vite';
import { Persona } from './Persona.js';

const meta = {
    title: 'Data/Persona',
    component: Persona,
    args: { name: 'Anna Berg', description: 'Project lead', presence: 'online' },
    argTypes: {
        presence: { control: 'select', options: ['online', 'away', 'busy', 'offline'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    },
} satisfies Meta<typeof Persona>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Avatar, name, role and presence (dot with text) */
export const Playground: Story = {};

/** Sizes */
export const Sizes: Story = {
    name: 'Sizes',
    render: () => (
        <div className="flex flex-col gap-4">
            <Persona name="Ben Ott" description="Engineering" size="sm" presence="busy" />
            <Persona name="Clara Weiß" description="Design" presence="away" />
            <Persona name="David Kühn" description="Sales · Hamburg" size="lg" presence="offline" />
        </div>
    ),
};

/** The whole persona as a link or button (the avatar is hidden, the name names it) */
export const AsLink: Story = {
    name: 'As link',
    render: () => (
        <div className="flex flex-col gap-3">
            <Persona name="Anna Berg" description="Project lead" href="#anna" />
            <Persona name="Eva Lang" description="Support" as="button" presence="online" />
        </div>
    ),
};
