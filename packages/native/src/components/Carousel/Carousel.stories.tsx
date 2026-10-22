import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Card } from '../Card/Card.js';
import { Text } from '../Text/Text.js';
import { Carousel } from './Carousel.js';

const customers = [
    { name: 'Northside Utilities', quote: 'Not a single unplanned downtime since the migration.' },
    { name: 'Crumb Bakery', quote: 'The shop is fast and orders arrive reliably.' },
    { name: 'Weber Law Office', quote: 'Our files stay in Germany – that mattered to us.' },
    { name: 'Bike House Co.', quote: 'Customers now book appointments themselves, even at night.' },
];

function Slide({ name, quote }: { name: string; quote: string }) {
    return (
        <Card className="h-40">
            <Text variant="title">{name}</Text>
            <Text variant="muted">{quote}</Text>
        </Card>
    );
}

function Demo({ autoplay, slidesPerPage }: { autoplay?: boolean; slidesPerPage?: number }) {
    const [page, setPage] = useState(0);
    return (
        <View className="w-[340px] gap-2">
            <Carousel
                items={customers}
                label="What our customers say"
                page={page}
                onPageChange={setPage}
                autoplay={autoplay}
                slidesPerPage={slidesPerPage}
            >
                {(item) => <Slide {...item} />}
            </Carousel>
            <Text variant="muted">{`Page ${page + 1}`}</Text>
        </View>
    );
}

const meta = {
    title: 'Media/Carousel',
    component: Carousel<(typeof customers)[number]>,
    args: { items: customers, label: 'What our customers say', children: (item) => <Slide {...item} /> },
    render: () => <Demo />,
} satisfies Meta<typeof Carousel<(typeof customers)[number]>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Turns by itself every 4 s – with a pause button, not with reduced motion */
export const Autoplay: Story = { name: 'Automatic', render: () => <Demo autoplay /> };

export const Peek: Story = { name: 'Peek at the next one', render: () => <Demo slidesPerPage={1.2} /> };
