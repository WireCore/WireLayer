import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup } from './RadioGroup.js';
import { RadioGroupItem } from './RadioGroupItem.js';

const meta = {
    title: 'Forms/RadioGroup',
    component: RadioGroup,
    args: { label: 'Company size', defaultValue: 'midsize', orientation: 'horizontal', disabled: false },
    argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
    render: (args) => (
        <RadioGroup {...args}>
            <RadioGroupItem value="startup">Startup</RadioGroupItem>
            <RadioGroupItem value="midsize">Mid-sized</RadioGroupItem>
            <RadioGroupItem value="enterprise">Enterprise</RadioGroupItem>
            <RadioGroupItem value="public-sector" disabled>
                Public sector
            </RadioGroupItem>
        </RadioGroup>
    ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
