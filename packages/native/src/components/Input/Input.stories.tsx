import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Mail } from 'lucide-react-native';
import { View } from 'react-native';
import { Input } from './Input.js';

const meta = {
    title: 'Forms/Input',
    component: Input,
    args: {
        placeholder: 'name@example.com',
        'aria-label': 'Email',
        size: 'md',
        clearable: true,
        loading: false,
        success: false,
    },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => (
        <View className="w-80">
            <Input {...args} leadingIcon={Mail} keyboardType="email-address" autoCapitalize="none" />
        </View>
    ),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** More states in Forms/Field › States */
export const Playground: Story = {};
