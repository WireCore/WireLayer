import type { Meta, StoryObj } from '@storybook/html-vite';
import { html, icons } from './icons.ts';

export default { title: 'Feedback' } satisfies Meta;
type Story = StoryObj;

const alert = (status: string, icon: string, title: string, text: string) => {
    const role = status === 'danger' || status === 'warn' ? 'alert' : 'status';
    return html` <div class="wc-alert wc-alert-${status}" role="${role}">
        <span class="wc-alert-icon-box">${icon}</span>
        <div class="wc-alert-content">
            <div class="wc-alert-title">${title}</div>
            <div class="wc-alert-description">${text}</div>
        </div>
        <button type="button" class="wc-alert-dismiss" aria-label="Close">${icons.x('wc-alert-dismiss-icon')}</button>
    </div>`;
};

/** role="alert" for warnings and errors, role="status" otherwise */
export const Alerts: Story = {
    name: 'Alert',
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:10px;width:420px">
            ${alert('success', icons.circleCheck('wc-alert-icon'), 'Deployment succeeded', 'customer-portal · v2.4.1 is live.')}
            ${alert('info', icons.info('wc-alert-icon'), 'Maintenance window', 'On Sunday from 2:00 to 4:00 AM.')}
            ${alert('warn', icons.triangleAlert('wc-alert-icon'), 'High load', 'web-02 has been above 85% for 10 minutes.')}
            ${alert('danger', icons.octagonX('wc-alert-icon'), 'Build failed', 'The test step exited with code 1.')}
        </div>`,
};

/** Only icon and text in the status color – e.g. below a field */
export const AlertSimple: Story = {
    name: 'Alert simple',
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:10px;width:420px">
            <div class="wc-alert wc-alert-simple wc-alert-danger" role="alert">
                <span class="wc-alert-icon-box">${icons.octagonX('wc-alert-icon')}</span>
                <div class="wc-alert-content">
                    <div class="wc-alert-description">Please enter a valid email address.</div>
                </div>
            </div>
            <div class="wc-alert wc-alert-simple wc-alert-success wc-alert-sm" role="status">
                <span class="wc-alert-icon-box">${icons.circleCheck('wc-alert-icon')}</span>
                <div class="wc-alert-content"><div class="wc-alert-description">Saved.</div></div>
            </div>
            <div class="wc-alert wc-alert-simple wc-alert-neutral wc-alert-sm" role="status">
                <span class="wc-alert-icon-box">${icons.info('wc-alert-icon')}</span>
                <div class="wc-alert-content">
                    <div class="wc-alert-description">Last changed 5 minutes ago.</div>
                </div>
            </div>
        </div>`,
};

export const Spinner: Story = {
    render: () =>
        html` <span class="wc-spinner wc-spinner-lg" role="status">
            ${icons.loader('wc-spinner-icon')}<span class="wc-spinner-label">Loading</span>
        </span>`,
};

export const StatusDot: Story = {
    render: () =>
        html` <div style="display:flex;flex-wrap:wrap;gap:8px">
            <span class="wc-status-dot wc-status-dot-success wc-status-dot-pulse"
                ><span class="wc-status-dot-dot" aria-hidden="true"></span>ONLINE</span
            >
            <span class="wc-status-dot wc-status-dot-info"
                ><span class="wc-status-dot-dot" aria-hidden="true"></span>MAINTENANCE</span
            >
            <span class="wc-status-dot wc-status-dot-warn"
                ><span class="wc-status-dot-dot" aria-hidden="true"></span>HIGH LOAD</span
            >
            <span class="wc-status-dot wc-status-dot-danger"
                ><span class="wc-status-dot-dot" aria-hidden="true"></span>OFFLINE</span
            >
            <span class="wc-status-dot"><span class="wc-status-dot-dot" aria-hidden="true"></span>PAUSED</span>
        </div>`,
};

