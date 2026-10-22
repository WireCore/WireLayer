import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { pictures } from '../../../.storybook/pictures.js';
import { Image } from '../Image/Image.js';
import { AspectRatio } from './AspectRatio.js';

const meta = {
    title: 'Layout/AspectRatio',
    component: AspectRatio,
    args: { ratio: 16 / 9 },
    render: (args) => (
        <View className="w-[320px]">
            <AspectRatio {...args}>
                <Image src={pictures[2]!.src} alt={pictures[2]!.alt} className="size-full" />
            </AspectRatio>
        </View>
    ),
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
