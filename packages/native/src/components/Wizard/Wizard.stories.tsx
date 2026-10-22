import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Text } from '../Text/Text.js';
import { Wizard } from './Wizard.js';

function Demo() {
    const [name, setName] = useState('');
    const [project, setProject] = useState('');
    const steps = [
        {
            label: 'Contact',
            description: 'Who are you?',
            // Async, like a server check
            validate: () => new Promise<boolean>((done) => setTimeout(() => done(name.trim().length > 1), 400)),
        },
        { label: 'Project', description: 'What are you planning?' },
    ];
    return (
        <View className="w-80">
            <Wizard
                steps={steps}
                renderStep={(index) =>
                    index === 0 ? (
                        <Field label="Name" required helperText="At least 2 characters">
                            <Input value={name} onChangeText={setName} />
                        </Field>
                    ) : (
                        <Field label="Project idea">
                            <Input value={project} onChangeText={setProject} />
                        </Field>
                    )
                }
                summary={
                    <Text variant="muted">
                        {name || '–'} · {project || '–'}
                    </Text>
                }
                completed={<Text>Thanks! We'll be in touch.</Text>}
            />
        </View>
    );
}

const meta = {
    title: 'Navigation/Wizard',
    component: Wizard,
    args: { steps: [], renderStep: () => null },
    render: () => <Demo />,
} satisfies Meta<typeof Wizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
