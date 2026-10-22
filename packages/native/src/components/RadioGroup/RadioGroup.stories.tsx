import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Building, Rocket, Users } from 'lucide-react-native';
import { View } from 'react-native';
import { RadioCard } from '../SelectionCard/SelectionCard.js';
import { RadioGroup, RadioGroupItem } from './RadioGroup.js';

const meta = {
    title: 'Forms/RadioGroup',
    component: RadioGroup,
    args: { label: 'Company size', defaultValue: 'midsize', orientation: 'horizontal', invalid: false },
    argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
    render: (args) => (
        <RadioGroup {...args}>
            <RadioGroupItem value="startup">Startup</RadioGroupItem>
            <RadioGroupItem value="midsize">Mid-sized</RadioGroupItem>
            <RadioGroupItem value="enterprise">Enterprise</RadioGroupItem>
        </RadioGroup>
    ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Large cards in two columns (RadioCard) */
export const Cards: Story = {
    render: () => (
        <View className="w-[360px]">
            <RadioGroup label="Plan" defaultValue="team" columns={2} required>
                <RadioCard value="start" title="Start" description="For individuals" price="€9 / month" icon={Rocket} />
                <RadioCard value="team" title="Team" description="Up to 10 people" price="€29 / month" icon={Users} />
                <RadioCard
                    value="business"
                    title="Business"
                    description="Unlimited"
                    price="On request"
                    icon={Building}
                />
            </RadioGroup>
        </View>
    ),
};
