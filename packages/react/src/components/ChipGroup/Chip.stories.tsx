import type { Meta, StoryObj } from '@storybook/react-vite';
import { MapPin, Tag } from 'lucide-react';
import { useState } from 'react';
import { Chip } from './Chip.js';

// Portrait as inline SVG, so Storybook and the tests need no network
const portrait = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#7c3aed"/><circle cx="32" cy="26" r="12" fill="#ede9fe"/><rect x="12" y="44" width="40" height="24" rx="12" fill="#ede9fe"/></svg>'
)}`;

const meta = {
    title: 'Data/Chip',
    component: Chip,
    args: { label: 'Frankfurt', removable: true, size: 'md', disabled: false, icon: MapPin },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, icon: { control: false } },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Outside a ChipGroup a chip is a label: with an icon or an image, optionally removable */
export const Overview: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-2">
            <Chip label="Frankfurt" icon={MapPin} />
            <Chip label="Julia Klein" avatar={portrait} removable />
            <Chip label="Hosting" icon={Tag} removable size="sm" />
            <Chip label="Locked" removable disabled />
            <Chip label="Large" size="lg" removable />
        </div>
    ),
};

function RemovableDemo() {
    const all = ['Berlin', 'Frankfurt', 'Munich'];
    const [cities, setCities] = useState(all);
    return (
        <div className="flex flex-wrap items-center gap-2">
            {cities.map((city) => (
                <Chip
                    key={city}
                    label={city}
                    removable
                    onRemove={() => setCities((current) => current.filter((c) => c !== city))}
                />
            ))}
            {!cities.length && (
                <button type="button" className="text-sm underline" onClick={() => setCities(all)}>
                    Reset
                </button>
            )}
        </div>
    );
}

/** Removing: the button is named "Remove <Label>"; move the focus on yourself after removing */
export const Removable: Story = { render: () => <RemovableDemo /> };
