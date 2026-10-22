import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DownloadTrigger from './DownloadTrigger.vue';

const csv = 'Server,Location,Utilization\nweb-01,Frankfurt,42\ndb-primary,Frankfurt,71\n';

const meta = {
    title: 'Buttons/DownloadTrigger',
    component: DownloadTrigger,
    args: { data: csv, fileName: 'server.csv', mimeType: 'text/csv', variant: 'outline' },
    render: (args) => ({
        components: { DownloadTrigger },
        setup: () => ({ args }),
        template: `<DownloadTrigger v-bind="args">Download CSV</DownloadTrigger>`,
    }),
} satisfies Meta<typeof DownloadTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Saves text, a Blob or a fetched file; busy while the data is prepared */
export const Playground: Story = {};

/** The data is made on click (here after a short wait – the button shows it is busy) */
export const Generated: Story = {
    name: 'Generated',
    render: () => ({
        components: { DownloadTrigger },
        setup: () => ({
            build: () =>
                new Promise<Blob>((resolve) =>
                    setTimeout(
                        () =>
                            resolve(
                                new Blob([JSON.stringify({ export: new Date().toISOString() })], {
                                    type: 'application/json',
                                })
                            ),
                        800
                    )
                ),
        }),
        template: `<DownloadTrigger :data="build" file-name="export.json" variant="primary">Create export</DownloadTrigger>`,
    }),
};
