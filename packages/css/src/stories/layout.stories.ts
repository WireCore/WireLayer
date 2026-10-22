import type { Meta, StoryObj } from '@storybook/html-vite';
import { markdownElements, type MarkdownElement } from '@wirecore/wirelayer-recipes';
import { html, icons } from './icons.ts';

export default { title: 'Layout' } satisfies Meta;
type Story = StoryObj;

/** Without a label a separator; with a label the lines are decorative and the text is read */
export const Divider: Story = {
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:20px;width:320px;font-size:14px">
            <span>Sign in with email</span>
            <div class="wc-divider">
                <span class="wc-divider-line" aria-hidden="true"></span><span class="wc-divider-label">or</span
                ><span class="wc-divider-line" aria-hidden="true"></span>
            </div>
            <span>Sign in with single sign-on</span>
            <div class="wc-divider wc-divider-plain" role="separator"></div>
            <div style="display:flex;align-items:center;gap:12px;height:24px">
                <span>Hosting</span>
                <div
                    class="wc-divider wc-divider-vertical wc-divider-plain"
                    role="separator"
                    aria-orientation="vertical"
                ></div>
                <span>Cloud</span>
            </div>
        </div>`,
};

const labelled = (label: string, modifiers: string) =>
    `<div class="wc-divider ${modifiers}"><span class="wc-divider-line" aria-hidden="true"></span><span class="wc-divider-label">${label}</span><span class="wc-divider-line" aria-hidden="true"></span></div>`;

/** Label at the start or end (`wc-divider-start`/`-end`), dashed and dotted lines */
export const DividerVariants: Story = {
    name: 'Divider variants',
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:20px;width:320px;font-size:14px">
            ${labelled('Details', 'wc-divider-start')} ${labelled('End', 'wc-divider-end wc-divider-dashed')}
            <div class="wc-divider wc-divider-plain wc-divider-dashed" role="separator"></div>
            ${labelled('or', 'wc-divider-dotted')}
        </div>`,
};

/** Hidden from assistive tech – the loading region carries aria-busy="true" */
export const Skeleton: Story = {
    render: () =>
        html` <div class="wc-card" style="width:320px" role="group" aria-busy="true" aria-label="Loading servers">
            <div style="display:flex;align-items:center;gap:12px">
                <span class="wc-skeleton wc-skeleton-circle" aria-hidden="true"></span>
                <div style="display:flex;flex:1;flex-direction:column;gap:8px">
                    <span class="wc-skeleton" style="width:60%" aria-hidden="true"></span>
                    <span class="wc-skeleton" style="width:40%" aria-hidden="true"></span>
                </div>
            </div>
            <span class="wc-skeleton wc-skeleton-rect" aria-hidden="true"></span>
            <span class="wc-skeleton" aria-hidden="true"></span>
            <span class="wc-skeleton" style="width:80%" aria-hidden="true"></span>
        </div>`,
};

/** A section with a heading, actions and a footer */
export const Panel: Story = {
    render: () =>
        html` <section class="wc-panel" style="max-width:32rem">
            <div class="wc-panel-header">
                <h3 class="wc-panel-title">Contract details</h3>
                <div class="wc-panel-actions">
                    <button
                        type="button"
                        class="wc-icon-button wc-icon-button-text wc-icon-button-sm"
                        aria-label="Edit contract details"
                    >
                        ${icons.pencil('wc-icon-button-icon')}
                    </button>
                </div>
            </div>
            <div class="wc-panel-content">
                <div class="wc-panel-body">
                    24-month term, renewing for 12 months at a time, three months' notice to cancel.
                </div>
                <div class="wc-panel-footer">
                    <button type="button" class="wc-button wc-button-outline wc-button-sm">Download contract</button>
                </div>
            </div>
        </section>`,
};

/** A named, focusable region – arrow keys scroll it (the browser's own scrollbars) */
export const ScrollPanel: Story = {
    render: () =>
        html` <div class="wc-scroll-panel" style="width:22rem;height:12rem;border:1px solid var(--wc-line)">
            <div
                class="wc-scroll-panel-viewport"
                role="region"
                aria-label="Terms of use"
                tabindex="0"
                style="overflow:auto"
            >
                <div class="wc-scroll-panel-content" style="padding:12px 16px;font-size:14px">
                    ${Array.from({ length: 12 }, (_, index) => `<p>§ ${index + 1} The provider delivers the services under this agreement.</p>`).join('')}
                </div>
            </div>
        </div>`,
};

