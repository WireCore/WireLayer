import { ArrowRight } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Button } from '@wirecore/wirelayer-vue';
import CtaSection from './CtaSection.vue';

const meta = {
    title: 'Blocks/CtaSection',
    component: CtaSection,
    args: { title: 'Tell us what you have in mind.', description: '', titleTag: 'h2' },
    render: (args) => ({
        components: { Button, CtaSection },
        setup: () => ({ args, ArrowRight }),
        template: `
            <CtaSection v-bind="args" class="w-[420px]">
                <Button variant="inverted" :trailing-icon="ArrowRight">Start project</Button>
            </CtaSection>`,
    }),
} satisfies Meta<typeof CtaSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
