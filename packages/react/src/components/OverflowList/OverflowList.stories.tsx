import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Avatar } from '../Avatar/Avatar.js';
import { Badge } from '../Badge/Badge.js';
import { OverflowList } from './OverflowList.js';

const tags = ['Vue', 'React', 'Nuxt', 'Next.js', 'Tailwind', 'TypeScript', 'Docker', 'Kubernetes', 'PostgreSQL'];
const people = ['Anna Berg', 'Ben Ott', 'Clara Weiß', 'David Kühn', 'Eva Lang', 'Finn Roth', 'Gina Sommer'];
const badge = (item: string) => <Badge>{item}</Badge>;

const meta = {
    title: 'Data/OverflowList',
    component: OverflowList,
    args: { items: tags, renderItem: badge as (item: unknown) => ReactNode },
    render: () => (
        <div className="w-[min(420px,90vw)] resize-x overflow-auto rounded-lg border border-line p-3">
            <OverflowList items={tags} label="Technologies" renderItem={badge} />
        </div>
    ),
} satisfies Meta<typeof OverflowList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What does not fit goes behind "+N"; the popover lists the rest. Drag the corner to resize */
export const Playground: Story = {};

/** At most three, the rest behind "+N" even with room */
export const MaxVisible: Story = {
    render: () => <OverflowList items={tags} maxVisible={3} label="Technologies" renderItem={badge} />,
};

/** Avatars (like an AvatarGroup that shortens itself), hidden from the start */
export const People: Story = {
    name: 'People',
    render: () => (
        <div className="w-56 rounded-lg border border-line p-3">
            <OverflowList
                items={people}
                collapseFrom="start"
                label="Project team"
                renderItem={(item) => <Avatar name={item} color="auto" size="sm" />}
            />
        </div>
    ),
};

/** Up to two rows before shortening */
export const TwoRows: Story = {
    name: 'Two rows',
    render: () => (
        <div className="w-64 rounded-lg border border-line p-3">
            <OverflowList items={tags} maxRows={2} label="Technologies" renderItem={badge} />
        </div>
    ),
};
