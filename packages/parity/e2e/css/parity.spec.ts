import { expect, test, type Locator, type Page } from '@playwright/test';

// The .wc-* classes of @wirecore/wirelayer-css must look like the components: the same elements in the HTML Storybook
// and the React Storybook get the same computed styles (light and dark, one colored theme).

const properties = [
    'display',
    'align-items',
    'gap',
    'height',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'border-top-width',
    'border-top-color',
    'border-bottom-color',
    'border-top-left-radius',
    'background-color',
    'color',
    'font-family',
    'font-size',
    'font-weight',
    'letter-spacing',
    'text-transform',
    'opacity',
];

type Find = (page: Page) => Locator;
interface Case {
    name: string;
    react: string;
    html: string;
    elements: Find[];
}

const byRole =
    (role: Parameters<Page['getByRole']>[0], name: string | RegExp): Find =>
    (page) =>
        page.locator('#storybook-root').getByRole(role, { name, exact: typeof name === 'string' });
const byText =
    (text: string): Find =>
    (page) =>
        page.locator('#storybook-root').getByText(text, { exact: true });
const byLabel =
    (label: string): Find =>
    (page) =>
        page.locator('#storybook-root').getByLabel(label, { exact: true });
const nthByRole =
    (role: Parameters<Page['getByRole']>[0], name: string, index: number): Find =>
    (page) =>
        page.locator('#storybook-root').getByRole(role, { name, exact: true }).nth(index);
const parentOf =
    (find: Find): Find =>
    (page) =>
        find(page).locator('xpath=..');

