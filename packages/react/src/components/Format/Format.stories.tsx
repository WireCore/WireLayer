import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { NumberFormatter as FormatNumber } from '../NumberFormatter/NumberFormatter.js';
import { FormatBytes, FormatDate, FormatDateTime, FormatList, FormatRelativeTime } from './Format.js';

const meta = {
    title: 'Data/Format',
    component: FormatRelativeTime,
    args: { value: '2026-10-21T09:57:00Z', now: '2026-10-21T10:00:00Z' },
} satisfies Meta<typeof FormatRelativeTime>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "3 minutes ago" in a <time datetime>, the exact time as the title */
export const Playground: Story = {};

function AllDemo() {
    const [fiveMinutesAgo] = useState(() => Date.now() - 5 * 60_000);
    return (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted">FormatRelativeTime (live)</dt>
            <dd>
                <FormatRelativeTime value={fiveMinutesAgo} live />
            </dd>
            <dt className="text-muted">FormatDate</dt>
            <dd>
                <FormatDate value="2026-10-21" formatOptions={{ dateStyle: 'full' }} />
            </dd>
            <dt className="text-muted">FormatDateTime, Berlin / New York</dt>
            <dd>
                <FormatDateTime value="2026-10-21T12:30:00Z" timeZone="Europe/Berlin" /> ·{' '}
                <FormatDateTime value="2026-10-21T12:30:00Z" timeZone="America/New_York" />
            </dd>
            <dt className="text-muted">FormatBytes</dt>
            <dd>
                <FormatBytes value={1234567} /> · <FormatBytes value={1234567} base="binary" />
            </dd>
            <dt className="text-muted">FormatList</dt>
            <dd>
                <FormatList items={['Anna', 'Ben', 'Clara']} /> ·{' '}
                <FormatList items={['Email', 'SMS']} type="disjunction" />
            </dd>
            <dt className="text-muted">FormatNumber</dt>
            <dd>
                <FormatNumber value={0.425} formatOptions={{ style: 'percent', maximumFractionDigits: 1 }} />
            </dd>
        </dl>
    );
}

/** Every format component; the language follows the LocaleProvider (toolbar) */
export const All: Story = { name: 'All', render: () => <AllDemo /> };