const statusIcon = (status: string, icon: string, text: string) =>
    `<span class="wc-status-dot wc-status-dot-${status}">${icon}${text}</span>`;

/** Status icon instead of the dot: shape, color and text together */
export const StatusDotIcons: Story = {
    name: 'StatusDot icons',
    render: () =>
        html` <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${statusIcon('success', icons.circleCheck('wc-status-dot-icon'), 'ACTIVE')}
            ${statusIcon('info', icons.info('wc-status-dot-icon'), 'PLANNED')}
            ${statusIcon('warn', icons.triangleAlert('wc-status-dot-icon'), 'DELAYED')}
            ${statusIcon('danger', icons.octagonX('wc-status-dot-icon'), 'DISRUPTED')}
        </div>`,
};

/** The label names the progress bar; aria-valuetext announces the shown value */
export const Progress: Story = {
    render: () =>
        html` <div class="wc-progress" style="width:320px">
            <div class="wc-progress-header" aria-hidden="true">
                <span class="wc-progress-label">BUILD</span><span class="wc-progress-value">68 %</span>
            </div>
            <div
                class="wc-progress-track"
                role="progressbar"
                aria-label="BUILD"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="68"
                aria-valuetext="68 %"
            >
                <div class="wc-progress-range" style="width:68%"></div>
            </div>
        </div>`,
};

/**
 * A ring: the circle is a named progressbar with the value as aria-valuetext. The geometry follows the size
 * custom properties of .wc-progress-circle-circle (--size, --thickness).
 */
const ring = `--radius:calc(var(--size) / 2 - var(--thickness) / 2);cx:calc(var(--size) / 2);cy:calc(var(--size) / 2);r:var(--radius);fill:transparent;stroke-width:var(--thickness)`;
export const ProgressCircle: Story = {
    render: () =>
        html` <div class="wc-progress-circle">
            <div class="wc-progress-circle-circle">
                <svg
                    role="progressbar"
                    aria-label="Storage used"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow="72"
                    aria-valuetext="72 %"
                    style="width:var(--size);height:var(--size)"
                >
                    <circle class="wc-progress-circle-track" style="${ring}"></circle>
                    <circle
                        class="wc-progress-circle-range"
                        style="${ring};--circumference:calc(2 * 3.14159 * var(--radius));stroke-dasharray:var(--circumference);stroke-dashoffset:calc(var(--circumference) * 0.28);transform-origin:center;transform:rotate(-90deg)"
                    ></circle>
                </svg>
                <span class="wc-progress-circle-value" aria-hidden="true">72 %</span>
            </div>
            <span class="wc-progress-circle-label" aria-hidden="true">Storage used</span>
        </div>`,
};

/** Several parts in one bar; the legend names every part with its value (the color only adds to it) */
export const ProgressSegments: Story = {
    render: () =>
        html` <div class="wc-progress" style="width:380px">
            <div class="wc-progress-header" aria-hidden="true">
                <span class="wc-progress-label">Storage</span><span class="wc-progress-value">77 %</span>
            </div>
            <div
                class="wc-progress-track"
                role="progressbar"
                aria-label="Storage"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="77"
                aria-valuetext="77 %"
            >
                <div class="wc-progress-segments">
                    <span class="wc-progress-segment" style="width:42%" title="420 GB"></span>
                    <span class="wc-progress-segment wc-progress-success" style="width:26%" title="260 GB"></span>
                    <span class="wc-progress-segment wc-progress-warn" style="width:9%" title="90 GB"></span>
                </div>
            </div>
            <ul class="wc-progress-legend">
                <li class="wc-progress-legend-item">
                    <span class="wc-progress-swatch" aria-hidden="true"></span>Databases
                    <span class="wc-progress-legend-value">42 %</span>
                </li>
                <li class="wc-progress-legend-item">
                    <span class="wc-progress-swatch wc-progress-success" aria-hidden="true"></span>Backups
                    <span class="wc-progress-legend-value">26 %</span>
                </li>
                <li class="wc-progress-legend-item">
                    <span class="wc-progress-swatch wc-progress-warn" aria-hidden="true"></span>Logs
                    <span class="wc-progress-legend-value">9 %</span>
                </li>
            </ul>
        </div>`,
};