const cases: Case[] = [
    {
        name: 'Button',
        react: 'buttons-button--variants',
        html: 'buttons-button--variants',
        elements: [
            'Start project',
            'Secondary',
            'Save',
            'Info',
            'Warning',
            'Delete',
            'View services',
            'Tinted',
            'Text',
        ].map((name) => byRole('button', name)),
    },
    {
        name: 'Button sizes',
        react: 'buttons-button--sizes',
        html: 'buttons-button--sizes',
        elements: ['Extra small', 'Small', 'Default', 'Large'].map((name) => byRole('button', name)),
    },
    {
        name: 'Button colors × styles',
        react: 'buttons-button--colors-and-styles',
        html: 'buttons-button--colors-and-styles',
        // One row per style (filled, outline, soft, text, link), one button per color
        elements: ['Primary', 'Secondary', 'Success', 'Info', 'Warning', 'Danger', 'Contrast'].flatMap((name) =>
            [0, 1, 2, 3, 4].map((row) => nthByRole('button', name, row))
        ),
    },
    {
        name: 'Button shapes and block',
        react: 'buttons-button--shapes',
        html: 'buttons-button--shapes',
        elements: ['Pill', 'Rounded', 'Square'].map((name) => byRole('button', name)),
    },
    {
        name: 'Button badges',
        react: 'buttons-button--badges',
        html: 'buttons-button--badges',
        elements: [byRole('button', 'Notifications 4 new'), byRole('button', 'Inbox new'), byText('4')],
    },
    {
        name: 'ButtonGroup',
        react: 'buttons-buttongroup--playground',
        html: 'buttons-buttongroup--playground',
        elements: [byRole('group', 'View'), ...['Day', 'Week', 'Month'].map((name) => byRole('button', name))],
    },
    {
        name: 'IconButton',
        react: 'buttons-iconbutton--badges',
        html: 'buttons-iconbutton--badges',
        elements: [byRole('button', 'Notifications, 4 new'), byRole('button', 'Inbox, new'), byText('4')],
    },
    {
        name: 'Badge',
        react: 'data-badge--overview',
        html: 'data--badges',
        elements: ['NEW', 'BETA', 'v2.4.1', 'Online', 'Maintenance', 'High load', 'Offline'].map(byText),
    },
    {
        name: 'Alert',
        react: 'feedback-alert--statuses',
        html: 'feedback--alerts',
        elements: ['Deployment succeeded', 'Maintenance window', 'High load', 'Build failed'].flatMap((title) => [
            byText(title),
            parentOf(parentOf(byText(title))),
        ]),
    },
    {
        name: 'Alert simple',
        react: 'feedback-alert--simple',
        html: 'feedback--alert-simple',
        elements: ['Please enter a valid email address.', 'Saved.', 'Last changed 5 minutes ago.'].flatMap((text) => [
            byText(text),
            parentOf(parentOf(byText(text))),
        ]),
    },
    {
        name: 'StatusDot icons',
        react: 'feedback-statusdot--icons',
        html: 'feedback--status-dot-icons',
        elements: ['ACTIVE', 'PLANNED', 'DELAYED', 'DISRUPTED'].map(byText),
    },
    {
        name: 'Badge circle',
        react: 'data-badge--circle',
        html: 'data--badge-circle',
        elements: ['4', '12', 'A'].map(byText),
    },
    {
        name: 'Avatar sizes',
        react: 'data-avatar--sizes',
        html: 'data--avatar-sizes',
        elements: [0, 1, 2, 3, 4].map((index) => nthByRole('img', 'Julia Klein', index)),
    },
    {
        name: 'Card with title',
        react: 'data-card--with-title',
        html: 'data--card-with-title',
        elements: [
            byRole('heading', 'Managed Hosting'),
            parentOf(byRole('heading', 'Managed Hosting')),
            parentOf(parentOf(byRole('heading', 'Managed Hosting'))),
            byText('Data centers in Frankfurt'),
            byRole('button', 'Inquire'),
            parentOf(byRole('button', 'Inquire')),
            (page) => page.locator('#storybook-root img').first().locator('xpath=..'),
        ],
    },
    {
        name: 'Chip',
        react: 'data-chip--overview',
        html: 'data--chip',
        elements: [
            ...['Frankfurt', 'Julia Klein', 'Hosting', 'Locked', 'Large'].flatMap((label) => [
                byText(label),
                parentOf(byText(label)),
            ]),
            byRole('button', 'Remove Julia Klein'),
            byRole('button', 'Remove Hosting'),
            byRole('button', 'Remove Locked'),
            byRole('button', 'Remove Large'),
        ],
    },
    {
        name: 'Timeline alternate',
        react: 'data-timeline--alternate',
        html: 'data--timeline-alternate',
        elements: [
            ...['Planning', 'Implementation', 'Pilot'].flatMap((title) => [
                byText(title),
                parentOf(byText(title)),
                parentOf(parentOf(byText(title))),
            ]),
            byText('Completed'),
            byText('In progress'),
        ],
    },
    {
        name: 'StatusDot',
        react: 'feedback-statusdot--overview',
        html: 'feedback--status-dot',
        elements: ['ONLINE', 'MAINTENANCE', 'HIGH LOAD', 'OFFLINE', 'PAUSED'].map(byText),
    },
    {
        name: 'Progress',
        react: 'feedback-progress--playground',
        html: 'feedback--progress',
        elements: [byRole('progressbar', 'BUILD'), byText('68 %')],
    },
    {
        name: 'Field',
        react: 'forms-field--text-fields',
        html: 'forms-field--text-fields',
        elements: ['Name', 'Email', 'Search', 'Domain', 'Company (disabled)', 'Your message'].flatMap((label) => [
            byLabel(label),
            parentOf(byLabel(label)),
            byText(label),
        ]),
    },
    {
        name: 'Divider',
        react: 'layout-divider--overview',
        html: 'layout--divider',
        elements: [
            byText('or'),
            parentOf(byText('or')),
            ...[0, 1].map(
                (index): Find =>
                    (page) =>
                        page.locator('#storybook-root').getByRole('separator').nth(index)
            ),
        ],
    },
    {
        name: 'Divider variants',
        react: 'layout-divider--variants',
        html: 'layout--divider-variants',
        elements: [
            ...['Details', 'End', 'or'].flatMap((label) => [
                byText(label),
                parentOf(byText(label)),
                (page: Page) => parentOf(byText(label))(page).locator('span').first(),
                (page: Page) => parentOf(byText(label))(page).locator('span').last(),
            ]),
            (page) => page.locator('#storybook-root').getByRole('separator').first(),
        ],
    },
    {
        name: 'Steps',
        react: 'navigation-steps--playground',
        html: 'navigation--steps',
        elements: ['Understand', 'Build', 'Operate'].flatMap((label) => [byText(label), parentOf(byText(label))]),
    },
    {
        name: 'Timeline',
        react: 'data-timeline--playground',
        html: 'data--timeline',
        elements: ['Change submitted', 'Tests failed', 'Rolled out'].flatMap((title) => [
            byText(title),
            parentOf(byText(title)),
        ]),
    },
    {
        name: 'OrgChart',
        react: 'data-orgchart--playground',
        html: 'data--org-chart',
        elements: ['Florian Laabs', 'Sara Wolf', 'Sales'].flatMap((text) => [byText(text), parentOf(byText(text))]),
    },
    {
        name: 'MeterGroup',
        react: 'data-metergroup--playground',
        html: 'data--meter-group',
        elements: [byText('Storage (1 TB)'), byText('42 %'), parentOf(byText('42 %'))],
    },
    { name: 'Kbd', react: 'data-kbd--playground', html: 'data--kbd', elements: [byText('Ctrl'), byText('K')] },
    {
        name: 'EmptyState',
        react: 'feedback-emptystate--playground',
        html: 'feedback--empty-state',
        elements: [
            byText('No servers yet'),
            byText('Create your first server – it will be ready in two minutes.'),
            parentOf(byText('No servers yet')),
        ],
    },
    {
        name: 'DataList',
        react: 'data-datalist--divided',
        html: 'data--data-list',
        elements: [byText('Server'), byText('web-01'), parentOf(byText('web-01'))],
    },
    {
        name: 'Heatmap',
        react: 'data-heatmap--playground',
        html: 'data--heatmap',
        elements: [
            byText('Less'),
            (page) => page.locator('#storybook-root td[data-level="4"]').first(),
            (page) => page.locator('#storybook-root [data-level="2"]').last(),
        ],
    },
    {
        // The meter itself is laid out by its surroundings (inline-flex, in the React story a flex item)
        name: 'Gauge',
        react: 'data-gauge--playground',
        html: 'data--gauge',
        elements: [(page) => page.locator('#storybook-root [role=meter] > span').first()],
    },
    {
        name: 'OverlayBadge',
        react: 'data-overlaybadge--playground',
        html: 'buttons-iconbutton--overlay-badge',
        elements: [byText('3'), byText('99+')],
    },
    {
        name: 'ProgressCircle',
        react: 'feedback-progresscircle--playground',
        html: 'feedback--progress-circle',
        elements: [byRole('progressbar', 'Storage used'), byText('72 %'), byText('Storage used')],
    },
    {
        name: 'Fieldset',
        react: 'forms-fieldset--playground',
        html: 'forms-groups--fieldset',
        elements: [
            byRole('group', 'Billing address'),
            byText('Billing address'),
            byText('As it appears on the invoice'),
            byLabel('ZIP code'),
        ],
    },
    {
        name: 'InputGroup',
        react: 'forms-inputgroup--playground',
        html: 'forms-groups--input-group',
        elements: [
            byText('https://'),
            byText('.com'),
            byText('€ / month'),
            byRole('button', 'Search'),
            parentOf(byLabel('Domain')),
            parentOf(byLabel('Budget')),
        ],
    },
    {
        name: 'NativeSelect',
        react: 'forms-nativeselect--playground',
        html: 'forms-groups--native-select',
        elements: [byLabel('Location'), parentOf(byLabel('Location'))],
    },
    {
        name: 'Panel',
        react: 'layout-panel--playground',
        html: 'layout--panel',
        elements: [
            byRole('heading', 'Contract details'),
            parentOf(byRole('heading', 'Contract details')),
            byRole('button', 'Download contract'),
            byText("24-month term, renewing for 12 months at a time, three months' notice to cancel."),
        ],
    },
    {
        name: 'Pagination links',
        react: 'data-pagination--links',
        html: 'data--pagination',
        elements: [
            byText('1–10 of 60'),
            byRole('link', 'Page 1 of 6'),
            byRole('link', 'Page 2 of 6'),
            byRole('link', 'Next page'),
        ],
    },
    {
        name: 'Pagination compact',
        react: 'data-pagination--compact',
        html: 'data--pagination-compact',
        elements: [byText('Page 2 of 5'), byText('11–20 of 50')],
    },
    {
        name: 'SaveStatus',
        react: 'feedback-savestatus--states',
        html: 'feedback--save-status',
        elements: [byText('Saving …'), byText('Saved'), byText('Saving failed')],
    },
    {
        name: 'TableOfContents',
        react: 'navigation-tableofcontents--playground',
        html: 'navigation--table-of-contents',
        // The components mark the sections in view (aria-current) – compare links further down
        elements: [
            byRole('link', 'Data protection'),
            byRole('link', 'Liability'),
            parentOf(parentOf(byRole('link', 'Liability'))),
        ],
    },
    {
        name: 'Stack',
        react: 'layout-stack--as-list',
        html: 'layout--stack',
        elements: [byText('Hosting'), parentOf(byText('Hosting'))],
    },
    {
        name: 'Group',
        react: 'layout-group--distribution',
        html: 'layout--group',
        elements: [
            ...['Back', 'Next', 'Cancel', 'Save'].map((name) => byRole('button', name)),
            parentOf(byRole('button', 'Back')),
            parentOf(byRole('button', 'Cancel')),
        ],
    },
    {
        name: 'PageHeader',
        react: 'layout-pageheader--simple',
        html: 'layout--page-header',
        elements: [
            byRole('heading', 'Invoices'),
            byText('All invoices from the last 24 months'),
            byRole('button', 'Create invoice'),
            parentOf(parentOf(parentOf(parentOf(byRole('heading', 'Invoices'))))),
        ],
    },
    {
        name: 'Banner',
        react: 'feedback-banner--variants',
        html: 'feedback--banners',
        elements: [
            'New features in the customer portal – available to everyone today.',
            'Limited availability Saturday 10–11 PM.',
            'Payment processing is down. We are working on it.',
            'Trial ends in 5 days.',
        ].flatMap((text) => [byText(text), parentOf(parentOf(byText(text)))]),
    },
    {
        name: 'Result',
        react: 'feedback-result--success',
        html: 'feedback--result',
        elements: [
            byRole('heading', 'Order placed'),
            byText('You will receive a confirmation email in a few minutes.'),
            byRole('button', 'Go to overview'),
        ],
    },
    {
        name: 'Descriptions',
        react: 'data-descriptions--bordered',
        html: 'data--descriptions',
        elements: [
            byRole('heading', 'Contract'),
            byText('Customer'),
            byText('Northside Utilities Inc.'),
            parentOf(byText('Customer')),
            byText('Active'),
        ],
    },
    {
        name: 'BottomNavigation',
        react: 'navigation-bottomnavigation--inline',
        html: 'navigation--bottom-navigation',
        elements: [byRole('link', 'Home'), byRole('link', 'Search'), byText('3'), byText('Messages')],
    },
    {
        name: 'Statistic',
        react: 'data-statistic--playground',
        html: 'data--statistic',
        elements: [
            byText('Revenue'),
            byText('€48,250'),
            parentOf(byText('€48,250')),
            byText('+12%'),
            byText('vs. previous month'),
            parentOf(parentOf(byText('Revenue'))),
        ],
    },
    {
        name: 'Persona',
        react: 'data-persona--playground',
        html: 'data--persona',
        elements: [byText('Anna Berg'), byText('Project lead'), byText('Online'), parentOf(byText('Anna Berg'))],
    },
    {
        name: 'Truncate',
        react: 'data-truncate--playground',
        html: 'data--truncate',
        elements: [
            byText(
                'Migration of the customer portal to the new platform with single sign-on, multi-tenancy, archiving and a new reporting system for management'
            ),
        ],
    },
    {
        name: 'AiLabel',
        react: 'data-ailabel--playground',
        html: 'data--ai-label',
        elements: [byText('AI-generated'), parentOf(byText('AI-generated'))],
    },
    {
        name: 'CheckboxCard',
        react: 'forms-checkboxcard--playground',
        html: 'forms-groups--checkbox-cards',
        elements: [
            byText('Backup'),
            byText('Daily, kept for 30 days'),
            byText('€9 / month'),
            parentOf(parentOf(byText('Backup'))),
        ],
    },
    {
        name: 'FilterChips',
        react: 'forms-filterpanel--chips',
        html: 'forms-groups--filter-chips',
        elements: [
            byText('Location:'),
            parentOf(byText('Location:')),
            byRole('button', 'Remove filter Location: Frankfurt'),
            byRole('button', 'Reset all'),
        ],
    },
    {
        name: 'Progress segments',
        react: 'feedback-progress--segments',
        html: 'feedback--progress-segments',
        elements: [byRole('progressbar', 'Storage'), byText('42 %'), parentOf(byText('42 %')), byText('77 %')],
    },
    {
        name: 'Progress striped',
        react: 'feedback-progress--striped',
        html: 'feedback--progress-striped',
        elements: [byRole('progressbar', 'Upload'), byText('55 %')],
    },
    {
        name: 'RingProgress',
        react: 'feedback-ringprogress--segments',
        html: 'feedback--ring-progress',
        elements: [
            byRole('group', 'Storage (1 TB)'),
            byText('77%'),
            byText('Storage (1 TB)'),
            byText('42%'),
            parentOf(byText('42%')),
        ],
    },
    {
        name: 'Watermark',
        react: 'data-watermark--playground',
        html: 'data--watermark',
        // The layer is the only element hidden from screen readers
        elements: [byText('Quote 2026-118'), (page) => page.locator('#storybook-root [aria-hidden=true]').first()],
    },
    {
        name: 'BarsList',
        react: 'data-barslist--playground',
        html: 'data--bars-list',
        elements: [
            byRole('list', 'Most visited pages'),
            byRole('link', '/start'),
            parentOf(byText('/blog/release-2-4')),
            byText('5,120'),
            // The bar behind the third label
            (page) => page.locator('#storybook-root li').nth(2).locator('xpath=./span[1]'),
        ],
    },
    {
        name: 'Funnel',
        react: 'data-funnel--playground',
        html: 'data--funnel',
        elements: [
            byRole('img', 'Orders in October'),
            (page) => page.locator('#storybook-root').getByText('Product page', { exact: true }).first(),
            (page) => page.locator('#storybook-root').getByText('7,350', { exact: true }).first(),
            // A stage row and the conversion line above it
            (page) =>
                page.locator('#storybook-root').getByText('Product page', { exact: true }).first().locator('xpath=..'),
            (page) => page.locator('#storybook-root').getByText(/^28\.6% of the previous stage$/),
            byText('Data as table'),
        ],
    },
    {
        name: 'BulletChart',
        react: 'data-bulletchart--playground',
        html: 'data--bullet-chart',
        elements: [byRole('meter', 'Revenue'), byText('k€'), byText('Target: 250'), byText('270')],
    },
    {
        name: 'ChatMessage',
        react: 'data-chat--messages',
        html: 'data--chat-messages',
        elements: [
            byText('Anna Berg'),
            byText('Thanks, I will take a look.'),
            parentOf(byText('Thanks, I will take a look.')),
            byText('Read'),
            byText('Anna Berg left the chat'),
        ],
    },
    {
        name: 'Markdown',
        react: 'data-markdown--playground',
        html: 'layout--markdown',
        elements: [byRole('heading', 'Release 2.4'), byRole('link', 'manual'), byText('Area'), byText('Export')],
    },
];

async function styles(page: Page, url: string, elements: Find[]) {
    await page.goto(url);
    await page.locator('#storybook-root > *').first().waitFor();
    await page.waitForLoadState('networkidle');
    return Promise.all(
        elements.map((find) =>
            find(page).evaluate((element, props) => {
                const style = getComputedStyle(element);
                return Object.fromEntries(props.map((prop) => [prop, style.getPropertyValue(prop)]));
            }, properties)
        )
    );
}

for (const appearance of ['mode:light;theme:wirecore', 'mode:dark;theme:wirecore', 'mode:dark;theme:ocean']) {
    test.describe(appearance, () => {
        for (const { name, react, html, elements } of cases) {
            test(name, async ({ page }) => {
                const query = `viewMode=story&globals=${appearance}`;
                const expected = await styles(
                    page,
                    `${process.env.WIRECORE_REACT_URL}/iframe.html?id=${react}&${query}`,
                    elements
                );
                const actual = await styles(page, `/iframe.html?id=${html}&${query}`, elements);
                expect(actual).toEqual(expected);
            });
        }
    });
}
