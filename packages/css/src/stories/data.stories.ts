import type { Meta, StoryObj } from '@storybook/html-vite';
import { barsListWidths, bulletScale, funnelStages, watermarkBackground } from '@wirecore/wirelayer-recipes';
import { html, icons } from './icons.ts';

export default { title: 'Data' } satisfies Meta;
type Story = StoryObj;

export const Badges: Story = {
    name: 'Badge',
    render: () =>
        html` <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px">
            <span class="wc-badge wc-badge-solid">NEW</span>
            <span class="wc-badge">BETA</span>
            <span class="wc-badge wc-badge-outline">v2.4.1</span>
            <span class="wc-badge wc-badge-success">${icons.circleCheck('wc-badge-icon')}Online</span>
            <span class="wc-badge wc-badge-info">${icons.info('wc-badge-icon')}Maintenance</span>
            <span class="wc-badge wc-badge-warn">${icons.triangleAlert('wc-badge-icon')}High load</span>
            <span class="wc-badge wc-badge-danger">${icons.octagonX('wc-badge-icon')}Offline</span>
        </div>`,
};

/** With a name: one image for assistive tech; without: decorative */
export const Avatars: Story = {
    name: 'Avatar',
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
            <div style="display:flex;gap:12px">
                <div class="wc-avatar wc-avatar-solid" role="img" aria-label="Julia Klein">
                    <span class="wc-avatar-fallback">JK</span>
                </div>
                <div class="wc-avatar" role="img" aria-label="Max Schulz">
                    <span class="wc-avatar-fallback">MS</span>
                </div>
                <div class="wc-avatar wc-avatar-outline wc-avatar-square" role="img" aria-label="Anna Berg">
                    <span class="wc-avatar-fallback">AB</span>
                </div>
            </div>
            <div class="wc-avatar-group" role="group" aria-label="Project team">
                <div class="wc-avatar wc-avatar-sm wc-avatar-grouped" role="img" aria-label="Julia Klein">
                    <span class="wc-avatar-fallback">JK</span>
                </div>
                <div class="wc-avatar wc-avatar-sm wc-avatar-grouped" role="img" aria-label="Max Schulz">
                    <span class="wc-avatar-fallback">MS</span>
                </div>
                <span class="wc-avatar-group-more" role="img" aria-label="5 more">+5</span>
            </div>
        </div>`,
};

export const Cards: Story = {
    name: 'Card',
    render: () =>
        html` <a href="#" class="wc-card wc-card-interactive" style="width:320px">
            <span class="wc-badge wc-badge-outline">01</span>
            <strong>Software &amp; Web</strong>
            <span>Web applications, websites, internal tools, APIs and automation.</span>
        </a>`,
};

/** Static table – sorting and paging need JavaScript (@wirecore/wirelayer-vue|react/data-table) */
export const Table: Story = {
    render: () =>
        html` <div class="wc-data-table" style="width:520px">
            <div class="wc-data-table-scroll">
                <table class="wc-data-table-table">
                    <caption class="wc-data-table-caption">
                        Server
                    </caption>
                    <thead>
                        <tr class="wc-data-table-head-row">
                            <th scope="col" class="wc-data-table-th">Name</th>
                            <th scope="col" class="wc-data-table-th">Location</th>
                            <th scope="col" class="wc-data-table-th wc-data-table-end">Load</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="wc-data-table-row">
                            <td class="wc-data-table-td">web-01</td>
                            <td class="wc-data-table-td">Frankfurt</td>
                            <td class="wc-data-table-td wc-data-table-end">42%</td>
                        </tr>
                        <tr class="wc-data-table-row">
                            <td class="wc-data-table-td">db-primary</td>
                            <td class="wc-data-table-td">Frankfurt</td>
                            <td class="wc-data-table-td wc-data-table-end">71%</td>
                        </tr>
                        <tr class="wc-data-table-row">
                            <td class="wc-data-table-td">backup-02</td>
                            <td class="wc-data-table-td">Nuremberg</td>
                            <td class="wc-data-table-td wc-data-table-end">96%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>`,
};

const event = (status: string, icon: string, datetime: string, time: string, title: string, description = '') =>
    html` <li class="wc-timeline-item">
        <span class="wc-timeline-rail" aria-hidden="true"></span>
        <span class="wc-timeline-marker${status ? ` wc-timeline-${status}` : ''}" aria-hidden="true">${icon}</span>
        <div class="wc-timeline-content">
            <time class="wc-timeline-time" datetime="${datetime}">${time}</time>
            <span class="wc-timeline-title">${title}</span>
            ${description ? `<span class="wc-timeline-description">${description}</span>` : ''}
        </div>
    </li>`;

/** An ordered list; the markers are decoration – the status is also in the text */
export const Timeline: Story = {
    render: () =>
        html` <ol class="wc-timeline" aria-label="History" style="max-width:28rem">
            ${event(
                '',
                icons.gitCommit('wc-timeline-marker-icon'),
                '2026-10-20T09:12',
                'Oct 20, 2026, 9:12 AM',
                'Change submitted',
                'Merge request !412 by Julia Klein'
            )}
            ${event(
                'danger',
                icons.circleAlert('wc-timeline-marker-icon'),
                '2026-10-20T09:40',
                'Oct 20, 2026, 9:40 AM',
                'Tests failed',
                '2 of 1,504 checks failing'
            )}
            ${event(
                'success',
                icons.circleCheck('wc-timeline-marker-icon'),
                '2026-10-20T10:05',
                'Oct 20, 2026, 10:05 AM',
                'Tests passed'
            )}
            ${event(
                'info',
                icons.rocket('wc-timeline-marker-icon'),
                '2026-10-20T10:30',
                'Oct 20, 2026, 10:30 AM',
                'Rolled out',
                'Production, Frankfurt'
            )}
        </ol>`,
};

const person = (label: string, title: string, children = '') =>
    html` <li class="wc-org-chart-item">
        <div class="wc-org-chart-node">
            <span class="wc-org-chart-label">${label}</span><span class="wc-org-chart-title">${title}</span>
        </div>
        ${children ? `<ul class="wc-org-chart-list">${children}</ul>` : ''}
    </li>`;

/** Nested lists – screen readers read the hierarchy, the lines are drawn with CSS */
export const OrgChart: Story = {
    render: () =>
        html` <div class="wc-org-chart">
            <ul class="wc-org-chart-root-list" aria-label="Org chart">
                <li class="wc-org-chart-root-item">
                    <div class="wc-org-chart-node">
                        <span class="wc-org-chart-label">Florian Laabs</span
                        ><span class="wc-org-chart-title">Management</span>
                    </div>
                    <ul class="wc-org-chart-list">
                        ${person(
                            'Julia Klein',
                            'Engineering',
                            person('Max Schulz', 'Frontend') + person('Ana Lopez', 'Backend')
                        )}
                        ${person('Tom Becker', 'Operations', person('Sara Wolf', 'Platform'))}
                        ${person('Lena Roth', 'Sales')}
                    </ul>
                </li>
            </ul>
        </div>`,
};

/** The bar is decoration; the legend lists every part with its share as text */
export const MeterGroup: Story = {
    render: () =>
        html` <div class="wc-meter-group" role="group" aria-labelledby="storage-label" style="width:380px">
            <span class="wc-meter-group-label" id="storage-label">Storage (1 TB)</span>
            <div class="wc-meter-group-bar" aria-hidden="true">
                <span class="wc-meter-group-segment" style="width:42%"></span
                ><span class="wc-meter-group-segment wc-meter-group-info" style="width:26%"></span
                ><span class="wc-meter-group-segment wc-meter-group-success" style="width:9%"></span>
            </div>
            <ul class="wc-meter-group-legend">
                <li class="wc-meter-group-legend-item">
                    <span class="wc-meter-group-swatch" aria-hidden="true"></span> Databases
                    <span class="wc-meter-group-value">42 %</span>
                </li>
                <li class="wc-meter-group-legend-item">
                    <span class="wc-meter-group-swatch wc-meter-group-info" aria-hidden="true"></span> Backups
                    <span class="wc-meter-group-value">26 %</span>
                </li>
                <li class="wc-meter-group-legend-item">
                    <span class="wc-meter-group-swatch wc-meter-group-success" aria-hidden="true"></span> Logs
                    <span class="wc-meter-group-value">9 %</span>
                </li>
            </ul>
        </div>`,
};

/** A key or a combination – plain <kbd> */
export const Kbd: Story = {
    render: () =>
        html` <p style="display:flex;align-items:center;gap:4px;font-size:14px">
            Search with <kbd class="wc-kbd">Ctrl</kbd> + <kbd class="wc-kbd">K</kbd>
        </p>`,
};

/** Search hits as <mark> */
export const Highlight: Story = {
    render: () => html` <p style="font-size:14px"><mark class="wc-highlight">Server</mark> web-01 in Frankfurt</p>`,
};

/** Terms and values as a description list; labels next to the values, lines between */
export const DataList: Story = {
    render: () =>
        html` <dl class="wc-data-list wc-data-list-horizontal wc-data-list-divided" style="width:24rem">
            <div class="wc-data-list-item">
                <dt class="wc-data-list-term">Server</dt>
                <dd class="wc-data-list-details">web-01</dd>
            </div>
            <div class="wc-data-list-item">
                <dt class="wc-data-list-term">Location</dt>
                <dd class="wc-data-list-details">Frankfurt</dd>
            </div>
            <div class="wc-data-list-item">
                <dt class="wc-data-list-term">Created</dt>
                <dd class="wc-data-list-details">10/20/2026</dd>
            </div>
        </dl>`,
};

/** A real table: the color level (data-level 0–4) only adds to the value */
export const Heatmap: Story = {
    render: () =>
        html` <div class="wc-heatmap">
            <table class="wc-heatmap-table">
                <caption class="wc-heatmap-caption">
                    Requests per day
                </caption>
                <thead>
                    <tr>
                        <td></td>
                        <th scope="col" class="wc-heatmap-column-header">Mon</th>
                        <th scope="col" class="wc-heatmap-column-header">Tue</th>
                        <th scope="col" class="wc-heatmap-column-header">Wed</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row" class="wc-heatmap-row-header">Frankfurt</th>
                        <td class="wc-heatmap-cell" data-level="1">12</td>
                        <td class="wc-heatmap-cell" data-level="4">40</td>
                        <td class="wc-heatmap-cell" data-level="3">31</td>
                    </tr>
                    <tr>
                        <th scope="row" class="wc-heatmap-row-header">Vienna</th>
                        <td class="wc-heatmap-cell" data-level="0">3</td>
                        <td class="wc-heatmap-cell" data-level="2">19</td>
                        <td class="wc-heatmap-cell" data-level="3">25</td>
                    </tr>
                </tbody>
            </table>
            <div class="wc-heatmap-legend" aria-hidden="true">
                <span>Less</span><span class="wc-heatmap-legend-cell" data-level="0"></span
                ><span class="wc-heatmap-legend-cell" data-level="1"></span
                ><span class="wc-heatmap-legend-cell" data-level="2"></span
                ><span class="wc-heatmap-legend-cell" data-level="3"></span
                ><span class="wc-heatmap-legend-cell" data-level="4"></span><span>More</span>
            </div>
        </div>`,
};

/** role="meter" with the value as text; the arc's dash is the share of the range (157 = whole arc) */
export const Gauge: Story = {
    render: () =>
        html` <div
            class="wc-gauge wc-gauge-warn"
            role="meter"
            aria-label="CPU load"
            aria-valuenow="82"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuetext="82%"
        >
            <svg class="wc-gauge-svg" viewBox="0 0 120 74" aria-hidden="true">
                <path class="wc-gauge-track" d="M10 62 A50 50 0 0 1 110 62" stroke-width="10" />
                <path
                    class="wc-gauge-range"
                    d="M10 62 A50 50 0 0 1 110 62"
                    stroke-width="10"
                    stroke-dasharray="128.8 157.08"
                />
                <text class="wc-gauge-value" x="60" y="58" text-anchor="middle">82%</text>
                <text class="wc-gauge-bounds" x="10" y="73" text-anchor="middle">0%</text>
                <text class="wc-gauge-bounds" x="110" y="73" text-anchor="middle">100%</text>
            </svg>
            <span class="wc-gauge-label" aria-hidden="true">CPU load</span>
        </div>`,
};

/** Round badge for a count or a single character */
export const BadgeCircle: Story = {
    name: 'Badge circle',
    render: () =>
        html` <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px">
            <span class="wc-badge wc-badge-solid wc-badge-circle">4</span>
            <span class="wc-badge wc-badge-danger wc-badge-circle">12</span>
            <span class="wc-badge wc-badge-outline wc-badge-circle">A</span>
        </div>`,
};

/** Sizes up to 2xl; `wc-avatar-<color>` tints the background (the components pick it from the name) */
export const AvatarSizes: Story = {
    name: 'Avatar sizes',
    render: () =>
        html` <div style="display:flex;align-items:center;gap:10px">
            ${['sm', 'md', 'lg', 'xl', '2xl']
                .map(
                    (size) =>
                        `<div class="wc-avatar wc-avatar-${size} wc-avatar-info" role="img" aria-label="Julia Klein"><span class="wc-avatar-fallback">JK</span></div>`
                )
                .join('')}
        </div>`,
};

// Picture as inline SVG, so Storybook and the tests need no network
const picture = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#0d9488"/><stop offset="1" stop-color="#1e66f5"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/></svg>'
)}`;

/** Title, subtitle, media and actions: the parts come from `wc-card-parts-*` */
export const CardWithTitle: Story = {
    name: 'Card with title',
    render: () =>
        html` <div class="wc-card" style="width:320px">
            <div class="wc-card-parts-media">
                <img src="${picture}" alt="" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover" />
            </div>
            <div class="wc-card-parts-content">
                <div class="wc-card-parts-header">
                    <div class="wc-card-parts-heading">
                        <h3 class="wc-card-parts-title">Managed Hosting</h3>
                        <p class="wc-card-parts-subtitle">Data centers in Frankfurt</p>
                    </div>
                    <span class="wc-badge wc-badge-success">New</span>
                </div>
                <p style="font-size:14px;color:var(--color-muted)">
                    Operations, monitoring and backups around the clock.
                </p>
                <div class="wc-card-parts-footer">
                    <button type="button" class="wc-button wc-button-sm">Inquire</button>
                    <button type="button" class="wc-button wc-button-text wc-button-sm">Details</button>
                </div>
            </div>
        </div>`,
};

// Portrait as inline SVG
const portrait = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#7c3aed"/><circle cx="32" cy="26" r="12" fill="#ede9fe"/><rect x="12" y="44" width="40" height="24" rx="12" fill="#ede9fe"/></svg>'
)}`;
const remove = (label: string, disabled = false) =>
    `<button type="button" class="wc-chip-remove" aria-label="Remove ${label}"${disabled ? ' disabled' : ''}>${icons.x('wc-chip-remove-icon')}</button>`;

/** A label with an icon or an image; the remove button needs JavaScript to remove the chip */
export const Chip: Story = {
    render: () =>
        html` <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
            <span class="wc-chip">${icons.house('wc-chip-icon')}<span class="wc-chip-label">Frankfurt</span></span>
            <span class="wc-chip wc-chip-removable wc-chip-with-avatar"
                ><img class="wc-chip-avatar" src="${portrait}" alt="" /><span class="wc-chip-label">Julia Klein</span
                >${remove('Julia Klein')}</span
            >
            <span class="wc-chip wc-chip-sm wc-chip-removable"
                ><span class="wc-chip-label">Hosting</span>${remove('Hosting')}</span
            >
            <span class="wc-chip wc-chip-removable wc-chip-disabled"
                ><span class="wc-chip-label">Locked</span>${remove('Locked', true)}</span
            >
            <span class="wc-chip wc-chip-lg wc-chip-removable"
                ><span class="wc-chip-label">Large</span>${remove('Large')}</span
            >
        </div>`,
};

const step = (index: number, time: string, title: string, opposite: string, active = false) =>
    html` <li class="wc-timeline-item${active ? ' wc-timeline-active' : ''}" ${active ? ' aria-current="step"' : ''}>
        <span class="wc-timeline-rail" aria-hidden="true"></span>
        <div class="wc-timeline-opposite">${opposite}</div>
        <span class="wc-timeline-marker" aria-hidden="true"></span>
        <div class="wc-timeline-content">
            <time class="wc-timeline-time">${time}</time>
            <span class="wc-timeline-title">${title}</span>
        </div>
    </li>`;

/** Marker in the middle, content alternating sides; the active event carries aria-current="step" */
export const TimelineAlternate: Story = {
    name: 'Timeline alternate',
    render: () =>
        html` <ol
            class="wc-timeline wc-timeline-alternate wc-timeline-with-opposite"
            aria-label="History"
            style="max-width:42rem"
        >
            ${step(0, 'Q1 2026', 'Planning', 'Completed')} ${step(1, 'Q2 2026', 'Implementation', 'In progress', true)}
            ${step(2, 'Q3 2026', 'Pilot', 'Planned')} ${step(3, 'Q4 2026', 'Rollout', 'Planned')}
        </ol>`,
};

const pageLink = (page: number, current = false) =>
    html`<a
        href="?page=${page}"
        class="wc-pagination-item"
        aria-label="Page ${page} of 6"
        ${current ? 'aria-current="page" data-selected' : ''}
        >${page}</a
    >`;

/**
 * Page navigation as links (the server renders the current page): summary, previous/next and the pages; the
 * current page carries aria-current="page" and data-selected.
 */
export const Pagination: Story = {
    render: () =>
        html`<nav class="wc-pagination" style="width:420px" aria-label="Pagination">
            <span class="wc-pagination-summary">1–10 of 60</span>
            <div class="wc-pagination-list">
                <a
                    class="wc-pagination-trigger"
                    role="link"
                    aria-label="Previous page"
                    aria-disabled="true"
                    data-disabled
                    >${icons.chevronLeft('wc-pagination-trigger-icon')}</a
                >
                ${[1, 2, 3, 4, 5, 6].map((page) => pageLink(page, page === 1)).join('')}
                <a class="wc-pagination-trigger" href="?page=2" aria-label="Next page"
                    >${icons.chevronRight('wc-pagination-trigger-icon')}</a
                >
            </div>
        </nav>`,
};

/** Compact: "Page 2 of 5" between the arrows, with links to the first and last page */
export const PaginationCompact: Story = {
    render: () =>
        html`<nav class="wc-pagination" style="width:420px" aria-label="Pagination">
            <span class="wc-pagination-summary">11–20 of 50</span>
            <div class="wc-pagination-list">
                <a class="wc-pagination-trigger" href="?page=1" aria-label="First page"
                    >${icons.chevronsLeft('wc-pagination-trigger-icon')}</a
                >
                <a class="wc-pagination-trigger" href="?page=1" aria-label="Previous page"
                    >${icons.chevronLeft('wc-pagination-trigger-icon')}</a
                >
                <span class="wc-pagination-compact">Page 2 of 5</span>
                <a class="wc-pagination-trigger" href="?page=3" aria-label="Next page"
                    >${icons.chevronRight('wc-pagination-trigger-icon')}</a
                >
                <a class="wc-pagination-trigger" href="?page=5" aria-label="Last page"
                    >${icons.chevronsRight('wc-pagination-trigger-icon')}</a
                >
            </div>
        </nav>`,
};

const descriptionItem = (label: string, value: string, span = '') =>
    html` <div
        class="wc-descriptions-item"
        ${span ? ` data-span="${span}" style="--wc-span:${span === 'full' ? 999 : span}"` : ''}
    >
        <dt class="wc-descriptions-term">${label}</dt>
        <dd class="wc-descriptions-details">${value}</dd>
    </div>`;

/** Terms and values in columns (--wc-cols …), spanning items (data-span + --wc-span), table look */
export const Descriptions: Story = {
    render: () =>
        html` <div class="wc-descriptions wc-descriptions-bordered wc-descriptions-horizontal">
            <div class="wc-descriptions-header">
                <h3 class="wc-descriptions-title">Contract</h3>
                <div class="wc-descriptions-actions">
                    <button type="button" class="wc-button wc-button-outline wc-button-sm">Edit</button>
                </div>
            </div>
            <dl class="wc-descriptions-list" style="--wc-cols:1;--wc-cols-md:2">
                ${descriptionItem('Customer', 'Northside Utilities Inc.')}
                ${descriptionItem('Contract number', 'V-2026-0815')}
                ${descriptionItem('Status', '<span class="wc-badge wc-badge-success">Active</span>')}
                ${descriptionItem('Start', '03/01/2026')} ${descriptionItem('Term', '24 months', '2')}
                ${descriptionItem(
                    'Note',
                    'Renews for 12 months at a time, cancelable with three months of notice.',
                    'full'
                )}
            </dl>
        </div>`,
};

const statistic = (label: string, value: string, tone: string, trend: string, trendLabel: string, icon = '') =>
    html` <div class="wc-statistic wc-statistic-${tone} wc-statistic-bordered">
        <div class="wc-statistic-header"><span class="wc-statistic-label">${label}</span>${icon}</div>
        <div class="wc-statistic-value"><span>${value}</span></div>
        <p class="wc-statistic-footer">
            <span class="wc-statistic-trend"
                >${(tone === 'positive' ? icons.trendingUp : icons.trendingDown)('wc-statistic-trend-icon')}${trend}</span
            ><span>${trendLabel}</span>
        </p>
    </div>`;

/** Key figure: the trend is arrow and text with sign – the color (tone) only adds to it */
export const Statistic: Story = {
    render: () =>
        html` <div style="display:grid;grid-template-columns:repeat(2,288px);gap:16px">
            ${statistic('Revenue', '€48,250', 'positive', '+12%', 'vs. previous month', icons.euro('wc-statistic-icon'))}
            ${statistic('Error rate', '0.8%', 'positive', '-12%', 'fewer errors')}
        </div>`,
};

/** Person with avatar (decorative, the name follows), role and presence as dot with text */
export const Persona: Story = {
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
            <div class="wc-persona">
                <span class="wc-persona-avatar" aria-hidden="true"
                    ><span class="wc-avatar wc-avatar-success"><span class="wc-avatar-fallback">AB</span></span></span
                >
                <span class="wc-persona-body">
                    <span class="wc-persona-name">Anna Berg</span>
                    <span class="wc-persona-description">Project lead</span>
                    <span class="wc-status-dot wc-status-dot-success wc-persona-presence"
                        ><span class="wc-status-dot-dot" aria-hidden="true"></span>Online</span
                    >
                </span>
            </div>
            <a class="wc-persona wc-persona-lg wc-persona-interactive" href="#ben">
                <span class="wc-persona-avatar" aria-hidden="true"
                    ><span class="wc-avatar wc-avatar-lg"><span class="wc-avatar-fallback">BO</span></span></span
                >
                <span class="wc-persona-body">
                    <span class="wc-persona-name">Ben Ott</span>
                    <span class="wc-persona-description">Engineering</span>
                </span>
            </a>
        </div>`,
};

