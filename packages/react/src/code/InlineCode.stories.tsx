import type { Meta, StoryObj } from '@storybook/react-vite';
import { InlineCode } from './InlineCode.js';

const meta = {
    title: 'Data/InlineCode',
    component: InlineCode,
    args: { code: "const theme = useTheme('ocean')", language: 'ts' },
    render: (args) => (
        <p className="max-w-xl text-[15px] text-fg">
            Set the theme with <InlineCode {...args} /> – or via <InlineCode code="data-theme" /> on the{' '}
            <InlineCode code="<html>" language="html" />.
        </p>
    ),
} satisfies Meta<typeof InlineCode>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Code with syntax colours inside a sentence */
export const Playground: Story = {};
