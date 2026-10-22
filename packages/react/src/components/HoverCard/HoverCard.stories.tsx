import type { Meta, StoryObj } from '@storybook/react-vite';
import type { OverlayHandle } from '@wirecore/wirelayer-recipes';
import { useRef, useState } from 'react';
import { Avatar } from '../Avatar/Avatar.js';
import { HoverCard } from './HoverCard.js';

const meta = {
    title: 'Overlays/HoverCard',
    component: HoverCard,
    args: { openDelay: 500, closeDelay: 300, content: null, children: <span /> },
    argTypes: { content: { control: false }, children: { control: false } },
    render: (args) => (
        <p className="text-sm">
            Owner:{' '}
            <HoverCard
                openDelay={args.openDelay}
                closeDelay={args.closeDelay}
                content={
                    <div className="flex items-center gap-3">
                        <Avatar name="Julia Klein" />
                        <div className="flex flex-col">
                            <span className="font-semibold">Julia Klein</span>
                            <span className="text-xs text-muted">Engineering · Frankfurt</span>
                        </div>
                    </div>
                }
            >
                <a href="#julia" className="font-semibold underline underline-offset-2">
                    Julia Klein
                </a>
            </HoverCard>
        </p>
    ),
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function OpenAtAnchorDemo() {
    const card = useRef<OverlayHandle>(null);
    const [name, setName] = useState('');
    return (
        <div className="flex gap-4 text-sm">
            {['Julia Klein', 'Jonas Weber'].map((person) => (
                <button
                    key={person}
                    type="button"
                    className="underline underline-offset-2"
                    onClick={(event) => {
                        setName(person);
                        card.current?.toggle(event.currentTarget);
                    }}
                >
                    {person}
                </button>
            ))}
            <HoverCard ref={card} content={<span className="text-sm">{name} · Engineering</span>} />
        </div>
    );
}

/** Opened from code at an element (`card.open(element)`, ref) – here at the name that was clicked */
export const OpenAtAnchor: Story = { render: () => <OpenAtAnchorDemo /> };
