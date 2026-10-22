import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NumberFormatter from '../NumberFormatter/NumberFormatter.vue';
import FormatBytes from './FormatBytes.vue';
import FormatDate from './FormatDate.vue';
import FormatDateTime from './FormatDateTime.vue';
import FormatList from './FormatList.vue';
import FormatRelativeTime from './FormatRelativeTime.vue';

const meta = {
    title: 'Data/Format',
    component: FormatRelativeTime,
    args: { value: '2026-10-21T09:57:00Z', now: '2026-10-21T10:00:00Z' },
} satisfies Meta<typeof FormatRelativeTime>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "3 minutes ago" in a <time datetime>, the exact time as the title */
export const Playground: Story = {};

/** Every format component; the language follows the LocaleProvider (toolbar) */
export const All: Story = {
    name: 'All',
    render: () => ({
        components: {
            FormatBytes,
            FormatDate,
            FormatDateTime,
            FormatList,
            FormatNumber: NumberFormatter,
            FormatRelativeTime,
        },
        setup: () => ({ fiveMinutesAgo: Date.now() - 5 * 60_000 }),
        template: `
            <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                <dt class="text-muted">FormatRelativeTime (live)</dt>
                <dd><FormatRelativeTime :value="fiveMinutesAgo" live /></dd>
                <dt class="text-muted">FormatDate</dt>
                <dd><FormatDate value="2026-10-21" :format-options="{ dateStyle: 'full' }" /></dd>
                <dt class="text-muted">FormatDateTime, Berlin / New York</dt>
                <dd>
                    <FormatDateTime value="2026-10-21T12:30:00Z" time-zone="Europe/Berlin" /> ·
                    <FormatDateTime value="2026-10-21T12:30:00Z" time-zone="America/New_York" />
                </dd>
                <dt class="text-muted">FormatBytes</dt>
                <dd><FormatBytes :value="1234567" /> · <FormatBytes :value="1234567" base="binary" /></dd>
                <dt class="text-muted">FormatList</dt>
                <dd><FormatList :items="['Anna', 'Ben', 'Clara']" /> · <FormatList :items="['Email', 'SMS']" type="disjunction" /></dd>
                <dt class="text-muted">FormatNumber</dt>
                <dd><FormatNumber :value="0.425" :format-options="{ style: 'percent', maximumFractionDigits: 1 }" /></dd>
            </dl>`,
    }),
};
