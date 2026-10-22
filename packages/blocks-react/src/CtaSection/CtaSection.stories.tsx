import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@wirecore/wirelayer-react';
import { ArrowRight } from 'lucide-react';
import { CtaSection } from './CtaSection.js';

const meta = {
    title: 'Blocks/CtaSection',
    component: CtaSection,
    args: { title: 'Tell us what you have in mind.', description: '', titleTag: 'h2', className: 'w-[420px]' },
    render: (args) => (
        <CtaSection {...args}>
            <Button variant="inverted" trailingIcon={ArrowRight}>
                Start project
            </Button>
        </CtaSection>
    ),
} satisfies Meta<typeof CtaSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
