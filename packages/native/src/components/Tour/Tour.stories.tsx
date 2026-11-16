import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Bell, Plus } from 'lucide-react-native';
import { useRef, useState, type ComponentRef } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs/Tabs.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Text } from '../Text/Text.js';
import { Tour } from './Tour.js';

function Demo() {
    const [open, setOpen] = useState(false);
    const [done, setDone] = useState(false);
    const create = useRef<ComponentRef<typeof View>>(null);
    const inbox = useRef<ComponentRef<typeof View>>(null);
    return (
        <View className="h-[420px] w-[360px] gap-4 p-4">
            <View className="flex-row items-center justify-between">
                <Text variant="title">Projects</Text>
                <View ref={inbox} collapsable={false}>
                    <IconButton icon={Bell} label="Alerts" badge={2} />
                </View>
            </View>
            <View ref={create} collapsable={false} className="self-start">
                <Button leadingIcon={Plus}>New project</Button>
            </View>
            <Button variant="outline" size="sm" onPress={() => setOpen(true)}>
                Start tour
            </Button>
            <Text variant="muted">{done ? 'Tour completed' : ''}</Text>
            <Tour
                open={open}
                onOpenChange={setOpen}
                onComplete={() => setDone(true)}
                steps={[
                    {
                        id: 'welcome',
                        title: 'Welcome',
                        description: 'In two steps we show you the essentials.',
                    },
                    {
                        id: 'create',
                        title: 'Create project',
                        description: 'Create a new project here.',
                        target: create,
                    },
                    {
                        id: 'inbox',
                        title: 'Alerts',
                        description: 'New alerts appear here with their count.',
                        target: inbox,
                    },
                ]}
            />
        </View>
    );
}

const meta = {
    title: 'Overlays/Tour',
    component: Tour,
    args: { steps: [] },
    render: () => <Demo />,
} satisfies Meta<typeof Tour>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function Waiting() {
    const [tab, setTab] = useState<string | null>('servers');
    const [loaded, setLoaded] = useState(false);
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<string | null>(null);
    const add = useRef<ComponentRef<typeof View>>(null);
    const chart = useRef<ComponentRef<typeof View>>(null);
    const beta = useRef<ComponentRef<typeof View>>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    return (
        <View className="h-[420px] w-[360px] gap-4 p-4">
            <Tabs value={tab ?? undefined} onValueChange={setTab} label="Sections">
                <TabsList>
                    <TabsTrigger value="servers">Servers</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="servers">
                    <View ref={add} collapsable={false} className="self-start">
                        <Button variant="outline">Add server</Button>
                    </View>
                </TabsContent>
                <TabsContent value="reports">
                    {loaded ? (
                        <View ref={chart} collapsable={false} className="h-20 rounded-md bg-line" />
                    ) : (
                        <Text variant="muted">Loading …</Text>
                    )}
                </TabsContent>
            </Tabs>
            <Button variant="outline" size="sm" onPress={() => setOpen(true)}>
                Start tour
            </Button>
            <Text variant="muted">{`Step: ${step ?? '–'}`}</Text>
            <Tour
                open={open}
                onOpenChange={setOpen}
                step={step}
                onStepChange={setStep}
                steps={[
                    {
                        id: 'servers',
                        title: 'Servers',
                        description: 'Add servers here.',
                        target: add,
                        before: () => setTab('servers'),
                    },
                    {
                        id: 'load',
                        title: 'Load',
                        description: 'The chart of the reports – the tour waits until it has loaded.',
                        target: chart,
                        before: () => {
                            setTab('reports');
                            clearTimeout(timer.current);
                            timer.current = setTimeout(() => setLoaded(true), 1500);
                        },
                        waitFor: 5000,
                    },
                    { id: 'beta', title: 'Beta', description: 'Not there – skipped.', target: beta },
                    { id: 'end', title: 'That is it', description: 'Start the tour again at any time.' },
                ]}
            />
        </View>
    );
}

/**
 * Steps that need the app first: `before` switches the tab, `waitFor` waits for the chart while it loads (1.5 s).
 * A step whose target is not there ("Beta") is skipped. `step`/`onStepChange` show the current step.
 */
export const WaitingForTargets: Story = { render: () => <Waiting /> };
