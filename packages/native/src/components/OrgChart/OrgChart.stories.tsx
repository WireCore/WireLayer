import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Badge } from '../Badge/Badge.js';
import { Text } from '../Text/Text.js';
import { OrgChart, type OrgChartNode } from './OrgChart.js';

const company: OrgChartNode = {
    id: 'ceo',
    label: 'Miriam Keller',
    title: 'Management',
    children: [
        {
            id: 'cto',
            label: 'Jonas Weber',
            title: 'Technology',
            children: [
                { id: 'dev', label: 'Lea Fischer', title: 'Engineering' },
                { id: 'ops', label: 'Tim Becker', title: 'Operations' },
            ],
        },
        {
            id: 'cfo',
            label: 'Sara Wolf',
            title: 'Finance',
            children: [{ id: 'acc', label: 'Paul Schäfer', title: 'Accounting' }],
        },
        { id: 'hr', label: 'Nina Braun', title: 'HR' },
    ],
};

const meta = {
    title: 'Data/OrgChart',
    component: OrgChart,
    args: { node: company, label: 'Org chart', collapsible: true },
    argTypes: { selectionMode: { control: 'inline-radio', options: ['none', 'single', 'multiple'] } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof OrgChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A team hidden from the start (defaultCollapsedKeys) */
export const Collapsed: Story = { name: 'Collapsed', args: { defaultCollapsedKeys: ['cto', 'cfo'] } };

function SelectionDemo() {
    const [selected, setSelected] = useState<string[]>(['cto']);
    return (
        <View className="gap-3">
            <OrgChart
                node={company}
                label="Org chart"
                collapsible
                selectionMode="multiple"
                selectedKeys={selected}
                onSelectedKeysChange={setSelected}
            />
            <Text variant="muted">Selected: {selected.join(', ') || '–'}</Text>
        </View>
    );
}

/** People can be chosen (toggle buttons, several) */
export const Selection: Story = { name: 'Selection', render: () => <SelectionDemo /> };

const lazyCompany: OrgChartNode = {
    id: 'ceo',
    label: 'Miriam Keller',
    title: 'Management',
    children: [
        { id: 'cto', label: 'Jonas Weber', title: 'Technology', hasChildren: true },
        { id: 'cfo', label: 'Sara Wolf', title: 'Finance', hasChildren: true },
    ],
};

function LazyDemo() {
    // "Sara Wolf" fails the first time – the button then loads again
    const failedOnce = useRef(false);
    const loadChildren = (node: OrgChartNode, { signal }: { signal: AbortSignal }) =>
        new Promise<OrgChartNode[]>((resolve, reject) => {
            const timer = setTimeout(() => {
                if (node.id === 'cfo' && !failedOnce.current) {
                    failedOnce.current = true;
                    reject(new Error('Network error'));
                    return;
                }
                resolve(
                    node.id === 'cto'
                        ? [
                              { id: 'dev', label: 'Lea Fischer', title: 'Engineering' },
                              { id: 'ops', label: 'Tim Becker', title: 'Operations' },
                          ]
                        : [{ id: 'acc', label: 'Paul Schäfer', title: 'Accounting' }]
                );
            }, 800);
            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(Object.assign(new Error('Canceled'), { name: 'AbortError' }));
            });
        });
    return <OrgChart node={lazyCompany} label="Org chart" collapsible loadChildren={loadChildren} />;
}

/** Teams load when they are shown (0.8 s); the team of Sara Wolf fails the first time */
export const LazyLoading: Story = { name: 'Lazy loading', render: () => <LazyDemo /> };

/** Own content per card (renderContent) */
export const CustomContent: Story = {
    name: 'Custom rendering',
    args: {
        renderContent: (node, state) => (
            <View className="min-w-0 flex-1 flex-row items-center justify-between gap-2">
                <View className="min-w-0 shrink">
                    <Text className="font-sans-semibold">{node.label}</Text>
                    {!!node.title && <Text variant="muted">{node.title}</Text>}
                </View>
                {!!node.children?.length && (
                    <Badge variant={state.expanded ? 'soft' : 'outline'}>{`${node.children.length} in team`}</Badge>
                )}
            </View>
        ),
    },
};
