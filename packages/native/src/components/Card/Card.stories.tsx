import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { Card } from './Card.js';

const meta = {
    title: 'Data/Card',
    component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    render: () => (
        <View className="w-[320px] gap-3">
            <Card>
                <Text variant="label">01</Text>
                <Text variant="title">Software & Web</Text>
                <Text variant="muted">Custom applications, shops and interfaces.</Text>
            </Card>
            <Card onPress={() => {}}>
                <View className="flex-row items-center justify-between">
                    <Text variant="label">02</Text>
                    <Badge variant="success">Active</Badge>
                </View>
                <Text variant="title">Managed Hosting</Text>
                <Text variant="muted">The whole card is pressable.</Text>
            </Card>
        </View>
    ),
};

export const WithParts: Story = {
    render: () => (
        <View className="w-[320px] gap-3">
            <Card
                title="Managed Hosting"
                subtitle="Frankfurt data center"
                header={<Badge variant="success">Active</Badge>}
                media={<View className="h-28 bg-primary/14" aria-hidden />}
                footer={
                    <>
                        <Button variant="text" size="sm">
                            Details
                        </Button>
                        <Button size="sm">Manage</Button>
                    </>
                }
            >
                <Text variant="muted">Operations, updates and backups from a single provider.</Text>
            </Card>
            <Card
                orientation="horizontal"
                title="Cloud & DevOps"
                subtitle="Kubernetes, CI/CD"
                media={<View className="h-full min-h-24 bg-info/14" aria-hidden />}
            />
        </View>
    ),
};
