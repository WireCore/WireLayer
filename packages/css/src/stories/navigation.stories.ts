import type { Meta, StoryObj } from '@storybook/html-vite';
import { ChevronRight } from 'lucide-static';
import { html, icons } from './icons.ts';

export default { title: 'Navigation' } satisfies Meta;
type Story = StoryObj;

const separator = ChevronRight.replace(/class="[^"]*"/, 'class="wc-breadcrumb-separator" aria-hidden="true"');

export const Breadcrumb: Story = {
    render: () =>
        html` <nav aria-label="Path">
            <ol class="wc-breadcrumb-list">
                <li class="wc-breadcrumb-item">
                    ${separator}<a class="wc-breadcrumb-link" href="#"
                        >${icons.house('wc-breadcrumb-icon')}<span class="wc-breadcrumb-hidden-label">Home</span></a
                    >
                </li>
                <li class="wc-breadcrumb-item">${separator}<a class="wc-breadcrumb-link" href="#">Services</a></li>
                <li class="wc-breadcrumb-item">
                    ${separator}<span class="wc-breadcrumb-text wc-breadcrumb-current" aria-current="page"
                        >Hosting</span
                    >
                </li>
            </ol>
        </nav>`,
};

/** An ordered list; the status of every step is read along (visually hidden) */
export const Steps: Story = {
    render: () =>
        html` <ol class="wc-steps" aria-label="Project flow" style="width:480px">
            <li class="wc-steps-item wc-steps-done">
                <span class="wc-steps-indicator" aria-hidden="true">${icons.check('wc-steps-icon')}</span>
                <span class="wc-steps-label">Understand</span><span class="wc-steps-status">, completed</span>
            </li>
            <li class="wc-steps-item wc-steps-active" aria-current="step">
                <span class="wc-steps-indicator" aria-hidden="true"><span class="wc-steps-number">2</span></span>
                <span class="wc-steps-label">Build</span><span class="wc-steps-status">, current step</span>
            </li>
            <li class="wc-steps-item wc-steps-todo">
                <span class="wc-steps-indicator" aria-hidden="true"><span class="wc-steps-number">3</span></span>
                <span class="wc-steps-label">Operate</span><span class="wc-steps-status">, to do</span>
            </li>
        </ol>`,
};

const tocLink = (id: string, label: string, depth = 1) =>
    html` <li><a class="wc-table-of-contents-link" href="#${id}" style="--depth:${depth}">${label}</a></li>`;

/** Links to the headings of the page; with JavaScript the components also mark the section in view */
export const TableOfContents: Story = {
    render: () =>
        html` <nav class="wc-table-of-contents" aria-label="On this page" style="width:14rem">
            <span class="wc-table-of-contents-title">On this page</span>
            <ul class="wc-table-of-contents-list">
                ${tocLink('services', 'Services')} ${tocLink('term', 'Term', 2)}
                ${tocLink('termination', 'Termination', 2)} ${tocLink('data-protection', 'Data protection')}
                ${tocLink('liability', 'Liability')}
            </ul>
        </nav>`,
};

const bottomLink = (label: string, icon: string, current = false, badge = '') =>
    html` <li class="wc-bottom-navigation-item">
        <a class="wc-bottom-navigation-link" href="#" ${current ? ' aria-current="page"' : ''}
            ><span class="wc-bottom-navigation-icon-box"
                >${icon}${badge ? `<span class="wc-bottom-navigation-badge">${badge}</span>` : ''}</span
            ><span class="wc-bottom-navigation-label">${label}</span></a
        >
    </li>`;

/** Bar of 3–5 destinations (fixed at the bottom without `-inline`, above the home indicator) */
export const BottomNavigation: Story = {
    render: () =>
        html` <div style="max-width:24rem;border:1px solid var(--color-line)">
            <nav class="wc-bottom-navigation wc-bottom-navigation-inline" aria-label="Navigation">
                <ul class="wc-bottom-navigation-list">
                    ${bottomLink('Home', icons.house('wc-bottom-navigation-icon'), true)}
                    ${bottomLink('Search', icons.search('wc-bottom-navigation-icon'))}
                    ${bottomLink('Messages', icons.messageSquare('wc-bottom-navigation-icon'), false, '3')}
                </ul>
            </nav>
        </div>`,
};

const megaLink = (label: string, description: string, icon: string) =>
    html` <li>
        <a class="wc-mega-menu-panel-link" href="#"
            >${icon}<span class="wc-mega-menu-panel-text"
                ><span class="wc-mega-menu-panel-label">${label}</span
                ><span class="wc-mega-menu-panel-description">${description}</span></span
            ></a
        >
    </li>`;

/**
 * Without JavaScript: every panel is a <details> (the shared name keeps one open at a time); the components add
 * hover, Escape, closing on outside clicks and the drawer on small screens
 */
export const MegaMenu: Story = {
    render: () =>
        html` <div style="min-height:24rem">
            <nav class="wc-mega-menu wc-mega-menu-never" aria-label="Main navigation">
                <ul class="wc-mega-menu-list">
                    <li class="wc-mega-menu-item">
                        <details name="mega-menu">
                            <summary class="wc-mega-menu-trigger">
                                Services ${icons.chevronDown('wc-mega-menu-trigger-icon')}
                            </summary>
                            <div class="wc-mega-menu-content">
                                <div class="wc-mega-menu-body">
                                    <div class="wc-mega-menu-columns">
                                        <div class="wc-mega-menu-column">
                                            <div class="wc-mega-menu-group">
                                                <h3 id="mega-operations" class="wc-mega-menu-group-title">
                                                    Operations
                                                </h3>
                                                <ul class="wc-mega-menu-group-list" aria-labelledby="mega-operations">
                                                    ${megaLink('Hosting', 'Data centers in Frankfurt and Nuremberg', icons.server('wc-mega-menu-panel-icon'))}
                                                    ${megaLink('Support', 'Available around the clock', icons.mail('wc-mega-menu-panel-icon'))}
                                                </ul>
                                                <a class="wc-mega-menu-more" href="#" aria-label="Show all: Operations"
                                                    >Show all ${icons.arrowRight('wc-mega-menu-more-icon')}</a
                                                >
                                            </div>
                                        </div>
                                    </div>
                                    <div class="wc-mega-menu-featured">
                                        <p class="wc-mega-menu-featured-eyebrow">Case study</p>
                                        <a class="wc-mega-menu-featured-title" href="#"
                                            >Customer portal for Northside Utilities</a
                                        >
                                        <p class="wc-mega-menu-featured-description">200,000 customers in one place.</p>
                                    </div>
                                </div>
                            </div>
                        </details>
                    </li>
                    <li class="wc-mega-menu-item"><a class="wc-mega-menu-link" href="#">References</a></li>
                    <li class="wc-mega-menu-item">
                        <a class="wc-mega-menu-link" href="#" aria-current="page">Contact</a>
                    </li>
                </ul>
            </nav>
        </div>`,
};
