import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { ActionBar, type ActionBarProps } from './ActionBar.js';

const files = ['Quote.pdf', 'Invoice-2026-10.pdf', 'Contract.docx', 'Presentation.pptx'];

function Demo(args: ActionBarProps) {
    const [selected, setSelected] = useState(['Quote.pdf', 'Contract.docx']);
    return (
        <div className="flex w-[34rem] flex-col gap-4">
            <ul className="flex flex-col gap-2">
                {files.map((file) => (
                    <li key={file}>
                        <Checkbox
                            checked={selected.includes(file)}
                            onCheckedChange={(checked) =>
                                setSelected(checked ? [...selected, file] : selected.filter((name) => name !== file))
                            }
                        >
                            {file}
                        </Checkbox>
                    </li>
                ))}
            </ul>
            <ActionBar {...args} count={selected.length} onClear={() => setSelected([])}>
                <Button variant="text" size="sm" leadingIcon={Download}>
                    Download
                </Button>
                <Button variant="text" size="sm" leadingIcon={Archive}>
                    Archive
                </Button>
                <Button variant="text" size="sm" leadingIcon={Trash2}>
                    Delete
                </Button>
            </ActionBar>
        </div>
    );
}

const meta = {
    title: 'Data/ActionBar',
    component: ActionBar,
    args: { count: 0, placement: 'inline' },
    argTypes: { placement: { control: 'inline-radio', options: ['fixed', 'inline'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof ActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
