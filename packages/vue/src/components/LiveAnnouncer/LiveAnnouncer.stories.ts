import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { announce } from '@wirecore/wirelayer-recipes';
import Button from '../Button/Button.vue';
import LiveAnnouncer from './LiveAnnouncer.vue';

const meta = {
    title: 'Utilities/LiveAnnouncer',
    component: LiveAnnouncer,
    render: () => ({
        components: { Button, LiveAnnouncer },
        setup: () => ({
            polite: () => announce('3 items saved'),
            assertive: () => announce('Connection lost', { politeness: 'assertive' }),
        }),
        template: `
            <LiveAnnouncer>
                <div class="flex flex-col items-start gap-3 text-sm">
                    <p class="max-w-sm text-muted">The announcements are invisible – listen with a screen reader, or inspect the regions in the element tree.</p>
                    <div class="flex gap-2">
                        <Button variant="outline" @click="polite">Announce politely</Button>
                        <Button variant="outline" color="danger" @click="assertive">Announce urgently</Button>
                    </div>
                </div>
            </LiveAnnouncer>`,
    }),
} satisfies Meta<typeof LiveAnnouncer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** announce(text, { politeness }) – one region per politeness, quick successive calls end up as one announcement */
export const Playground: Story = {};