const longText =
    'Migration of the customer portal to the new platform with single sign-on, multi-tenancy, archiving and a new reporting system for management';

/** Cut text: one line or `--wc-lines` lines; without JavaScript the full text sits in the title */
export const Truncate: Story = {
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:12px;width:288px;font-size:14px;line-height:20px">
            <span class="wc-truncate wc-truncate-text" title="${longText}">${longText}</span>
            <p class="wc-truncate wc-truncate-text wc-truncate-many" style="--wc-lines:2" title="${longText} (2)">
                ${longText} (2)
            </p>
        </div>`,
};

/** "AI-generated" as text (the explanation needs JavaScript: AiLabel's toggletip) */
export const AiLabel: Story = {
    render: () =>
        html` <span class="wc-ai-label"
            ><span class="wc-ai-label-badge">${icons.sparkles('wc-ai-label-icon')}AI-generated</span></span
        >`,
};

const watermark = watermarkBackground({ text: 'Confidential', rotate: -22, opacity: 0.15, fontSize: 16 });

/**
 * Repeated text over the content: a layer with the tile as background image (an SVG data URL, made once with
 * watermarkBackground from @wirecore/wirelayer-recipes), hidden from screen readers, clicks go through
 */
export const Watermark: Story = {
    render: () =>
        html` <div
            class="wc-watermark"
            style="width:440px;border:1px solid var(--wc-line);border-radius:8px;padding:20px"
        >
            <h3 style="font-size:16px;line-height:24px;font-weight:600">Quote 2026-118</h3>
            <p style="margin-top:8px;font-size:14px;line-height:20px;color:var(--wc-muted)">
                Scope of services, prices and terms. For internal use only – the watermark is decoration and is not read
                aloud.
            </p>
            <div
                class="wc-watermark-layer"
                aria-hidden="true"
                style="background-image:${watermark.backgroundImage.replace(/"/g, '&quot;')};background-size:${watermark.backgroundSize}"
            ></div>
        </div>`,
};

const pages = [
    { label: '/start', value: 12840 },
    { label: '/pricing', value: 8310 },
    { label: '/blog/release-2-4', value: 5120 },
    { label: '/contact', value: 2210 },
    { label: '/careers', value: 940 },
];
const pageWidths = barsListWidths(pages.map((page) => page.value));

/** Labels with a bar behind each one (width = share of the largest value, computed with barsListWidths) */
export const BarsList: Story = {
    render: () =>
        html` <div class="wc-bars-list" style="width:28rem;max-width:100%">
            <p class="wc-bars-list-title" id="bars-title">Most visited pages</p>
            <div class="wc-bars-list-header" aria-hidden="true"><span>Page</span><span>Views</span></div>
            <ul class="wc-bars-list-list" role="list" aria-labelledby="bars-title">
                ${pages
                    .map(
                        (page, index) => `<li class="wc-bars-list-item${index === 4 ? ' wc-bars-list-success' : ''}">
                    <span class="wc-bars-list-bar" style="width:${pageWidths[index]}%" aria-hidden="true"></span>
                    <span class="wc-bars-list-label">${index < 2 ? `<a class="wc-bars-list-link" href="#">${page.label}</a>` : page.label}</span>
                    <span class="wc-bars-list-value">${page.value.toLocaleString('en-US')}</span>
                </li>`
                    )
                    .join('')}
            </ul>
        </div>`,
};

const orders = funnelStages([
    { label: 'Visits', value: 18400 },
    { label: 'Product page', value: 7350 },
    { label: 'Cart', value: 2100 },
    { label: 'Checkout', value: 1240 },
    { label: 'Ordered', value: 860 },
]);
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

/** Bars narrowing with the value (widths from funnelStages), conversion between them; a table as text */
export const Funnel: Story = {
    render: () =>
        html` <figure class="wc-funnel" style="width:42rem;max-width:100%">
            <figcaption class="wc-funnel-title" id="funnel-title">Orders in October</figcaption>
            <div class="wc-funnel-stages" role="img" aria-labelledby="funnel-title">
                ${orders
                    .map(
                        (
                            stage
                        ) => `${stage.fromPrevious === undefined ? '' : `<div class="wc-funnel-conversion">${percent.format(stage.fromPrevious)} of the previous stage</div>`}
                <div class="wc-funnel-stage">
                    <span class="wc-funnel-label">${stage.label}</span>
                    <div class="wc-funnel-track"><div class="wc-funnel-bar" style="width:${stage.width}%"></div></div>
                    <span class="wc-funnel-value">${stage.value.toLocaleString('en-US')}</span>
                </div>`
                    )
                    .join('')}
            </div>
            <details class="wc-chart-details">
                <summary class="wc-chart-summary">Data as table</summary>
                <div class="wc-chart-scroll">
                    <table class="wc-chart-table">
                        <caption class="wc-chart-caption">
                            Orders in October
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col" class="wc-chart-th">Stage</th>
                                <th scope="col" class="wc-chart-th">Value</th>
                                <th scope="col" class="wc-chart-th">Conversion</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders
                                .map(
                                    (stage) =>
                                        `<tr><th scope="row" class="wc-chart-row-header">${stage.label}</th><td class="wc-chart-td">${stage.value.toLocaleString('en-US')}</td><td class="wc-chart-td">${stage.fromPrevious === undefined ? '–' : percent.format(stage.fromPrevious)}</td></tr>`
                                )
                                .join('')}
                        </tbody>
                    </table>
                </div>
            </details>
        </figure>`,
};

const revenue = bulletScale({ value: 270, target: 250, max: 300, ranges: [150, 225, 300] });

/** role="meter" with value, end and target as text; bands, bar and target positioned in percent (bulletScale) */
export const BulletChart: Story = {
    render: () =>
        html` <div class="wc-bullet-chart" style="width:36rem;max-width:100%">
            <div class="wc-bullet-chart-header">
                <span class="wc-bullet-chart-label" id="bullet-label">Revenue</span>
                <span class="wc-bullet-chart-description" id="bullet-description">k€</span>
            </div>
            <div
                class="wc-bullet-chart-meter"
                role="meter"
                aria-labelledby="bullet-label"
                aria-describedby="bullet-description"
                aria-valuemin="0"
                aria-valuemax="300"
                aria-valuenow="270"
                aria-valuetext="270 of 300, target 250"
            >
                ${revenue.bands.map((band) => `<span class="wc-bullet-chart-band" data-band="${band.band}" style="width:${band.width}%"></span>`).join('')}
                <span class="wc-bullet-chart-bar" style="width:${revenue.value}%"></span>
                <span class="wc-bullet-chart-target" style="inset-inline-start:${revenue.target}%"></span>
            </div>
            <div class="wc-bullet-chart-values" aria-hidden="true">
                <span class="wc-bullet-chart-current">270</span><span>Target: 250</span><span>300</span>
            </div>
        </div>`,
};

/** Messages as articles: author and time, the bubble (Markdown rendered on the server), attachments, status */
export const ChatMessages: Story = {
    render: () =>
        html` <div class="wc-chat-messages" style="width:42rem;max-width:100%">
            <div class="wc-chat-messages-viewport" role="log" aria-label="Messages" tabindex="0">
                <div class="wc-chat-messages-separator"><span>Monday, October 20, 2026</span></div>
                <div class="wc-chat-messages-message" data-first="true">
                    <article class="wc-chat-message">
                        <div class="wc-chat-message-avatar" aria-hidden="true">
                            <div class="wc-avatar wc-avatar-sm" role="img" aria-label="Anna Berg">
                                <span class="wc-avatar-fallback">AB</span>
                            </div>
                        </div>
                        <div class="wc-chat-message-body">
                            <div class="wc-chat-message-header">
                                <span class="wc-chat-message-author">Anna Berg</span>
                                <time class="wc-chat-message-time" datetime="2026-10-20T07:15:00.000Z">9:15 AM</time>
                            </div>
                            <div class="wc-chat-message-bubble">
                                <div class="wc-prose">
                                    <p>Here is the <strong>report</strong> for October.</p>
                                </div>
                                <ul class="wc-chat-message-attachments" aria-label="Attachments">
                                    <li class="wc-chat-message-attachment">
                                        ${icons.paperclip('wc-chat-message-attachment-icon')}<a href="#" download
                                            >report-october.pdf</a
                                        ><span class="wc-chat-message-attachment-size">200 KB</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </article>
                </div>
                <div class="wc-chat-messages-message" data-first="true">
                    <article class="wc-chat-message wc-chat-message-end wc-chat-message-read">
                        <div class="wc-chat-message-avatar" aria-hidden="true"></div>
                        <div class="wc-chat-message-body">
                            <div class="wc-chat-message-header">
                                <time class="wc-chat-message-time" datetime="2026-10-20T07:16:00.000Z">9:16 AM</time>
                            </div>
                            <div class="wc-chat-message-bubble">
                                <div class="wc-prose"><p>Thanks, I will take a look.</p></div>
                            </div>
                            <div class="wc-chat-message-meta">
                                ${icons.checkCheck('wc-chat-message-status-icon')}<span>Read</span>
                            </div>
                        </div>
                    </article>
                </div>
                <div class="wc-chat-messages-message" data-first="true">
                    <article class="wc-chat-message wc-chat-message-center">
                        <div class="wc-chat-message-body">
                            <div class="wc-chat-message-bubble">
                                <div class="wc-prose"><p>Anna Berg left the chat</p></div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </div>`,
};
