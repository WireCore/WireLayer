import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Archive, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';
import { useSelection } from '../../hooks/index.js';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { IconButton } from '../IconButton/IconButton.js';
import { ActionBar } from './ActionBar.js';

const files = ['Quote.pdf', 'Invoice-0815.pdf', 'Contract.docx', 'Logo.svg'];

function Demo() {
    const selection = useSelection(files);
    return (
        <View className="h-[360px] w-[360px] gap-3">
            {files.map((file) => (
                <Checkbox
                    key={file}
                    checked={selection.isSelected(file)}
                    onCheckedChange={() => selection.toggle(file)}
                >
                    {file}
                </Checkbox>
            ))}
            <ActionBar count={selection.selected.length} onClear={selection.clear}>
                <IconButton icon={Archive} label="Archive" variant="text" />
                <IconButton icon={Trash2} label="Delete" variant="text" color="danger" />
            </ActionBar>
        </View>
    );
}

const meta = {
    title: 'Data/ActionBar',
    component: ActionBar,
    args: { count: 0 },
    render: () => <Demo />,
} satisfies Meta<typeof ActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
