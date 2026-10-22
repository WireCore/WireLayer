import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Cloud, Code, Server } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs.js';

const meta = {
    title: 'Navigation/Tabs',
    component: Tabs,
    args: { defaultValue: 'software', label: 'Services' },
    decorators: [(Story) => <View className="w-[420px]">{Story()}</View>],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    render: (args) => (
        <Tabs {...args}>
            <TabsList>
                <TabsTrigger value="software" icon={Code}>
                    Software
                </TabsTrigger>
                <TabsTrigger value="hosting" icon={Server}>
                    Hosting
                </TabsTrigger>
                <TabsTrigger value="cloud" icon={Cloud}>
                    Cloud
                </TabsTrigger>
            </TabsList>
            <TabsContent value="software">
                <Text variant="muted">Custom applications, shops and APIs.</Text>
            </TabsContent>
            <TabsContent value="hosting">
                <Text variant="muted">Operations and monitoring in German data centers.</Text>
            </TabsContent>
            <TabsContent value="cloud">
                <Text variant="muted">Migration, Kubernetes and DevOps.</Text>
            </TabsContent>
        </Tabs>
    ),
};

const many = ['Overview', 'Servers', 'Databases', 'Backups', 'Monitoring', 'Invoices', 'Settings'];

/** Many tabs on a narrow screen: the list scrolls sideways */
export const Scrollable: Story = {
    render: () => (
        <View className="w-72">
            <Tabs defaultValue="Overview" label="Sections">
                <TabsList scrollable>
                    {many.map((tab) => (
                        <TabsTrigger key={tab} value={tab}>
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {many.map((tab) => (
                    <TabsContent key={tab} value={tab}>
                        <Text variant="muted">Content: {tab}</Text>
                    </TabsContent>
                ))}
            </Tabs>
        </View>
    ),
};

/** Counts on the tabs, part of their accessible name */
export const WithBadges: Story = {
    name: 'With counters',
    render: () => (
        <View className="w-[340px]">
            <Tabs defaultValue="open" label="Tickets">
                <TabsList>
                    <TabsTrigger value="open" badge={12}>
                        Open
                    </TabsTrigger>
                    <TabsTrigger value="mine" badge={3}>
                        Mine
                    </TabsTrigger>
                    <TabsTrigger value="done">Done</TabsTrigger>
                </TabsList>
                <TabsContent value="open">
                    <Text variant="muted">12 open tickets</Text>
                </TabsContent>
                <TabsContent value="mine">
                    <Text variant="muted">3 tickets for you</Text>
                </TabsContent>
                <TabsContent value="done">
                    <Text variant="muted">No completed tickets</Text>
                </TabsContent>
            </Tabs>
        </View>
    ),
};
