import type { Meta, StoryObj } from '@storybook/html-vite';
import { html } from './icons.ts';

export default { title: 'Buttons/ButtonGroup' } satisfies Meta;
type Story = StoryObj;

/** role="group" with a name; only the outer corners stay round */
export const Playground: Story = {
    render: () =>
        html` <div role="group" aria-label="View" class="wc-button-group">
            <button type="button" class="wc-button wc-button-outline">Day</button>
            <button type="button" class="wc-button wc-button-outline">Week</button>
            <button type="button" class="wc-button wc-button-outline">Month</button>
        </div>`,
};

export const Vertical: Story = {
    render: () =>
        html` <div role="group" aria-label="Alignment" class="wc-button-group wc-button-group-vertical">
            <button type="button" class="wc-button wc-button-outline wc-button-rounded">Top</button>
            <button type="button" class="wc-button wc-button-outline wc-button-rounded">Bottom</button>
        </div>`,
};
