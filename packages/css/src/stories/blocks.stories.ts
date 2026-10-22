import type { Meta, StoryObj } from '@storybook/html-vite';
import { html, icons } from './icons.ts';

export default { title: 'Blocks/CtaSection' } satisfies Meta;
type Story = StoryObj;

export const Playground: Story = {
    render: () =>
        html` <section class="wc-cta-section" aria-labelledby="cta-title" style="width:560px">
            <h2 class="wc-cta-section-title" id="cta-title">Ready for your next project?</h2>
            <p class="wc-cta-section-description">Free, no-obligation advice – from the first idea to operations.</p>
            <div class="wc-cta-section-actions">
                <a href="#" class="wc-button wc-button-inverted">Get in touch ${icons.arrowRight('wc-button-icon')}</a>
            </div>
        </section>`,
};
