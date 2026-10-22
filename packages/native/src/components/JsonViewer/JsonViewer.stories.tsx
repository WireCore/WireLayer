import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { JsonViewer } from './JsonViewer.js';

const server = {
    id: 'web-01',
    region: 'eu-central',
    online: true,
    load: 0.42,
    owner: null,
    tags: ['prod', 'frontend'],
    disks: [
        { name: 'system', size: 120, encrypted: true },
        { name: 'data', size: 2048, encrypted: false },
    ],
    contact: { team: 'Platform', mail: 'platform@example.com' },
};

const meta = {
    title: 'Data/JsonViewer',
    component: JsonViewer,
    args: { data: server, defaultExpandedDepth: 1, search: true, copyable: true, showTypes: false },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof JsonViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Objects and arrays open and close (buttons with aria-expanded); values coloured by type and readable as text.
 * Search marks the hits and opens their branches; the copy buttons copy on the web (an app passes `onCopy`).
 */
export const Playground: Story = {};

/** All open, the types written out */
export const WithTypes: Story = {
    name: 'With types',
    args: { defaultExpandedDepth: Infinity, showTypes: true, search: false },
};

/** A single value and an empty object */
export const Primitive: Story = {
    name: 'Single value',
    render: () => (
        <View className="gap-3">
            <JsonViewer data="Just some text" copyable={false} />
            <JsonViewer data={{}} />
        </View>
    ),
};
