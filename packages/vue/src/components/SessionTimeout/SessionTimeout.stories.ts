import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import SessionTimeout from './SessionTimeout.vue';

const meta = {
    title: 'Feedback/SessionTimeout',
    component: SessionTimeout,
    args: { warnBefore: 60, expiresAt: 0 },
    render: (args) => ({
        components: { Button, SessionTimeout },
        setup: () => {
            const expiresAt = ref(Date.now() + 70_000);
            const log = ref('Session active');
            const extend = () => {
                expiresAt.value = Date.now() + 15 * 60_000;
                log.value = 'Extended by 15 minutes';
            };
            return { args, expiresAt, log, extend };
        },
        template: `
            <div class="flex flex-col items-start gap-3">
                <Button size="sm" variant="outline" @click="expiresAt = Date.now() + 65000">Session ends in 65 seconds</Button>
                <span class="text-sm text-muted">{{ log }}</span>
                <SessionTimeout
                    v-bind="args"
                    :expires-at="expiresAt"
                    @extend="extend"
                    @sign-out="log = 'Signed out'"
                    @expire="log = 'Session expired'"
                />
            </div>`,
    }),
} satisfies Meta<typeof SessionTimeout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The warning opens a minute before the end (WCAG 2.2.1: at least 20 seconds and one action to extend) */
export const Playground: Story = {};
