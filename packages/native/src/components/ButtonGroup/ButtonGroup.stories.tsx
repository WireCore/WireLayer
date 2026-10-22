import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { ButtonGroup } from './ButtonGroup.js';

const meta = {
    title: 'Buttons/ButtonGroup',
    component: ButtonGroup,
    render: () => (
        <View className="w-80 gap-3">
            <ButtonGroup label="Period">
                <Button variant="outline">Day</Button>
                <Button variant="outline">Week</Button>
                <Button variant="outline">Month</Button>
            </ButtonGroup>
            <ButtonGroup label="Alignment">
                <IconButton icon={AlignLeft} label="Left" />
                <IconButton icon={AlignCenter} label="Center" />
                <IconButton icon={AlignRight} label="Right" />
            </ButtonGroup>
            <ButtonGroup label="Actions" block>
                <Button>Save</Button>
                <Button variant="secondary">Draft</Button>
            </ButtonGroup>
            <ButtonGroup label="Stacked" orientation="vertical">
                <Button variant="outline">Top</Button>
                <Button variant="outline">Center</Button>
                <Button variant="outline">Bottom</Button>
            </ButtonGroup>
        </View>
    ),
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
