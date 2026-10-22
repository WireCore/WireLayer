import type { Meta, StoryObj } from '@storybook/html-vite';
import { html, icons } from './icons.ts';

const row = 'display:flex;flex-wrap:wrap;align-items:center;gap:8px';

export default { title: 'Buttons/Button' } satisfies Meta;
type Story = StoryObj;

export const Variants: Story = {
    render: () =>
        html` <div style="${row}">
            <button type="button" class="wc-button">Start project ${icons.arrowRight('wc-button-icon')}</button>
            <button type="button" class="wc-button wc-button-secondary">Secondary</button>
            <button type="button" class="wc-button wc-button-success">${icons.check('wc-button-icon')} Save</button>
            <button type="button" class="wc-button wc-button-info">Info</button>
            <button type="button" class="wc-button wc-button-warn">Warning</button>
            <button type="button" class="wc-button wc-button-danger">${icons.trash('wc-button-icon')} Delete</button>
            <button type="button" class="wc-button wc-button-outline">View services</button>
            <button type="button" class="wc-button wc-button-soft">Tinted</button>
            <button type="button" class="wc-button wc-button-text">Text</button>
            <a href="#" class="wc-button wc-button-link">Link</a>
        </div>`,
};

export const Sizes: Story = {
    render: () =>
        html` <div style="${row}">
            <button type="button" class="wc-button wc-button-xs">
                Extra small ${icons.arrowRight('wc-button-icon')}
            </button>
            <button type="button" class="wc-button wc-button-sm">Small ${icons.arrowRight('wc-button-icon')}</button>
            <button type="button" class="wc-button">Default ${icons.arrowRight('wc-button-icon')}</button>
            <button type="button" class="wc-button wc-button-lg">Large ${icons.arrowRight('wc-button-icon')}</button>
        </div>`,
};

/** Busy: aria-busy + aria-disabled keep the button focusable; disabled removes it from the tab order */
export const States: Story = {
    render: () =>
        html` <div style="${row}">
            <button type="button" class="wc-button" aria-busy="true" aria-disabled="true">
                ${icons.loader('wc-button-icon wc-spinner-icon')} Sending
            </button>
            <button type="button" class="wc-button" disabled>Disabled</button>
        </div>`,
};

const colors: [string, string][] = [
    ['primary', 'Primary'],
    ['secondary', 'Secondary'],
    ['success', 'Success'],
    ['info', 'Info'],
    ['warn', 'Warning'],
    ['danger', 'Danger'],
    ['contrast', 'Contrast'],
];

/**
 * Color × style: `wc-button-color-<color>` on its own colors the fill, together with `wc-button-outline`,
 * `-soft`, `-text` or `-link` it colors that style
 */
export const ColorsAndStyles: Story = {
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:12px">
            ${['', 'wc-button-outline', 'wc-button-soft', 'wc-button-text', 'wc-button-link']
                .map(
                    (style) =>
                        `<div style="${row}">${colors
                            .map(
                                ([color, label]) =>
                                    `<button type="button" class="wc-button ${style} wc-button-color-${color}">${label}</button>`
                            )
                            .join('')}</div>`
                )
                .join('')}
        </div>`,
};

export const Shapes: Story = {
    render: () =>
        html` <div style="${row}">
            <button type="button" class="wc-button">Pill</button>
            <button type="button" class="wc-button wc-button-rounded">Rounded</button>
            <button type="button" class="wc-button wc-button-square">Square</button>
        </div>`,
};

/** The counter is hidden from assistive tech; the visually hidden text names it ("Notifications 4 new") */
export const Badges: Story = {
    render: () =>
        html` <div style="${row}">
            <button type="button" class="wc-button wc-button-outline">
                ${icons.bell('wc-button-icon')} Notifications
                <span class="wc-button-badge" aria-hidden="true">4</span
                ><span class="wc-button-badge-label"> 4 new</span>
            </button>
            <button type="button" class="wc-button wc-button-text">
                Inbox <span class="wc-button-dot" aria-hidden="true"></span
                ><span class="wc-button-badge-label"> new</span>
            </button>
        </div>`,
};

export const Block: Story = {
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:8px;max-width:24rem">
            <button type="button" class="wc-button wc-button-block">Sign in</button>
            <button type="button" class="wc-button wc-button-outline wc-button-block">Create account</button>
        </div>`,
};
