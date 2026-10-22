import type { Meta, StoryObj } from '@storybook/html-vite';
import { html, icons } from './icons.ts';

export default { title: 'Buttons/IconButton' } satisfies Meta;
type Story = StoryObj;

/** The visible counter stays part of the accessible name (WCAG 2.5.3) */
export const Badges: Story = {
    render: () =>
        html` <div style="display:flex;gap:12px">
            <button type="button" class="wc-icon-button" aria-label="Notifications, 4 new">
                ${icons.bell('wc-icon-button-icon')}<span class="wc-icon-button-badge" aria-hidden="true">4</span>
            </button>
            <button type="button" class="wc-icon-button" aria-label="Inbox, new">
                ${icons.mail('wc-icon-button-icon')}<span class="wc-icon-button-dot" aria-hidden="true"></span>
            </button>
        </div>`,
};

export const Variants: Story = {
    render: () =>
        html` <div style="display:flex;align-items:center;gap:8px">
            <button type="button" class="wc-icon-button wc-icon-button-primary" aria-label="New">
                ${icons.check('wc-icon-button-icon')}
            </button>
            <button type="button" class="wc-icon-button wc-icon-button-secondary wc-icon-button-sm" aria-label="Search">
                ${icons.search('wc-icon-button-icon')}
            </button>
            <button type="button" class="wc-icon-button wc-icon-button-text wc-icon-button-lg" aria-label="Start">
                ${icons.house('wc-icon-button-icon')}
            </button>
        </div>`,
};

/** A count or dot on any element; screen readers get the label instead of the number */
export const OverlayBadge: Story = {
    render: () =>
        html` <div style="display:flex;align-items:center;gap:32px">
            <span class="wc-overlay-badge">
                <div class="wc-avatar" role="img" aria-label="Julia Klein">
                    <span class="wc-avatar-fallback">JK</span>
                </div>
                <span class="wc-overlay-badge-badge" aria-hidden="true">3</span>
                <span class="wc-overlay-badge-label">3 unread messages</span>
            </span>
            <span class="wc-overlay-badge">
                ${icons.mail('')}
                <span class="wc-overlay-badge-badge" aria-hidden="true">99+</span>
                <span class="wc-overlay-badge-label">120 new notifications</span>
            </span>
            <span class="wc-overlay-badge">
                <div class="wc-avatar wc-avatar-solid" role="img" aria-label="Max Schulz">
                    <span class="wc-avatar-fallback">MS</span>
                </div>
                <span class="wc-overlay-badge-dot" aria-hidden="true"></span>
                <span class="wc-overlay-badge-label">Online</span>
            </span>
        </div>`,
};
