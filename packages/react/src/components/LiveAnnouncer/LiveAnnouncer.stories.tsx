import type { Meta, StoryObj } from '@storybook/react-vite';
import { announce } from '@wirecore/wirelayer-recipes';
import { Button } from '../Button/Button.js';
import { LiveAnnouncer } from './LiveAnnouncer.js';

const meta = {
    title: 'Utilities/LiveAnnouncer',
    component: LiveAnnouncer,
    render: () => (
        <LiveAnnouncer>
            <div className="flex flex-col items-start gap-3 text-sm">
                <p className="max-w-sm text-muted">
                    The announcements are invisible – listen with a screen reader, or inspect the regions in the element
                    tree.
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => announce('3 items saved')}>
                        Announce politely
                    </Button>
                    <Button
                        variant="outline"
                        color="danger"
                        onClick={() => announce('Connection lost', { politeness: 'assertive' })}
                    >
                        Announce urgently
                    </Button>
                </div>
            </div>
        </LiveAnnouncer>
    ),
} satisfies Meta<typeof LiveAnnouncer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** announce(text, { politeness }) – one region per politeness, quick successive calls end up as one announcement */
export const Playground: Story = {};