/** Stripes on the bar (wc-progress-striped); moving with wc-progress-animated, only without reduced motion */
export const ProgressStriped: Story = {
    render: () =>
        html` <div class="wc-progress wc-progress-striped wc-progress-animated" style="width:380px">
            <div class="wc-progress-header" aria-hidden="true">
                <span class="wc-progress-label">Upload</span><span class="wc-progress-value">55 %</span>
            </div>
            <div
                class="wc-progress-track"
                role="progressbar"
                aria-label="Upload"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="55"
                aria-valuetext="55 %"
            >
                <div class="wc-progress-range" style="width:55%"></div>
            </div>
        </div>`,
};

// Parts of a ring (r = 45 of a 100 wide drawing): dash length and offset per part, a small gap between them
const circumference = 2 * Math.PI * 45;
const ringPart = (start: number, share: number) =>
    `stroke-dasharray="${((share - 0.006) * circumference).toFixed(2)} ${circumference.toFixed(2)}" stroke-dashoffset="${(-start * circumference).toFixed(2)}"`;

/** Ring with several parts: a group named by the label, the legend gives every part as text */
export const RingProgress: Story = {
    render: () =>
        html` <div class="wc-ring-progress wc-ring-progress-lg" role="group" aria-labelledby="ring-label">
            <div class="wc-ring-progress-ring">
                <svg class="wc-ring-progress-svg" viewBox="0 0 100 100" aria-hidden="true">
                    <circle class="wc-ring-progress-track" cx="50" cy="50" r="45" stroke-width="10"></circle>
                    <circle
                        class="wc-ring-progress-segment"
                        cx="50"
                        cy="50"
                        r="45"
                        stroke-width="10"
                        ${ringPart(0, 0.42)}
                    ></circle>
                    <circle
                        class="wc-ring-progress-segment wc-ring-progress-success"
                        cx="50"
                        cy="50"
                        r="45"
                        stroke-width="10"
                        ${ringPart(0.42, 0.26)}
                    ></circle>
                    <circle
                        class="wc-ring-progress-segment wc-ring-progress-warn"
                        cx="50"
                        cy="50"
                        r="45"
                        stroke-width="10"
                        ${ringPart(0.68, 0.09)}
                    ></circle>
                </svg>
                <div class="wc-ring-progress-center"><span class="wc-ring-progress-value">77%</span></div>
            </div>
            <span id="ring-label" class="wc-ring-progress-label">Storage (1 TB)</span>
            <ul class="wc-ring-progress-legend">
                <li class="wc-ring-progress-legend-item">
                    <span class="wc-ring-progress-swatch" aria-hidden="true"></span>Databases
                    <span class="wc-ring-progress-legend-value">42%</span>
                </li>
                <li class="wc-ring-progress-legend-item">
                    <span class="wc-ring-progress-swatch wc-ring-progress-success" aria-hidden="true"></span>Backups
                    <span class="wc-ring-progress-legend-value">26%</span>
                </li>
                <li class="wc-ring-progress-legend-item">
                    <span class="wc-ring-progress-swatch wc-ring-progress-warn" aria-hidden="true"></span>Logs
                    <span class="wc-ring-progress-legend-value">9%</span>
                </li>
            </ul>
        </div>`,
};

/** An empty list or search: icon, title, text and the next step */
export const EmptyState: Story = {
    render: () =>
        html` <div class="wc-empty-state wc-empty-state-dashed" style="width:28rem">
            <span class="wc-empty-state-icon">${icons.search('wc-empty-state-icon-svg')}</span>
            <h2 class="wc-empty-state-title">No servers yet</h2>
            <p class="wc-empty-state-description">Create your first server – it will be ready in two minutes.</p>
            <div class="wc-empty-state-actions">
                <button type="button" class="wc-button">Create server</button>
                <button type="button" class="wc-button wc-button-outline">Guide</button>
            </div>
        </div>`,
};