/** Formatted text from the editor (HTML) – headings, lists, quotes, code and links */
export const Prose: Story = {
    render: () =>
        html` <div class="wc-prose" style="max-width:36rem">
            <h2>Maintenance window</h2>
            <p>
                On <strong>Saturday</strong> we are updating the database servers. Details on the
                <a href="#">status page</a>.
            </p>
            <ul>
                <li>Start: 10:00 PM</li>
                <li>Duration: about two hours</li>
            </ul>
            <blockquote>Write access is blocked during maintenance.</blockquote>
            <p>Check the status with <code>wirecore status</code>.</p>
        </div>`,
};

/** Children below each other with an even gap (`wc-stack-xs` … `-xl`, alignment `-start`/`-center`/`-end`) */
export const Stack: Story = {
    render: () =>
        html` <ul class="wc-stack wc-stack-xs" style="font-size:14px;line-height:20px">
            <li>Software &amp; Web</li>
            <li>Hosting</li>
            <li>Cloud &amp; DevOps</li>
        </ul>`,
};

/** Side by side, wrapping: `wc-group-between` and `wc-group-grow` (equal widths) */
export const Group: Story = {
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:16px;max-width:28rem">
            <div class="wc-group wc-group-between">
                <button type="button" class="wc-button wc-button-outline">Back</button>
                <button type="button" class="wc-button">Next</button>
            </div>
            <div class="wc-group wc-group-sm wc-group-grow">
                <button type="button" class="wc-button wc-button-outline">Cancel</button>
                <button type="button" class="wc-button">Save</button>
            </div>
        </div>`,
};

/** Columns per breakpoint via --wc-cols, --wc-cols-sm … (or `wc-simple-grid-auto-fit` with --wc-min-col) */
export const SimpleGrid: Story = {
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:24px">
            <div class="wc-simple-grid" style="--wc-cols:1;--wc-cols-sm:2;--wc-cols-lg:3">
                ${['Hosting', 'Cloud', 'Software', 'AI', 'Security', 'Support']
                    .map((card) => `<div class="wc-card">${card}</div>`)
                    .join('')}
            </div>
            <div class="wc-simple-grid wc-simple-grid-auto-fit wc-simple-grid-sm" style="--wc-min-col:10rem">
                ${['Frankfurt', 'Nuremberg', 'Hamburg', 'Leipzig'].map((card) => `<div class="wc-card">${card}</div>`).join('')}
            </div>
        </div>`,
};

/** Centered with a maximum width (`wc-container-sm` … `-xl`, `-full`) and side padding */
export const Container: Story = {
    render: () =>
        html` <div class="wc-container wc-container-md" style="background:var(--color-bg-2);padding-block:24px">
            <h2 style="font-size:18px;font-weight:600">One team for the entire stack</h2>
            <p style="margin-top:8px;font-size:14px;color:var(--color-muted)">
                Software, AI, hosting and cloud from a single source.
            </p>
        </div>`,
};

/** Centered content; aspect ratio via --wc-ratio (images and videos inside fill it) */
export const CenterAndAspectRatio: Story = {
    name: 'Center and AspectRatio',
    render: () =>
        html` <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:28rem">
            <div class="wc-aspect-ratio" style="--wc-ratio:1;border-radius:12px;background:var(--color-bg-2)">
                <div class="wc-center" style="height:100%;font-size:14px">1 : 1</div>
            </div>
            <div class="wc-aspect-ratio" style="--wc-ratio:4/3;border-radius:12px;background:var(--color-bg-2)">
                <div class="wc-center" style="height:100%;font-size:14px">4 : 3</div>
            </div>
        </div>`,
};

/** Sticky heading and action bar in a scrolling box; `wc-affix` fixes an element in a corner of the window */
export const Sticky: Story = {
    render: () =>
        html` <div
                style="height:16rem;max-width:28rem;overflow-y:auto;border:1px solid var(--color-line);border-radius:12px"
            >
                <div class="wc-sticky" style="padding:12px 16px;background:var(--color-card);font-weight:600">
                    Customer details
                </div>
                <p style="padding:16px;font-size:14px;height:24rem">Long form …</p>
                <div class="wc-sticky wc-sticky-bottom wc-sticky-bar">
                    <button type="button" class="wc-button wc-button-outline">Cancel</button>
                    <button type="button" class="wc-button">Save</button>
                </div>
            </div>
            <div class="wc-affix wc-affix-bottom-end">
                <button type="button" class="wc-button">Help</button>
            </div>`,
};

/**
 * Animated height: toggle data-state="open"/"closed" (and aria-expanded on the button) with a line of script; closed
 * content is invisible and out of the tab order
 */
