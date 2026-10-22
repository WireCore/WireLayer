import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './Pagination.js';

const meta = {
    title: 'Data/Pagination',
    component: Pagination,
    args: { count: 12, pageSize: 4, siblingCount: 1, showSummary: true, className: 'w-[420px]' },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ManyPages: Story = {
    args: { count: 200, pageSize: 10, defaultPage: 10 },
};

/** "Page 2 of 5" between the arrows, with buttons to the first and last page */
export const Compact: Story = {
    args: { count: 50, pageSize: 10, defaultPage: 2, variant: 'compact', withEdges: true },
};

/** Compact automatically when the pagination is narrow (container query, here 288px) */
export const Auto: Story = {
    args: { count: 200, pageSize: 10, defaultPage: 5, variant: 'auto', className: 'w-72' },
};

/**
 * Rows per page (`pageSizes`, onPageSizeChange – the first item of the page stays in view), "go to page" and two
 * pages at each end (`boundaryCount`)
 */
export const PageSizesAndJumper: Story = {
    args: { count: 240, pageSize: 10, pageSizes: [10, 25, 50], jumper: true, boundaryCount: 2, className: 'w-[720px]' },
};

/** Links instead of buttons: the address keeps the page (`getPageHref`) */
export const Links: Story = {
    args: { count: 60, pageSize: 10, getPageHref: (page: number) => `?page=${page}` },
};
