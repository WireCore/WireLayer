import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chart } from './Chart.js';

const quarters = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
        { label: '2025', data: [182, 204, 197, 241] },
        { label: '2026', data: [215, 238, 262, 280] },
    ],
};

const meta = {
    title: 'Data/Chart',
    component: Chart,
    args: {
        type: 'bar',
        data: quarters,
        title: 'Revenue by quarter (k€)',
        hideTitle: false,
        table: true,
        className: 'max-w-2xl',
    },
    argTypes: {
        type: { control: 'inline-radio', options: ['bar', 'line'] },
        data: { control: false },
    },
    parameters: { layout: 'padded' },
} satisfies Meta<typeof Chart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Line: Story = {
    args: {
        type: 'line',
        title: 'Active users per month',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{ label: 'Users', data: [1240, 1380, 1295, 1510, 1720, 1865], tension: 0.3, fill: true }],
        },
    },
};

export const Doughnut: Story = {
    args: {
        type: 'doughnut',
        title: 'Tickets by status',
        height: '16rem',
        data: {
            labels: ['Done', 'In progress', 'Waiting', 'Blocked'],
            datasets: [{ label: 'Tickets', data: [128, 42, 17, 6] }],
        },
        options: { plugins: { legend: { position: 'right' } } },
    },
};
