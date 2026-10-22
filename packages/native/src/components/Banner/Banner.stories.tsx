import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Banner } from './Banner.js';

const meta = {
    title: 'Feedback/Banner',
    component: Banner,
    args: {
        variant: 'info',
        title: 'Maintenance',
        children: 'The customer portal is unavailable on Saturday from 10 PM to midnight.',
        dismissible: true,
    },
    argTypes: { variant: { control: 'inline-radio', options: ['info', 'success', 'warn', 'danger', 'neutral'] } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
    name: 'Variants',
    render: () => (
        <View className="gap-3">
            <Banner variant="success" title="Saved">
                Your changes are live.
            </Banner>
            <Banner variant="warn" title="Certificate">
                Expires in 7 days.
            </Banner>
            <Banner
                variant="danger"
                title="Outage"
                actions={
                    <Button size="sm" variant="outline">
                        View status
                    </Button>
                }
            >
                Payments are currently not being processed.
            </Banner>
            <Banner variant="neutral" hideIcon>
                New: download invoices as PDF.
            </Banner>
        </View>
    ),
};
