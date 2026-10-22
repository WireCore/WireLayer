import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Input from '../Input/Input.vue';
import Highlight from './Highlight.vue';

const results = ['Server web-01 in Frankfurt', 'Database server db-primary', 'Backup server in Nuremberg'];

const meta = {
    title: 'Data/Highlight',
    component: Highlight,
    args: { text: results[0]!, query: 'server' },
    render: () => ({
        components: { Highlight, Input },
        setup: () => ({ query: ref('server'), results }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Input v-model="query" aria-label="Search" />
                <ul class="flex flex-col gap-1 text-sm">
                    <li v-for="result in results" :key="result"><Highlight :text="result" :query="query" /></li>
                </ul>
            </div>`,
    }),
} satisfies Meta<typeof Highlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Whole words only, accent-insensitive ("Muller" finds "Müller") and one colour per search term */
export const Options: Story = {
    render: () => ({
        components: { Highlight },
        template: `
            <p class="max-w-md text-sm leading-relaxed text-fg">
                <Highlight
                    text="Mr. Müller looks after the webserver; Ms. Muller the server in the data center."
                    :query="['muller', 'server']"
                    whole-word
                    ignore-accents
                    :colors="['info', 'success']"
                />
            </p>`,
    }),
};