/** Save state with icon and text (role="status"): wc-save-status-saving / -saved / -error */
export const SaveStatus: Story = {
    render: () =>
        html`<div style="display:flex;flex-direction:column;gap:8px">
            <span class="wc-save-status wc-save-status-saving" role="status"
                >${icons.loader('wc-save-status-spinner')} Saving …</span
            >
            <span class="wc-save-status wc-save-status-saved" role="status"
                >${icons.circleCheck('wc-save-status-icon')} Saved</span
            >
            <span class="wc-save-status wc-save-status-error" role="status"
                >${icons.circleAlert('wc-save-status-icon')} Saving failed</span
            >
        </div>`,
};

const banner = (variant: string, icon: string, message: string, title = '', role = 'status') =>
    html` <div class="wc-banner wc-banner-${variant}">
        ${icon}
        <div role="${role}" class="wc-banner-content">
            ${title ? `<span class="wc-banner-title">${title}</span>` : ''}<span class="wc-banner-message"
                >${message}</span
            >
        </div>
    </div>`;

/** Page-wide notices; danger is an alert (role="alert"), the others are polite (role="status") */
export const Banners: Story = {
    name: 'Banner',
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:12px">
            ${banner('info', icons.info('wc-banner-icon'), 'New features in the customer portal – available to everyone today.')}
            ${banner('success', icons.circleCheck('wc-banner-icon'), 'Your data has been transferred.', 'Done')}
            ${banner('warn', icons.triangleAlert('wc-banner-icon'), 'Limited availability Saturday 10–11 PM.', 'Maintenance')}
            ${banner(
                'danger',
                icons.circleAlert('wc-banner-icon'),
                'Payment processing is down. We are working on it.',
                'Outage',
                'alert'
            )}
            ${banner('neutral', icons.megaphone('wc-banner-icon'), 'Trial ends in 5 days.')}
            <div class="wc-banner wc-banner-info">
                ${icons.info('wc-banner-icon')}
                <div role="status" class="wc-banner-content">
                    <span class="wc-banner-title">Cookies</span
                    ><span class="wc-banner-message">We only use technically necessary cookies.</span>
                </div>
                <div class="wc-banner-actions">
                    <button type="button" class="wc-button wc-button-outline wc-button-sm">Settings</button>
                    <button type="button" class="wc-button wc-button-sm">Accept all</button>
                </div>
                <button type="button" class="wc-banner-dismiss" aria-label="Dismiss notice">
                    ${icons.x('wc-banner-dismiss-icon')}
                </button>
            </div>
        </div>`,
};

/** Result and error pages: decorative illustration, code (403/404/500), title, text, actions */
export const Result: Story = {
    render: () =>
        html` <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))">
            <div class="wc-result wc-result-success">
                <div class="wc-result-illustration" aria-hidden="true">${icons.circleCheck('wc-result-icon')}</div>
                <h2 class="wc-result-title">Order placed</h2>
                <p class="wc-result-description">You will receive a confirmation email in a few minutes.</p>
                <div class="wc-result-actions"><button type="button" class="wc-button">Go to overview</button></div>
            </div>
            <div class="wc-result wc-result-404">
                <div class="wc-result-illustration" aria-hidden="true">${icons.searchX('wc-result-icon')}</div>
                <p class="wc-result-code">404</p>
                <h2 class="wc-result-title">Page not found</h2>
                <p class="wc-result-description">The page does not exist or has been moved.</p>
                <div class="wc-result-actions">
                    <a class="wc-button wc-button-outline" href="#">Back</a>
                    <a class="wc-button" href="#">Go to home page</a>
                </div>
            </div>
        </div>`,
};
