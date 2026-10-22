import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Pencil } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { PageHeader } from './PageHeader.js';

const meta = {
    title: 'Layout/PageHeader',
    component: PageHeader,
    args: {
        title: 'Customer portal',
        subtitle: 'Managed Hosting · Frankfurt',
        status: 'Online',
        statusVariant: 'success',
        onBack: () => {},
        divided: true,
        actions: (
            <Button size="sm" variant="outline" leadingIcon={Pencil}>
                Edit
            </Button>
        ),
        meta: <Text variant="muted">Last changed on Oct 20, 2026</Text>,
    },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
