import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { QrCode } from './QrCode.js';

const meta = {
    title: 'Data/QrCode',
    component: QrCode,
    args: { value: 'https://customer-portal.example/ticket/2026-0815', showValue: true },
} satisfies Meta<typeof QrCode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
