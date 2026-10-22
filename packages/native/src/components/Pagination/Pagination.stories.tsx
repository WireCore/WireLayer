import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Pagination } from './Pagination.js';

function Demo({ variant }: { variant: 'full' | 'compact' }) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    return (
        <View className="w-[360px] gap-3">
            <Pagination
                count={240}
                page={page}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                pageSizes={variant === 'compact' ? [10, 25, 50] : undefined}
                variant={variant}
            />
            <Text variant="muted">{`Page ${page}, ${pageSize} per page`}</Text>
        </View>
    );
}

const meta = {
    title: 'Data/Pagination',
    component: Pagination,
    args: { count: 240 },
    render: () => <Demo variant="full" />,
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** "Page 2 of 24" between the arrows and the page size in a sheet – for narrow screens */
export const Compact: Story = { name: 'Compact with page size', render: () => <Demo variant="compact" /> };
