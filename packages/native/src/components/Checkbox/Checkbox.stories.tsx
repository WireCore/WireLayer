import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Checkbox } from './Checkbox.js';

const meta = {
    title: 'Forms/Checkbox',
    component: Checkbox,
    args: { children: 'Subscribe to newsletter', defaultChecked: false, disabled: false, invalid: false },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
    render: () => (
        <View className="w-[360px] gap-3">
            <Checkbox defaultChecked>Selected</Checkbox>
            <Checkbox defaultChecked="indeterminate">Partially selected</Checkbox>
            <Checkbox invalid>Please agree</Checkbox>
            <Checkbox disabled>Disabled</Checkbox>
            <Checkbox>I agree that my details may be processed and stored to handle my inquiry.</Checkbox>
        </View>
    ),
};