export const Collapse: Story = {
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:12px;max-width:28rem">
            <button
                type="button"
                class="wc-button wc-button-outline"
                aria-expanded="true"
                aria-controls="collapse-details"
                onclick="const c=document.getElementById('collapse-details');const open=c.dataset.state!=='open';c.dataset.state=open?'open':'closed';this.setAttribute('aria-expanded',open)"
            >
                Details
            </button>
            <div id="collapse-details" class="wc-collapse" data-state="open">
                <div class="wc-collapse-inner">
                    <p style="padding:16px;border:1px solid var(--color-line);border-radius:8px;font-size:14px">
                        24-month term, renewing for 12 months at a time.
                    </p>
                </div>
            </div>
        </div>`,
};

/** A focusable row that scrolls sideways; data-more-start/-end fade the edges (the arrows need JavaScript) */
export const Scroller: Story = {
    render: () =>
        html` <div class="wc-scroller" style="max-width:28rem">
            <div class="wc-scroller-viewport" role="region" aria-label="Topics" tabindex="0" data-more-end="">
                ${[
                    'Hosting',
                    'Cloud & DevOps',
                    'Software & Web',
                    'AI integration',
                    'Security',
                    'Databases',
                    'Monitoring',
                    'Backups',
                ]
                    .map(
                        (topic) =>
                            `<button type="button" class="wc-button wc-button-outline wc-button-sm">${topic}</button>`
                    )
                    .join('')}
            </div>
        </div>`,
};

/** Cards in CSS columns (--wc-cols …); the reading order stays the order of the cards */
export const Masonry: Story = {
    render: () =>
        html` <div class="wc-masonry" style="--wc-cols:1;--wc-cols-sm:2;--wc-cols-lg:3">
            ${[
                ['Hosting', 'Data centers in Frankfurt and Nuremberg, ISO 27001.'],
                ['Cloud', 'Kubernetes, CI/CD and monitoring – supported around the clock, with dedicated contacts.'],
                ['Software', 'Portals and line-of-business applications.'],
                ['AI', 'Assistants, search across your own documents and automation of routine tasks.'],
                ['Security', 'Penetration tests and training.'],
            ]
                .map(
                    ([title, text]) =>
                        `<div class="wc-card"><h3 style="font-size:14px;font-weight:600">${title}</h3><p style="margin-top:4px;font-size:14px;color:var(--color-muted)">${text}</p></div>`
                )
                .join('')}
        </div>`,
};

/** Title (heading) with subtitle, actions that wrap below on narrow screens, a line below */
export const PageHeader: Story = {
    parameters: { layout: 'padded' },
    render: () =>
        html` <div class="wc-page-header wc-page-header-divided">
            <div class="wc-page-header-row">
                <div class="wc-page-header-heading">
                    <div class="wc-page-header-title-row">
                        <h1 class="wc-page-header-title">Invoices</h1>
                    </div>
                    <p class="wc-page-header-subtitle">All invoices from the last 24 months</p>
                </div>
                <div class="wc-page-header-actions">
                    <button type="button" class="wc-button wc-button-sm">Create invoice</button>
                </div>
            </div>
        </div>`,
};

const escape = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const VOID = new Set(['br', 'hr', 'input']);
/** HTML of the Markdown renderer's elements (as a server template would write them) */
const toHtml = (node: MarkdownElement | string): string => {
    if (typeof node === 'string') return escape(node);
    const attrs = Object.entries(node.attrs)
        .filter(([, value]) => value !== false)
        .map(([name, value]) => (value === true ? ` ${name}` : ` ${name}="${escape(String(value))}"`))
        .join('');
    return VOID.has(node.tag)
        ? `<${node.tag}${attrs}>`
        : `<${node.tag}${attrs}>${node.children.map(toHtml).join('')}</${node.tag}>`;
};
const markdown = markdownElements(
    [
        '# Release 2.4',
        'Faster **exports** and *new filters* – details in the [manual](https://wirecore.de).',
        '- [x] Migration done\n- [ ] Complete the docs',
        '| Area | Status | Effort |\n| :--- | :---: | ---: |\n| Export | done | 3 days |',
        '```bash\ndocker compose up -d\n```',
    ].join('\n\n')
)
    .map(toHtml)
    .join('');

/** Output of the Markdown renderer (markdownElements from @wirecore/wirelayer-recipes) in wc-prose: tables, task lists, code */
export const Markdown: Story = {
    render: () => html` <div class="wc-prose" style="max-width:36rem">${markdown}</div>`,
};
