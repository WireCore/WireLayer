import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { pictures } from '../../../.storybook/pictures.js';
import { Gallery } from './Gallery.js';

const meta = {
    title: 'Media/Gallery',
    component: Gallery,
    args: { images: pictures, label: 'Our Frankfurt location' },
    decorators: [(Story) => <View className="w-[340px]">{Story()}</View>],
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
