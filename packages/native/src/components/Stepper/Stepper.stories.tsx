import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Text } from '../Text/Text.js';
import { Stepper } from './Stepper.js';

const items = [
    { label: 'Contact', description: 'Who are you?' },
    { label: 'Project', description: 'What are you planning?' },
    { label: 'Review', description: 'Is everything correct?' },
];

function Demo() {
    const [name, setName] = useState('');
    return (
        <View className="w-80">
            <Stepper
                items={items}
                linear
                isStepValid={(index) => index !== 0 || name.trim() !== ''}
                completed={<Text>Thanks, {name}! We will get back to you.</Text>}
            >
                {(index) =>
                    index === 0 ? (
                        <Field label="Name" required helperText="Required – you can only continue once it is filled in">
                            <Input value={name} onChangeText={setName} />
                        </Field>
                    ) : index === 1 ? (
                        <Field label="Plan">
                            <Input placeholder="e.g. customer portal" />
                        </Field>
                    ) : (
                        <Text variant="muted">Name: {name}</Text>
                    )
                }
            </Stepper>
        </View>
    );
}

const meta = {
    title: 'Navigation/Stepper',
    component: Stepper,
    args: { items, children: () => null },
    render: () => <Demo />,
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Steps with their labels top to bottom */
export const Vertical: Story = {
    render: () => (
        <View className="w-80">
            <Stepper items={items} orientation="vertical" defaultStep={1}>
                {(index) => <Text variant="muted">Content of step {index + 1}</Text>}
            </Stepper>
        </View>
    ),
};
