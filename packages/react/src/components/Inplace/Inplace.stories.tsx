import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { Input } from '../Input/Input.js';
import { Inplace } from './Inplace.js';

function Demo() {
    const [name, setName] = useState('web-01');
    const [draft, setDraft] = useState(name);
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Server name:</span>
            <Inplace display={name} onActiveChange={(active) => active && setDraft(name)}>
                {(close) => (
                    <>
                        <Input
                            value={draft}
                            size="sm"
                            aria-label="Server name"
                            className="w-40"
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key !== 'Enter') return;
                                setName(draft);
                                close();
                            }}
                        />
                        <Button
                            size="sm"
                            onClick={() => {
                                setName(draft);
                                close();
                            }}
                        >
                            Save
                        </Button>
                    </>
                )}
            </Inplace>
        </div>
    );
}

const meta = {
    title: 'Forms/Inplace',
    component: Inplace,
    args: { display: null, children: () => null },
    argTypes: { display: { control: false }, children: { control: false } },
    render: () => <Demo />,
} satisfies Meta<typeof Inplace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
