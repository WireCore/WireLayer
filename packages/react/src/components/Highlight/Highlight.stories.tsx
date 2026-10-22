import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Input } from '../Input/Input.js';
import { Highlight } from './Highlight.js';

const results = ['Server web-01 in Frankfurt', 'Database server db-primary', 'Backup server in Nuremberg'];

function Demo() {
    const [query, setQuery] = useState('server');
    return (
        <div className="flex w-80 flex-col gap-3">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search" />
            <ul className="flex flex-col gap-1 text-sm">
                {results.map((result) => (
                    <li key={result}>
                        <Highlight text={result} query={query} />
                    </li>
                ))}
            </ul>
        </div>
    );
}

const meta = {
    title: 'Data/Highlight',
    component: Highlight,
    args: { text: results[0]!, query: 'server' },
    render: () => <Demo />,
} satisfies Meta<typeof Highlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Whole words only, accent-insensitive ("Muller" finds "Müller") and one colour per search term */
export const Options: Story = {
    render: () => (
        <p className="max-w-md text-sm leading-relaxed text-fg">
            <Highlight
                text="Mr. Müller looks after the webserver; Ms. Muller the server in the data center."
                query={['muller', 'server']}
                wholeWord
                ignoreAccents
                colors={['info', 'success']}
            />
        </p>
    ),
};
