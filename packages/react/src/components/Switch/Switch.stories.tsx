import type { Meta, StoryObj } from '@storybook/react-vite';
import { BellRing, Check, Mail, Moon, Sun, X } from 'lucide-react';
import { Switch } from './Switch.js';

const meta = {
    title: 'Forms/Switch',
    component: Switch,
    args: {
        description: 'Notify me about outages',
        disabled: false,
        icon: BellRing,
        className: 'w-[380px]',
        children: 'Monitoring alerts',
    },
    argTypes: { icon: { control: false } },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Settings: Story = {
    render: () => (
        <div className="flex w-[380px] flex-col">
            <Switch icon={BellRing} description="Notify me about outages" defaultChecked>
                Monitoring alerts
            </Switch>
            <Switch icon={Mail} description="Summary by email">
                Weekly report
            </Switch>
        </div>
    ),
};

/** Icon in the thumb or a short text in the track – decoration, the state is announced by the switch */
export const ThumbAndTrack: Story = {
    render: () => (
        <div className="flex w-80 flex-col gap-1">
            <Switch checkedIcon={Check} uncheckedIcon={X} defaultChecked>
                Automatic updates
            </Switch>
            <Switch checkedIcon={Moon} uncheckedIcon={Sun}>
                Dark theme
            </Switch>
            <Switch onLabel="On" offLabel="Off">
                Notifications
            </Switch>
        </div>
    ),
};
