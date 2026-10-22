import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../Card/Card.js';
import { Masonry } from './Masonry.js';

const notes = [
    { title: 'Hosting', text: 'Data centers in Frankfurt and Nuremberg, ISO 27001.' },
    {
        title: 'Cloud',
        text: 'Kubernetes, CI/CD and monitoring – supported around the clock, with dedicated contacts and on-call staff on weekends.',
    },
    { title: 'Software', text: 'Portals and line-of-business applications.' },
    {
        title: 'AI',
        text: 'Assistants, search across your own documents and automation of routine tasks in existing workflows.',
    },
    { title: 'Security', text: 'Penetration tests and training.' },
    { title: 'Support', text: 'Phone, email and ticket – response within one hour.' },
];

const meta = {
    title: 'Layout/Masonry',
    component: Masonry,
    args: { columns: { base: 1, sm: 2, lg: 3 } },
    argTypes: { mode: { control: 'inline-radio', options: ['columns', 'rows'] } },
    render: (args) => (
        <Masonry {...args}>
            {notes.map((note) => (
                <Card key={note.title}>
                    <h3 className="text-sm font-semibold">{note.title}</h3>
                    <p className="mt-1 text-sm text-muted">{note.text}</p>
                </Card>
            ))}
        </Masonry>
    ),
} satisfies Meta<typeof Masonry>;

export default meta;
type Story = StoryObj<typeof meta>;

/** CSS columns, filled top to bottom – no JavaScript; the reading order is the order of the cards */
export const Playground: Story = {};

/** Measured rows, filled left to right */
export const Rows: Story = { args: { mode: 'rows' } };
