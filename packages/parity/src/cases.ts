import { advancedFilterEditor, el, feature, icon, type El } from './harness.js';

// Every component in its variants and states – rendered by the parity, axe and SSR tests
const buttonVariants = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'outline', 'text', 'soft', 'link'];
// Colour × style combinations of Button/IconButton
const buttonColorStyles: [string, string][] = [
    ['danger', 'text'],
    ['secondary', 'outline'],
    ['success', 'soft'],
    ['contrast', 'primary'],
    ['info', 'link'],
    ['warn', 'outline'],
    ['primary', 'soft'],
];
const badgeVariants = ['solid', 'soft', 'outline', 'success', 'info', 'warn', 'danger'];
const statuses = ['success', 'info', 'warn', 'danger'];
const sizes = ['sm', 'md', 'lg'];

const selectItems = [
    { value: 'web', label: 'Software & Web', icon: icon('Check') },
    { value: 'hosting', label: 'Hosting', icon: icon('Mail') },
    { value: 'hardware', label: 'Hardware', disabled: true },
];
const tabsExample = (props: Record<string, unknown> = {}) =>
    el(
        'Tabs',
        { defaultValue: 'overview', label: 'Project', ...props },
        el(
            'TabsList',
            {},
            el('TabsTrigger', { value: 'overview', icon: icon('Check') }, 'Overview'),
            el('TabsTrigger', { value: 'services' }, 'Services'),
            el('TabsTrigger', { value: 'process', disabled: true }, 'Process')
        ),
        el('TabsContent', { value: 'overview' }, 'One team for the whole stack.'),
        el('TabsContent', { value: 'services' }, 'Software, AI, hosting.'),
        el('TabsContent', { value: 'process' }, 'Understand, build, run.')
    );

// The same component under LocaleProvider – English texts and formats, or right-to-left (he-IL, English texts)
const inLocale = (locale: string, node: El) => el('LocaleProvider', { locale }, node);

// Scheduler with people as resources, business hours; Gantt with a group, dependencies and a milestone
const schedulerResources = [
    { id: 'anna', label: 'Anna Berg', tone: 'info', group: 'Team North' },
    { id: 'ben', label: 'Ben Ott', group: 'Team North' },
    { id: 'room', label: 'Room Elbe', tone: 'success', group: 'Rooms' },
];
const schedulerEvents = [
    { id: 'a', title: 'Planning', start: '2027-03-16T09:00', end: '2027-03-16T10:30', resourceId: 'anna' },
    { id: 'b', title: 'Review', start: '2027-03-16T10:00', end: '2027-03-16T11:00', resourceId: 'ben', tone: 'warn' },
    { id: 'c', title: 'Workshop', start: '2027-03-17T13:00', end: '2027-03-17T15:00', resourceId: 'room' },
    { id: 'd', title: 'Trade fair', start: '2027-03-18', end: '2027-03-19', allDay: true, resourceId: 'anna' },
];
const businessHours = [{ days: [1, 2, 3, 4, 5], start: '08:00', end: '17:00' }];
const ganttTasks = [
    { id: 'p', name: 'Concept', start: '2027-03-15', end: '2027-03-24' },
    { id: 'p1', name: 'Workshop', start: '2027-03-15', end: '2027-03-17', parentId: 'p', progress: 100 },
    {
        id: 'p2',
        name: 'Detailed concept',
        start: '2027-03-18',
        end: '2027-03-24',
        parentId: 'p',
        progress: 40,
        dependencies: ['p1'],
    },
    { id: 'd', name: 'Design', start: '2027-03-22', end: '2027-04-02', dependencies: ['p1'], tone: 'info' },
    { id: 'm', name: 'Acceptance', start: '2027-04-05', end: '2027-04-05', milestone: true, dependencies: ['p2', 'd'] },
];

const menuItems = [
    { value: 'edit', label: 'Edit', icon: icon('Check'), shortcut: '⌘E' },
    { value: 'delete', label: 'Delete', danger: true },
];

// Every kind of menu entry: link, checkbox item, radio group, group, separator, submenu
const menuItemTypes = [
    { value: 'docs', label: 'Documentation', href: '/docs', icon: icon('ArrowRight') },
    { type: 'checkbox', value: 'grid', label: 'Show grid', checked: true },
    {
        type: 'radio',
        name: 'sort',
        label: 'Sorting',
        value: 'name',
        items: [
            { value: 'name', label: 'Name' },
            { value: 'load', label: 'Load' },
        ],
    },
    { type: 'separator' },
    { value: 'more', label: 'More', children: menuItems },
];

const servers = [
    { id: 'web-01', name: 'web-01', location: 'Frankfurt', load: 42 },
    { id: 'db-primary', name: 'db-primary', location: 'Frankfurt', load: 71 },
    { id: 'k8s-node-3', name: 'k8s-node-3', location: 'Nuremberg', load: 18 },
];
const serverColumns = [
    { id: 'name', header: 'Name', sortable: true },
    { id: 'location', header: 'Location' },
    { id: 'load', header: 'Load', sortable: true, align: 'end' },
];
const getRowId = (row: { id: string }) => row.id;
// Typed columns for the DataTable features: numbers, dates, yes/no
const fleet = [
    { id: 'web-01', name: 'web-01', location: 'Frankfurt', load: 42, since: '2024-03-01', online: true },
    { id: 'db-primary', name: 'db-primary', location: 'Frankfurt', load: 71, since: '2023-11-15', online: true },
    { id: 'k8s-node-3', name: 'k8s-node-3', location: 'Nuremberg', load: 18, since: '2025-06-30', online: false },
];
const fleetColumns = [
    { id: 'name', header: 'Name', sortable: true, filter: 'text', copyable: true },
    { id: 'location', header: 'Location', filter: 'multiSelect', groupable: true },
    { id: 'load', header: 'Load', sortable: true, align: 'end', filter: 'number', aggregate: 'avg' },
    { id: 'since', header: 'In service since', filter: 'date', hideBelow: 'md' },
    {
        id: 'online',
        header: 'Online',
        filter: 'boolean',
        format: (value: unknown) => (value ? 'Yes' : 'No'),
    },
];
/** A data source that never answers: the components stay as they are before the first answer */
const pendingSource = {
    getItems: () => new Promise(() => undefined),
    getItemsByKeys: () => new Promise(() => undefined),
};
const fileTree = [
    {
        id: 'documents',
        label: 'Documents',
        icon: icon('House'),
        children: [
            { id: 'proposal', label: 'Proposal.pdf' },
            { id: 'archive', label: 'Archive', children: [{ id: 'report', label: 'Report.pdf' }] },
        ],
    },
    { id: 'notes', label: 'Notes.txt', disabled: true },
];
const locations = [
    {
        value: 'de',
        label: 'Germany',
        children: [
            { value: 'muc', label: 'Munich' },
            { value: 'fra', label: 'Frankfurt' },
        ],
    },
    { value: 'vie', label: 'Vienna', icon: icon('House') },
];
const pictures = [
    { src: '/reception.jpg', alt: 'Reception area', caption: 'Reception on the ground floor' },
    { src: '/office.jpg', alt: 'Open-plan office', thumbnail: '/office-small.jpg' },
    { src: '/terrace.jpg', alt: 'Roof terrace' },
];
const fileRows = [
    {
        id: 'projects',
        name: 'Projects',
        location: '–',
        load: 30,
        children: [{ id: 'wirecore', name: 'WireLayer', location: 'Frankfurt', load: 12 }],
    },
    { id: 'notes', name: 'Notes', location: 'Nuremberg', load: 1 },
];
const manyItems = Array.from({ length: 500 }, (_, index) => ({ value: `item-${index}`, label: `Item ${index}` }));
// Option lists: groups, objects as values, numbers as values
const groupedItems = [
    { value: 'web', label: 'Software & Web', group: 'Development' },
    { value: 'fra', label: 'Frankfurt', group: 'Data centers', description: 'Tier III' },
    { value: 'ai', label: 'AI & LLM', group: 'Development' },
    { value: 'nbg', label: 'Nuremberg', group: 'Data centers', disabled: true },
];
const people = [
    { id: 1, name: 'Anna Berg', team: 'Sales' },
    { id: 2, name: 'Jonas Weber', team: 'Engineering' },
];

// Mega menu with columns, groups, badges, descriptions, featured area, all links; a link with a chevron button
const megaItems = [
    {
        label: 'Services',
        columns: [
            {
                groups: [
                    {
                        title: 'Operations',
                        items: [
                            {
                                label: 'Hosting',
                                href: '/services/hosting',
                                description: 'In Frankfurt',
                                icon: icon('House'),
                            },
                            { label: 'Cloud', href: '/services/cloud', badge: 'New', badgeVariant: 'info' },
                        ],
                        moreHref: '/services/operations',
                    },
                ],
            },
            {
                groups: [
                    {
                        title: 'Development',
                        items: [{ label: 'Software', href: '/services/software', icon: icon('Mail') }],
                        moreHref: '/services/development',
                        moreLabel: 'To development',
                    },
                ],
            },
        ],
        featured: {
            title: 'Case study: municipal utility',
            href: '/references/utility',
            eyebrow: 'Reference',
            description: 'Portal for 200,000 customers',
            image: '/image.jpg',
        },
        allHref: '/services',
    },
    {
        label: 'Products',
        href: '/products',
        columns: [{ groups: [{ title: 'Software', items: [{ label: 'WireLayer', href: '/products/wirecore' }] }] }],
    },
    { label: 'Contact', href: '/contact' },
];

const descriptionItems = [
    { id: 'customer', label: 'Customer', value: 'North Utilities' },
    { id: 'term', label: 'Term', value: '24 months', span: 2 },
    { id: 'note', label: 'Note', value: 'Renews for 12 months at a time', span: 'full' },
];

const notificationNow = '2026-10-21T12:00:00';
const notifications = [
    {
        id: 'n1',
        title: 'Backup complete',
        description: 'web-01, 2.3 GB',
        date: '2026-10-21T09:30:00',
        href: '/backups',
    },
    { id: 'n2', title: 'Invoice ready', date: '2026-10-20T16:00:00', read: true, icon: icon('Mail') },
    { id: 'n3', title: 'Certificate expiring', date: '2026-10-02T08:00:00' },
];

const sidebarItems = [
    { label: 'Start', href: '/', icon: icon('House'), current: true },
    { label: 'Messages', href: '/messages', icon: icon('Mail'), badge: 3 },
    {
        label: 'Settings',
        icon: icon('Ellipsis'),
        children: [{ label: 'Account', href: '/account', badge: 'new' }],
    },
];

// Display, accessibility building blocks and form patterns
const longText = 'Migration of the customer portal to the new platform with single sign-on, multi-tenancy and archive';
const techItems = ['Vue', 'React', 'Nuxt', 'Next', 'Tailwind'];
const badgeItem = {
    item: {
        react: 'renderItem',
        args: (item: string, index: number) => ({ item, index }),
        render: ({ item }: { item: string }) => el('Badge', {}, item),
    },
};
const activeFilters = [
    { id: 'location', label: 'Location', value: 'Frankfurt' },
    { id: 'load', label: 'Load', value: 'over 50%' },
];
const conditionFields = [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'load', label: 'Load', type: 'number' },
    { id: 'since', label: 'In service since', type: 'date' },
    {
        id: 'location',
        label: 'Location',
        type: 'select',
        options: [
            { value: 'Frankfurt', label: 'Frankfurt' },
            { value: 'Nuremberg', label: 'Nuremberg' },
        ],
    },
    { id: 'online', label: 'Online', type: 'boolean' },
];
const conditionTree = {
    type: 'group',
    id: 'root',
    combinator: 'and',
    children: [
        { type: 'rule', id: 'r1', field: 'name', operator: 'contains', value: 'web' },
        { type: 'rule', id: 'r2', field: 'load', operator: 'between', value: [10, 80] },
        {
            type: 'group',
            id: 'g1',
            combinator: 'or',
            children: [
                { type: 'rule', id: 'r3', field: 'location', operator: 'in', value: ['Frankfurt'] },
                { type: 'rule', id: 'r4', field: 'online', operator: 'equals', value: true },
                { type: 'rule', id: 'r5', field: 'since', operator: 'empty' },
            ],
        },
    ],
};

// Building blocks and special inputs
const swatchItems = [
    { value: '#1e66f5', label: 'Blue' },
    { value: '#16a34a', label: 'Green' },
    { value: '#dc2626', label: 'Red', disabled: true },
];
const mentionPeople = [
    { value: 'anna', label: 'Anna Berg', description: 'Project lead' },
    { value: 'ben', label: 'Ben Ott' },
];
const jsonSample = { name: 'web-01', load: 42, online: true, tags: ['prod', 'eu'], owner: null };
const logLines = [
    { id: 1, text: 'Server started', level: 'info', time: '2026-10-21T08:00:00Z' },
    { id: 2, text: 'Response time high', level: 'warn' },
    'ERROR Connection lost',
    'No level',
];
const sortableItems = [
    { id: 'p', label: 'Planning' },
    { id: 'u', label: 'Implementation' },
    { id: 't', label: 'Test' },
];

export const cases: [string, El][] = [
    ...buttonVariants.map((variant): [string, El] => [
        `Button ${variant}`,
        el('Button', { variant }, 'Start a project'),
    ]),
    ...sizes.map((size): [string, El] => [`Button ${size}`, el('Button', { size }, 'Size')]),
    ['Button text sm', el('Button', { variant: 'text', size: 'sm' }, 'Text')],
    ['Button loading', el('Button', { loading: true }, 'Sending')],
    ['Button disabled', el('Button', { disabled: true }, 'Disabled')],
    ['Button submit', el('Button', { type: 'submit' }, 'Send')],
    ['Button icons', el('Button', { leadingIcon: icon('Check'), trailingIcon: icon('ArrowRight') }, 'Save')],
    ['Button asChild', el('Button', { asChild: true, variant: 'link' }, el('a', { href: '/services' }, 'Link'))],
    ['Button custom class', el('Button', { class: 'px-8 w-full' }, 'Wide')],
    ...buttonColorStyles.map(([color, variant]): [string, El] => [
        `Button ${color} ${variant}`,
        el('Button', { color, variant }, 'Start a project'),
    ]),
    ['Button color only', el('Button', { color: 'danger' }, 'Delete')],
    ['Button xs', el('Button', { size: 'xs', leadingIcon: icon('Plus') }, 'New')],
    ['Button shape rounded', el('Button', { shape: 'rounded', variant: 'outline' }, 'Rounded')],
    ['Button shape square xs', el('Button', { shape: 'square', size: 'xs' }, 'Square')],
    ['Button block', el('Button', { block: true }, 'Full width')],
    ['Button badge count', el('Button', { badge: 4, variant: 'outline' }, 'Alerts')],
    [
        'Button badge 99+, own label',
        el('Button', { badge: 120, badgeLabel: (count: string) => `${count} new` }, 'Inbox'),
    ],
    ['Button badge dot', el('Button', { badge: true, variant: 'text' }, 'Mailbox')],
    [
        'ButtonGroup',
        el(
            'ButtonGroup',
            { label: 'View' },
            el('Button', { variant: 'outline' }, 'Day'),
            el('Button', { variant: 'outline' }, 'Week'),
            el('Button', { variant: 'outline' }, 'Month')
        ),
    ],
    [
        'ButtonGroup vertical block',
        el(
            'ButtonGroup',
            { label: 'Alignment', orientation: 'vertical', block: true },
            el('Button', { variant: 'soft', shape: 'rounded' }, 'Top'),
            el('IconButton', { icon: icon('Plus'), label: 'Middle', shape: 'rounded' })
        ),
    ],

    ['IconButton', el('IconButton', { icon: icon('Plus'), label: 'Add' })],
    ['IconButton primary sm', el('IconButton', { icon: icon('Plus'), label: 'Add', variant: 'primary', size: 'sm' })],
    ['IconButton disabled', el('IconButton', { icon: icon('Plus'), label: 'Add', disabled: true })],
    ['IconButton loading', el('IconButton', { icon: icon('Plus'), label: 'Add', loading: true })],
    ['IconButton badge count', el('IconButton', { icon: icon('Bell'), label: 'Alerts', badge: 4 })],
    ['IconButton badge 99+', el('IconButton', { icon: icon('Bell'), label: 'Alerts', badge: 120 })],
    ['IconButton badge dot', el('IconButton', { icon: icon('Mail'), label: 'Mailbox', badge: true })],
    ['IconButton badge 0', el('IconButton', { icon: icon('Bell'), label: 'Alerts', badge: 0 })],
    ...buttonColorStyles
        .filter(([, variant]) => variant !== 'link')
        .map(([color, variant]): [string, El] => [
            `IconButton ${color} ${variant}`,
            el('IconButton', { icon: icon('Plus'), label: 'Add', color, variant }),
        ]),
    ['IconButton xs square', el('IconButton', { icon: icon('Plus'), label: 'Add', size: 'xs', shape: 'square' })],
    ['IconButton warn', el('IconButton', { icon: icon('Bell'), label: 'Warning', variant: 'warn' })],
    [
        'IconButton filled icon',
        el('IconButton', { icon: icon('Bell'), label: 'Favourite', iconProps: { fill: 'currentColor' } }),
    ],

    ['Avatar initials', el('Avatar', { name: 'Julia Klein' })],
    ['Avatar solid lg', el('Avatar', { name: 'Julia Klein', variant: 'solid', size: 'lg' })],
    ['Avatar outline square', el('Avatar', { name: 'Max Schulz', variant: 'outline', shape: 'square' })],
    ['Avatar decorative', el('Avatar', { size: 'sm' })],
    ['Avatar image', el('Avatar', { name: 'Julia Klein', src: 'https://example.com/julia.png' })],
    ['Avatar xl, auto colour', el('Avatar', { name: 'Julia Klein', size: 'xl', color: 'auto' })],
    ['Avatar 2xl square, info', el('Avatar', { name: 'Max Schulz', size: '2xl', shape: 'square', color: 'info' })],
    ['Avatar auto colour without name', el('Avatar', { size: 'xl', color: 'auto' })],
    ['Avatar as button', el('Avatar', { name: 'Julia Klein', as: 'button', size: 'sm' })],
    ['Avatar as button, own label', el('Avatar', { name: 'Julia Klein', as: 'button', 'aria-label': 'Account' })],
    [
        'Menu with an Avatar trigger, arrow and placement',
        el(
            'Menu',
            { items: [{ value: 'logout', label: 'Sign out' }], placement: 'bottom-end', arrow: true },
            el('Avatar', { name: 'Julia Klein', as: 'button' })
        ),
    ],
    [
        'AvatarGroup',
        el(
            'AvatarGroup',
            { label: 'Project team', more: 5 },
            el('Avatar', { name: 'Julia Klein' }),
            el('Avatar', { name: 'Max Schulz', variant: 'solid' })
        ),
    ],
    ['AvatarGroup md 99+', el('AvatarGroup', { size: 'md', more: 120 }, el('Avatar', { name: 'Julia Klein' }))],

    ['Checkbox', el('Checkbox', {}, 'I agree')],
    ['Checkbox checked required', el('Checkbox', { defaultChecked: true, required: true, name: 'consent' }, 'Terms')],
    ['Checkbox indeterminate', el('Checkbox', { checked: 'indeterminate' }, 'Select all')],
    ['Checkbox disabled invalid', el('Checkbox', { disabled: true, invalid: true }, 'Locked')],

    ['Switch', el('Switch', {}, 'Weekly report')],
    [
        'Switch icon description checked',
        el(
            'Switch',
            { icon: icon('Bell'), description: 'Notify on outages', defaultChecked: true },
            'Monitoring alerts'
        ),
    ],
    ['Switch disabled', el('Switch', { disabled: true }, 'Locked')],
    [
        'Switch thumb icons',
        el('Switch', { checkedIcon: icon('Check'), uncheckedIcon: icon('Plus'), defaultChecked: true }, 'Dark'),
    ],
    ['Switch track labels', el('Switch', { onLabel: 'On', offLabel: 'Off' }, 'Notifications')],

    [
        'RadioGroup',
        el(
            'RadioGroup',
            { label: 'Company size', defaultValue: 'midsize', name: 'size' },
            el('RadioGroupItem', { value: 'startup' }, 'Startup'),
            el('RadioGroupItem', { value: 'midsize' }, 'Midsize'),
            el('RadioGroupItem', { value: 'corporate', disabled: true }, 'Corporation')
        ),
    ],
    [
        'RadioGroup vertical aria-label',
        el(
            'RadioGroup',
            { 'aria-label': 'Plan', orientation: 'vertical' },
            el('RadioGroupItem', { value: 'basic' }, 'Basic'),
            el('RadioGroupItem', { value: 'pro' }, 'Pro')
        ),
    ],

    [
        'ChipGroup',
        el(
            'ChipGroup',
            { label: 'Services', defaultValue: ['web'] },
            el('Chip', { value: 'web', icon: icon('Check') }, 'Software & Web'),
            el('Chip', { value: 'ai' }, 'AI & LLM'),
            el('Chip', { value: 'hw', disabled: true }, 'Hardware')
        ),
    ],
    [
        'ChipGroup single',
        el(
            'ChipGroup',
            { label: 'Filter', multiple: false },
            el('Chip', { value: 'a' }, 'A'),
            el('Chip', { value: 'b' }, 'B')
        ),
    ],
    ['Chip standalone', el('Chip', { label: 'Frankfurt', icon: icon('House') })],
    ['Chip removable', el('Chip', { label: 'Frankfurt', removable: true })],
    [
        'Chip avatar, lg, own remove label',
        el('Chip', {
            label: 'Julia Klein',
            avatar: '/julia.jpg',
            removable: true,
            removeLabel: 'Deselect Julia',
            size: 'lg',
        }),
    ],
    ['Chip sm, disabled, slot', el('Chip', { size: 'sm', removable: true, disabled: true, label: 'AI' }, 'AI & LLM')],
    ['en-US Chip removable', inLocale('en-US', el('Chip', { label: 'Berlin', removable: true }))],

    [
        'SegmentedControl',
        el(
            'SegmentedControl',
            { label: 'View', defaultValue: 'list' },
            el('SegmentedControlItem', { value: 'list', icon: icon('Check') }, 'List'),
            el('SegmentedControlItem', { value: 'grid' }, 'Grid')
        ),
    ],
    [
        'SegmentedControl sm',
        el(
            'SegmentedControl',
            { label: 'Language', size: 'sm', defaultValue: 'de' },
            el('SegmentedControlItem', { value: 'de' }, 'DE'),
            el('SegmentedControlItem', { value: 'en' }, 'EN')
        ),
    ],

    [
        'SegmentedControl, RadioGroup and ChipGroup in Field',
        el(
            'div',
            {},
            el(
                'Field',
                { label: 'View', helperText: 'How the list looks' },
                el(
                    'SegmentedControl',
                    { defaultValue: 'list' },
                    el('SegmentedControlItem', { value: 'list' }, 'List'),
                    el('SegmentedControlItem', { value: 'grid' }, 'Grid')
                )
            ),
            el(
                'Field',
                { label: 'Plan', error: 'Choose a plan', required: true },
                el(
                    'RadioGroup',
                    { name: 'plan' },
                    el('RadioGroupItem', { value: 'basic' }, 'Basic'),
                    el('RadioGroupItem', { value: 'pro' }, 'Pro')
                )
            ),
            el(
                'Field',
                { label: 'Services', helperText: 'Any number' },
                el(
                    'ChipGroup',
                    { defaultValue: ['web'] },
                    el('Chip', { value: 'web' }, 'Web'),
                    el('Chip', { value: 'ai' }, 'AI')
                )
            )
        ),
    ],
    ['Select', el('Select', { items: selectItems, 'aria-label': 'Service' })],
    ['Select selected', el('Select', { items: selectItems, 'aria-label': 'Service', defaultValue: 'hosting' })],
    [
        'Select disabled invalid',
        el('Select', { items: selectItems, 'aria-label': 'Service', disabled: true, invalid: true }),
    ],
    [
        'Select in Field',
        el('Field', { label: 'Service', required: true }, el('Select', { items: selectItems, name: 'service' })),
    ],
    [
        'Select clearable with value',
        el('Select', { items: selectItems, 'aria-label': 'Service', defaultValue: 'web', clearable: true }),
    ],
    ['Select clearable empty', el('Select', { items: selectItems, 'aria-label': 'Service', clearable: true })],
    ['Select loading', el('Select', { items: [], 'aria-label': 'Service', loading: true })],
    ...['sm', 'lg'].map((size): [string, El] => [
        `Select ${size}`,
        el('Select', { items: selectItems, 'aria-label': 'Service', size, defaultValue: 'hosting' }),
    ]),
    [
        'Select objects as values',
        el('Select', {
            items: people,
            itemLabel: 'name',
            valueKey: 'id',
            name: 'person',
            defaultValue: { id: 2, name: 'Jonas Weber', team: 'Engineering' },
            'aria-label': 'Contact person',
        }),
    ],
    [
        'Select numbers as values',
        el('Select', {
            items: people,
            itemValue: 'id',
            itemLabel: (person: { name: string }) => person.name,
            defaultValue: 1,
            'aria-label': 'Contact person',
        }),
    ],
    [
        'Select value slot',
        el('Select', {
            items: people,
            itemValue: 'id',
            itemLabel: 'name',
            defaultValue: 2,
            'aria-label': 'Contact person',
            $scoped: {
                value: {
                    react: 'renderValue',
                    args: (item: never) => ({ item }),
                    render: ({ item }: { item: { name: string; team: string } }) =>
                        el('span', {}, `${item.name} (${item.team})`),
                },
            },
        }),
    ],
    [
        'Select value not among the items',
        el('Select', { items: [], defaultValue: 'archive', 'aria-label': 'Folder', filter: true, hasMore: true }),
    ],

    ['Tabs', tabsExample()],
    ['Tabs second selected', tabsExample({ defaultValue: 'services' })],
    [
        'Tabs vertical, manual, lazy',
        tabsExample({ orientation: 'vertical', activationMode: 'manual', lazyMount: true, unmountOnExit: true }),
    ],
    [
        'Tabs closable, scrollable',
        el(
            'Tabs',
            { defaultValue: 'a', label: 'Files' },
            el(
                'TabsList',
                { scrollable: true },
                el('TabsTrigger', { value: 'a', closable: true }, 'proposal.pdf'),
                el('TabsTrigger', { value: 'b', closable: true, disabled: true }, 'notes.txt'),
                el('TabsTrigger', { value: 'c' }, 'Overview')
            ),
            el('TabsContent', { value: 'a' }, 'Proposal'),
            el('TabsContent', { value: 'b' }, 'Notes'),
            el('TabsContent', { value: 'c' }, 'Overview')
        ),
    ],

    [
        'Steps',
        el('Steps', {
            items: [{ label: 'Understand' }, { label: 'Build', icon: icon('Check') }, { label: 'Run' }],
            current: 1,
            label: 'Project process',
        }),
    ],
    ['Steps all done', el('Steps', { items: [{ label: 'A' }, { label: 'B' }], current: 2 })],

    ['Pagination', el('Pagination', { count: 12, pageSize: 4 })],
    ['Pagination ellipsis', el('Pagination', { count: 200, pageSize: 10, defaultPage: 10 })],
    ['Pagination no summary', el('Pagination', { count: 30, showSummary: false })],
    [
        'Pagination compact with edges',
        el('Pagination', { count: 50, variant: 'compact', withEdges: true, defaultPage: 2 }),
    ],
    ['Pagination auto', el('Pagination', { count: 200, variant: 'auto', defaultPage: 5 })],
    [
        'Pagination page sizes, jumper, boundaries',
        el('Pagination', {
            count: 120,
            pageSizes: [10, 25, 50],
            jumper: true,
            boundaryCount: 2,
            siblingCount: 0,
            defaultPage: 6,
        }),
    ],
    [
        'Pagination links',
        el('Pagination', {
            count: 40,
            defaultPage: 2,
            withEdges: true,
            getPageHref: (page: number) => `?page=${page}`,
        }),
    ],
    // First page: the links back have no href – they stay named links, disabled
    [
        'Pagination links first page',
        el('Pagination', { count: 40, withEdges: true, getPageHref: (page: number) => `?page=${page}` }),
    ],
    ['Pagination single page hidden', el('div', {}, el('Pagination', { count: 5, hideSinglePage: true }))],

    ['Progress', el('Progress', { value: 68, label: 'BUILD' })],
    ['Progress custom', el('Progress', { value: 3, max: 4, label: 'Steps', valueText: (p: number) => `${p} percent` })],
    ['Progress no header', el('Progress', { value: 20, showValue: false, 'aria-label': 'Upload' })],

    ['Menu closed', el('Menu', { items: menuItems }, el('IconButton', { icon: icon('Ellipsis'), label: 'Actions' }))],
    ['ContextMenu closed', el('ContextMenu', { items: menuItems }, el('div', {}, 'Area'))],
    [
        'Menu closed, item types, searchable',
        el(
            'Menu',
            { items: menuItemTypes, searchable: true, linkAs: 'a' },
            el('IconButton', { icon: icon('Ellipsis'), label: 'Actions' })
        ),
    ],
    ['Menu without trigger', el('div', {}, el('Menu', { items: menuItems }))],
    [
        'ContextMenu closed, item types',
        el('ContextMenu', { items: menuItemTypes, label: 'Server' }, el('div', {}, 'Area')),
    ],
    [
        'Menubar start, end, responsive',
        el('Menubar', {
            'aria-label': 'Application',
            responsive: true,
            $slots: { start: el('strong', {}, 'WireLayer'), end: el('span', {}, 'Julia') },
            menus: [
                { label: 'File', items: menuItems },
                { label: 'View', items: menuItemTypes },
            ],
        }),
    ],
    [
        'Menubar',
        el('Menubar', {
            'aria-label': 'Application',
            menus: [
                { label: 'File', items: menuItems },
                {
                    label: 'Edit',
                    items: [{ type: 'group', label: 'History', items: menuItems }, { type: 'separator' }],
                },
            ],
        }),
    ],
    [
        'SidebarNav',
        el('SidebarNav', {
            label: 'Main navigation',
            items: [
                { label: 'Overview', href: '#a', icon: icon('House') },
                {
                    label: 'Infrastructure',
                    children: [
                        { label: 'Server', href: '#b', current: true },
                        { label: 'Networks', href: '#c' },
                    ],
                },
                { label: 'Reports', children: [{ label: 'Costs', href: '#d' }] },
            ],
        }),
    ],
    [
        'Stepper',
        el('Stepper', {
            items: [{ label: 'Contact', description: 'Who are you?' }, { label: 'Project' }, { label: 'Check' }],
            defaultStep: 1,
            linear: true,
            // React renders the panels with this function, Vue with the step slot (none here)
            children: () => null,
        }),
    ],
    [
        'Stepper vertical, label below, loading step',
        el('Stepper', {
            items: [{ label: 'Contact' }, { label: 'Project', loading: true }, { label: 'Check' }],
            defaultStep: 1,
            orientation: 'vertical',
            labelPlacement: 'bottom',
            children: () => null,
        }),
    ],
    ['Tooltip closed', el('Tooltip', { content: 'Copy configuration' }, el('Button', {}, 'Copy'))],
    [
        'TooltipGroup, follow cursor, not interactive',
        el(
            'TooltipGroup',
            { openDelay: 600, skipDelay: 500 },
            el('Tooltip', { content: 'Bold', followCursor: true, interactive: false }, el('Button', {}, 'B')),
            el('Tooltip', { content: 'Italic', closeDelay: 0 }, el('Button', {}, 'I'))
        ),
    ],
    [
        'Tooltip at a disabled button (focusable wrapper)',
        el(
            'Tooltip',
            { content: 'Save first' },
            el('span', { tabindex: '0' }, el('Button', { disabled: true }, 'Publish'))
        ),
    ],
    [
        'Dialog closed',
        el('Dialog', {}, el('DialogTrigger', {}, el('Button', {}, 'Open')), el('DialogContent', { title: 'Title' })),
    ],
    [
        'Dialog closed, non-modal with options',
        el(
            'Dialog',
            { modal: false, closeOnEscape: false, closeOnInteractOutside: false },
            el('DialogTrigger', {}, el('Button', {}, 'Open')),
            el('DialogContent', {
                title: 'Title',
                size: 'lg',
                position: 'top',
                draggable: true,
                maximizable: true,
                closable: false,
                scrollBehavior: 'inside',
                responsive: false,
            })
        ),
    ],
    ['Toaster empty', el('Toaster', {})],
    ['Toaster with progress and swipe', el('Toaster', { showProgress: true, swipeToDismiss: true, label: 'Notices' })],
    ['ConfirmDialog idle', el('ConfirmDialog', {})],
    [
        'Popover closed',
        el(
            'Popover',
            {},
            el('PopoverTrigger', {}, el('Button', {}, 'Details')),
            el('PopoverContent', { title: 'Load' }, 'web-01')
        ),
    ],
    [
        'Drawer closed',
        el('Drawer', {}, el('DrawerTrigger', {}, el('Button', {}, 'Filter')), el('DrawerContent', { title: 'Filter' })),
    ],
    [
        'Drawer closed, non-modal with options',
        el(
            'Drawer',
            { modal: false, closeOnInteractOutside: false },
            el('DrawerTrigger', {}, el('Button', {}, 'Filter')),
            el('DrawerContent', { title: 'Filter', size: 'xl', offset: true, closable: false, placement: 'bottom' })
        ),
    ],
    [
        'Popover closed, trigger width, modal, overlay',
        el(
            'Popover',
            { width: 'trigger', trapFocus: true, overlay: true },
            el('PopoverTrigger', {}, el('Button', {}, 'Details')),
            el('PopoverContent', { title: 'Load' }, 'web-01')
        ),
    ],
    ['NumberInput', el('NumberInput', { defaultValue: 1234.5, min: 0, max: 5000, step: 0.5, 'aria-label': 'Budget' })],
    ['NumberInput sm, disabled', el('NumberInput', { size: 'sm', disabled: true, 'aria-label': 'Count' })],
    ['NumberInput without stepper', el('NumberInput', { stepper: false, defaultValue: 3, 'aria-label': 'Count' })],
    [
        'NumberInput stacked, prefix and suffix',
        el('NumberInput', {
            stepperLayout: 'stacked',
            prefix: '≈',
            suffix: 'pt',
            defaultValue: 12,
            'aria-label': 'Font size',
        }),
    ],
    [
        'NumberInput decimals, no negatives, clamp strict',
        el('NumberInput', {
            decimals: 2,
            allowNegative: false,
            clampBehavior: 'strict',
            defaultValue: 12.5,
            'aria-label': 'Price',
        }),
    ],
    [
        'NumberInput success, loading, clearable',
        el(
            'Field',
            { label: 'Quantity', success: 'In stock' },
            el('NumberInput', { defaultValue: 4, loading: true, clearable: true })
        ),
    ],
    [
        'NumberInput whole numbers, select on focus',
        el('NumberInput', { allowDecimal: false, selectOnFocus: true, 'aria-label': 'Pieces' }),
    ],
    [
        'NumberInput in Field',
        el('Field', { label: 'Count', error: 'At least 1' }, el('NumberInput', { defaultValue: 0 })),
    ],
    ['PasswordInput', el('Field', { label: 'Password', required: true }, el('PasswordInput', {}))],
    ['PasswordInput lg, visible', el('PasswordInput', { size: 'lg', defaultVisible: true, 'aria-label': 'Password' })],
    [
        'PasswordInput requirements',
        el(
            'Field',
            { label: 'New password' },
            el('PasswordInput', {
                defaultValue: 'abcdefgh',
                autocomplete: 'new-password',
                requirements: [
                    { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
                    { label: 'One digit', test: /\d/ },
                ],
            })
        ),
    ],
    [
        'PasswordInput visible controlled, success, clearable, loading',
        el('PasswordInput', {
            visible: true,
            success: true,
            clearable: true,
            loading: true,
            defaultValue: 'secret',
            'aria-label': 'Password',
        }),
    ],
    ['Slider', el('Slider', { label: 'Volume', defaultValue: [40] })],
    ['Slider hidden label', el('Slider', { label: 'Volume', defaultValue: [40], hideLabel: true })],
    [
        'Slider hidden label without value',
        el('Slider', { label: 'Volume', defaultValue: [40], hideLabel: true, showValue: false }),
    ],
    [
        'Slider range',
        el('Slider', { label: 'Price', defaultValue: [20, 80], formatValue: (value: number) => `${value} €` }),
    ],
    ['Slider disabled', el('Slider', { label: 'Volume', defaultValue: [10], disabled: true, showValue: false })],
    [
        'Slider marks, restricted',
        el('Slider', {
            label: 'Package',
            defaultValue: [50],
            marks: [0, { value: 50, label: 'Pro' }, { value: 100, label: 'Max' }],
            restrictToMarks: true,
        }),
    ],
    [
        'Slider vertical',
        el('Slider', { label: 'Level', defaultValue: [30], orientation: 'vertical', marks: [0, 50, 100] }),
    ],
    ['Slider range, minRange', el('Slider', { label: 'Price', defaultValue: [20, 80], minRange: 10 })],
    ['MultiSelect empty', el('MultiSelect', { items: selectItems, 'aria-label': 'Services' })],
    [
        'MultiSelect',
        el('MultiSelect', { items: selectItems, defaultValue: ['web', 'hosting'], 'aria-label': 'Services' }),
    ],
    [
        'MultiSelect summary',
        el('MultiSelect', {
            items: selectItems,
            defaultValue: ['web', 'hosting', 'hardware'],
            'aria-label': 'Services',
        }),
    ],
    ['MultiSelect in Field', el('Field', { label: 'Services' }, el('MultiSelect', { items: selectItems }))],
    [
        'MultiSelect chips',
        el('MultiSelect', {
            items: selectItems,
            defaultValue: ['web', 'hosting'],
            display: 'chips',
            clearable: true,
            'aria-label': 'Services',
        }),
    ],
    [
        'MultiSelect chips empty disabled',
        el('MultiSelect', { items: selectItems, display: 'chips', disabled: true, 'aria-label': 'Services' }),
    ],
    [
        'MultiSelect clearable max lg loading',
        el('MultiSelect', {
            items: groupedItems,
            defaultValue: ['web'],
            clearable: true,
            max: 2,
            size: 'lg',
            loading: true,
            selectAll: true,
            filter: true,
            'aria-label': 'Services',
        }),
    ],
    [
        'MultiSelect objects as values',
        el('MultiSelect', { items: people, itemLabel: 'name', defaultValue: [people[0]], 'aria-label': 'Team' }),
    ],
    ['Combobox', el('Field', { label: 'Service' }, el('Combobox', { items: selectItems, placeholder: 'Search …' }))],
    ['Combobox with value', el('Combobox', { items: selectItems, defaultValue: 'web', 'aria-label': 'Service' })],
    [
        'Combobox sm loading, not clearable',
        el('Combobox', { items: groupedItems, size: 'sm', loading: true, clearable: false, 'aria-label': 'Service' }),
    ],
    [
        'Combobox objects as values',
        el('Combobox', {
            items: people,
            itemValue: 'id',
            itemLabel: 'name',
            defaultValue: 2,
            size: 'lg',
            'aria-label': 'Contact person',
        }),
    ],
    [
        'Combobox own value',
        el('Combobox', {
            items: selectItems,
            allowCustomValue: true,
            defaultValue: 'Consulting',
            'aria-label': 'Service',
        }),
    ],
    ['DatePicker', el('Field', { label: 'Appointment' }, el('DatePicker', { defaultValue: '2026-10-20' }))],
    ['DatePicker empty, disabled', el('DatePicker', { disabled: true, 'aria-label': 'Appointment' })],
    [
        'DatePicker placeholder',
        el('Field', { label: 'Due date' }, el('DatePicker', { placeholder: 'Pick a due date' })),
    ],
    [
        'DateRangePicker placeholder, MonthPicker placeholder',
        el(
            'div',
            {},
            el('DateRangePicker', { placeholder: 'Any period', 'aria-label': 'Period' }),
            el('MonthPicker', { placeholder: 'Billing month', 'aria-label': 'Month', size: 'sm' })
        ),
    ],
    [
        'DatePicker with time',
        el(
            'Field',
            { label: 'Appointment' },
            el('DatePicker', { defaultValue: '2026-10-20T14:30', withTime: true, name: 'appointment' })
        ),
    ],
    [
        'DateRangePicker',
        el(
            'Field',
            { label: 'Vacation', helperText: 'Three weeks at most' },
            el('DateRangePicker', { defaultValue: { start: '2026-10-20', end: '2026-10-24' }, name: 'vacation' })
        ),
    ],
    [
        'DateRangePicker with time, no Field',
        el('DateRangePicker', {
            'aria-label': 'Maintenance',
            withTime: true,
            defaultValue: { start: '2026-10-20T09:00', end: null },
        }),
    ],
    ['TimePicker', el('Field', { label: 'Start' }, el('TimePicker', { defaultValue: '09:30', name: 'start' }))],
    ['TimePicker empty, disabled', el('TimePicker', { 'aria-label': 'End', disabled: true, step: 15 })],
    // Date and time: sizes, Date values, several dates, zones, week numbers, months side by side, own days
    [
        'DatePicker sm, not clearable',
        el('DatePicker', { size: 'sm', clearable: false, defaultValue: '2026-10-20', 'aria-label': 'Appointment' }),
    ],
    [
        'DatePicker lg, Date value',
        el('DatePicker', { size: 'lg', defaultValue: new Date(2026, 9, 20), 'aria-label': 'Appointment' }),
    ],
    [
        'DatePicker multiple',
        el(
            'Field',
            { label: 'Appointments' },
            el('DatePicker', {
                selectionMode: 'multiple',
                defaultValue: ['2026-10-20', '2026-10-22'],
                name: 'appointments',
            })
        ),
    ],
    ['DatePicker multiple, empty', el('DatePicker', { selectionMode: 'multiple', 'aria-label': 'Appointments' })],
    [
        'DatePicker time zone',
        el('DatePicker', {
            withTime: true,
            timeZone: 'Europe/Berlin',
            showTimeZone: true,
            defaultValue: '2026-10-20T12:30Z',
            'aria-label': 'Appointment',
        }),
    ],
    [
        'Calendar week numbers, two months, button bar',
        el('Calendar', { defaultValue: ['2026-10-20'], showWeekNumbers: true, numberOfMonths: 2, showButtonBar: true }),
    ],
    [
        'Calendar plain today, no outside days, Sunday first, own weekend',
        el('Calendar', {
            defaultValue: ['2026-10-20'],
            highlightToday: false,
            hideOutsideDays: true,
            firstDayOfWeek: 0,
            weekendDays: [5, 6],
            allowDeselect: true,
            excludeDates: ['2026-10-23'],
        }),
    ],
    [
        'Calendar own day content',
        el('Calendar', {
            defaultValue: ['2026-10-20'],
            $scoped: {
                day: {
                    react: 'renderDay',
                    args: (date: string, state: Record<string, unknown>) => ({ date, ...state }),
                    render: ({ date, day }: { date: string; day: number }) =>
                        el(
                            'span',
                            {},
                            String(day),
                            date === '2026-10-22' ? el('span', { 'aria-hidden': 'true' }, '•') : ''
                        ),
                },
            },
        }),
    ],
    [
        'DateRangePicker sm, month presets, week numbers',
        el('DateRangePicker', {
            'aria-label': 'Period',
            size: 'sm',
            presets: ['last3Months', 'thisQuarter'],
            showWeekNumbers: true,
            defaultValue: { start: new Date(2026, 9, 1), end: '2026-10-07' },
        }),
    ],
    [
        'MonthPicker range',
        el(
            'Field',
            { label: 'Period' },
            el('MonthPicker', { range: true, defaultValue: { start: '2026-07', end: '2026-09' }, name: 'months' })
        ),
    ],
    [
        'YearPicker range, lg',
        el('YearPicker', {
            range: true,
            size: 'lg',
            'aria-label': 'Years',
            defaultValue: { start: '2024', end: '2026' },
        }),
    ],
    [
        'QuarterPicker',
        el('Field', { label: 'Quarter' }, el('QuarterPicker', { defaultValue: '2026-Q4', name: 'quarter' })),
    ],
    ['QuarterPicker range, empty, lg', el('QuarterPicker', { range: true, size: 'lg', 'aria-label': 'Quarters' })],
    [
        'QuarterPicker range, invalid',
        el('QuarterPicker', {
            range: true,
            invalid: true,
            'aria-label': 'Quarters',
            defaultValue: { start: '2026-Q1', end: '2026-Q3' },
            name: 'q',
        }),
    ],
    [
        'TimePicker seconds, 12 hours',
        el('TimePicker', { withSeconds: true, hourCycle: 'h12', defaultValue: '14:30:15', 'aria-label': 'Start' }),
    ],
    [
        'TimePicker time zone, sm, not clearable',
        el('TimePicker', {
            timeZone: 'Europe/Berlin',
            referenceDate: '2026-07-01',
            showTimeZone: true,
            defaultValue: '12:30Z',
            clearable: false,
            size: 'sm',
            'aria-label': 'Start',
        }),
    ],
    [
        'TimeRangePicker',
        el(
            'Field',
            { label: 'Working hours' },
            el('TimeRangePicker', { defaultValue: { start: '09:00', end: '17:30' }, name: 'time' })
        ),
    ],
    ['TimeRangePicker empty, lg', el('TimeRangePicker', { 'aria-label': 'Break', size: 'lg' })],
    ['DurationInput', el('Field', { label: 'Duration' }, el('DurationInput', { defaultValue: 150, name: 'duration' }))],
    [
        'DurationInput days and seconds, empty',
        el('DurationInput', { withDays: true, withSeconds: true, size: 'lg', 'aria-label': 'Term' }),
    ],
    [
        'DurationInput ISO, read-only',
        el('DurationInput', { valueType: 'iso', defaultValue: 'PT26H5M', readOnly: true, 'aria-label': 'Duration' }),
    ],
    [
        'TimeGrid',
        el('TimeGrid', {
            start: '09:00',
            end: '11:00',
            defaultValue: '09:30',
            disabledTimes: ['10:00'],
            name: 'appointment',
        }),
    ],
    [
        'TimeGrid range, own times, sm',
        el('TimeGrid', {
            range: true,
            size: 'sm',
            label: 'Room A',
            times: ['09:00', '09:30', { value: '10:00', label: '10 am' }, { value: '10:30', disabled: true }],
            defaultValue: { start: '09:00', end: '10:00' },
        }),
    ],
    ['TimeGrid loading', el('TimeGrid', { loading: true })],
    ['TimeGrid empty', el('TimeGrid', { times: [] })],
    [
        'MiniCalendar',
        el('MiniCalendar', {
            defaultValue: '2026-10-20',
            startDate: '2026-10-19',
            max: '2026-10-23',
            label: 'Delivery day',
        }),
    ],
    ['MiniCalendar five days, disabled', el('MiniCalendar', { startDate: '2026-10-19', days: 5, disabled: true })],
    ['FileUpload', el('FileUpload', { label: 'Attachment', hint: 'PDF, max. 5 MB', accept: 'application/pdf' })],
    ['FileUpload several', el('FileUpload', { label: 'Images', maxFiles: 5, accept: ['image/png', 'image/jpeg'] })],
    ['PinInput', el('Field', { label: 'Confirmation code' }, el('PinInput', { defaultValue: '12' }))],
    ['PinInput 4, masked, invalid', el('PinInput', { length: 4, mask: true, invalid: true, 'aria-label': 'PIN' })],
    ['Rating', el('Rating', { label: 'Rating', defaultValue: 3 })],
    [
        'Rating half, read-only',
        el('Rating', { 'aria-label': 'Rating', defaultValue: 3.5, allowHalf: true, readOnly: true }),
    ],
    ['Rating sm, 10 stars', el('Rating', { 'aria-label': 'Rating', count: 10, size: 'sm' })],
    [
        'Rating allowClear, own icon',
        el('Rating', { label: 'Like', defaultValue: 2, allowClear: true, icon: icon('Check') }),
    ],
    ['Knob', el('Knob', { label: 'Volume', defaultValue: 40 })],
    [
        'Knob formatted, disabled',
        el('Knob', {
            'aria-label': 'Temperature',
            min: 10,
            max: 30,
            defaultValue: 21,
            disabled: true,
            formatValue: (value: number) => `${value} °C`,
        }),
    ],
    ['ColorPicker', el('Field', { label: 'Accent colour' }, el('ColorPicker', { defaultValue: '#1e66f5' }))],
    ['ColorPicker alpha', el('ColorPicker', { defaultValue: '#1e66f580', alpha: true, 'aria-label': 'Background' })],
    ['MaskInput', el('Field', { label: 'IBAN' }, el('MaskInput', { mask: 'DE99 9999 9999 9999 9999 99' }))],
    ['MaskInput with value', el('MaskInput', { mask: '99999', defaultValue: '12345', 'aria-label': 'ZIP code' })],
    [
        'MaskInput slot char, optional part, own tokens',
        el('MaskInput', { mask: 'hh-99999?-9999', slotChar: '#', tokens: { h: /[0-9a-f]/i }, 'aria-label': 'Code' }),
    ],
    [
        'MaskInput clearable, success',
        el('MaskInput', {
            mask: '99999',
            defaultValue: '12345',
            clearable: true,
            success: true,
            'aria-label': 'ZIP code',
        }),
    ],
    ['Tree', el('Tree', { items: fileTree, label: 'Files', defaultExpandedValue: ['documents'] })],
    [
        'Tree reorderable',
        el('Tree', { items: fileTree, label: 'Files', defaultExpandedValue: ['documents'], reorderable: true }),
    ],
    [
        'Tree checkable multiple',
        el('Tree', {
            items: fileTree,
            'aria-label': 'Files',
            selectionMode: 'multiple',
            checkable: true,
            defaultCheckedValue: ['proposal'],
            defaultExpandedValue: ['documents', 'archive'],
        }),
    ],
    [
        'Tree lazy children loading',
        el('Tree', {
            items: [
                { id: 'server', label: 'Server', hasChildren: true },
                { id: 'network', label: 'Networks', leaf: false },
            ],
            label: 'Infrastructure',
            defaultExpandedValue: ['server'],
            loadChildren: () => new Promise(() => undefined),
        }),
    ],
    [
        'Tree search, lines and expand buttons',
        el('Tree', {
            items: fileTree,
            label: 'Files',
            filter: true,
            filterValue: 'report',
            showLines: true,
            expandControls: true,
        }),
    ],
    [
        'Tree highlight search',
        el('Tree', { items: fileTree, label: 'Files', filterValue: 'pdf', filterMode: 'highlight' }),
    ],
    [
        'Tree check strictly and strategy',
        el('Tree', {
            items: fileTree,
            label: 'Files',
            checkable: true,
            checkStrictly: true,
            defaultCheckedValue: ['documents'],
            defaultExpandedValue: ['documents'],
        }),
    ],
    [
        'Tree checked strategy parent',
        el('Tree', {
            items: fileTree,
            label: 'Files',
            checkable: true,
            checkedStrategy: 'parent',
            defaultCheckedValue: ['archive'],
            defaultExpandedValue: ['documents', 'archive'],
        }),
    ],
    ['Tree empty in a group', el('Tree', { items: [], label: 'Target', group: 'folder', name: 'target' })],
    [
        'Tree own node content',
        el('Tree', {
            items: fileTree,
            label: 'Files',
            defaultExpandedValue: ['documents'],
            $scoped: {
                node: {
                    react: 'renderNode',
                    args: (node: unknown, state: Record<string, unknown>) => ({ node, ...state }),
                    render: ({ node, level }: { node: { label: string }; level: number }) =>
                        el('span', {}, `${node.label} (level ${level})`),
                },
            },
        }),
    ],
    ['TreeSelect', el('Field', { label: 'Folder' }, el('TreeSelect', { items: fileTree, defaultValue: 'report' }))],
    ['TreeSelect empty disabled', el('TreeSelect', { items: fileTree, 'aria-label': 'Folder', disabled: true })],
    [
        'TreeSelect clearable loading lg',
        el('TreeSelect', {
            items: fileTree,
            'aria-label': 'Folder',
            defaultValue: 'report',
            clearable: true,
            loading: true,
            size: 'lg',
        }),
    ],
    [
        'TreeSelect multiple chips +N sm',
        el(
            'Field',
            { label: 'Folders' },
            el('TreeSelect', {
                items: fileTree,
                multiple: true,
                defaultValue: ['proposal', 'report', 'notes'],
                maxShown: 2,
                clearable: true,
                size: 'sm',
            })
        ),
    ],
    [
        'CascadeSelect',
        el('Field', { label: 'Location' }, el('CascadeSelect', { items: locations, defaultValue: 'fra' })),
    ],
    ['CascadeSelect empty invalid', el('CascadeSelect', { items: locations, 'aria-label': 'Location', invalid: true })],
    [
        'CascadeSelect clearable loading sm',
        el('CascadeSelect', {
            items: locations,
            'aria-label': 'Location',
            defaultValue: 'muc',
            clearable: true,
            loading: true,
            size: 'sm',
        }),
    ],
    [
        'CascadeSelect search field',
        el(
            'Field',
            { label: 'Location' },
            el('CascadeSelect', { items: locations, defaultValue: 'fra', filter: true, clearable: true })
        ),
    ],
    [
        'CascadeSelect object values',
        el('CascadeSelect', {
            items: [
                { value: { id: 1 }, label: 'One' },
                { value: { id: 2 }, label: 'Two' },
            ],
            'aria-label': 'Number',
            valueKey: 'id',
            defaultValue: { id: 2 },
            changeOnSelect: true,
            expandTrigger: 'click',
        }),
    ],
    ['Gallery', el('Gallery', { images: pictures, label: 'Our office' })],
    [
        'Gallery without thumbnails, page 2',
        el('Gallery', { images: pictures, label: 'Our office', thumbnails: false, fullscreen: false, defaultPage: 1 }),
    ],
    [
        'Gallery lightbox, lazy pictures, video slide',
        el('Gallery', {
            label: 'Tour',
            tools: true,
            lazy: true,
            images: [
                ...pictures,
                {
                    type: 'video',
                    src: '/tour.mp4',
                    alt: 'Tour of the office',
                    poster: '/tour.jpg',
                    sources: [{ src: '/tour.webm', type: 'video/webm' }, { src: '/tour.mp4' }],
                    tracks: [{ src: '/tour.de.vtt', srclang: 'de', label: 'German', default: true }],
                },
            ],
            defaultPage: 3,
        }),
    ],
    [
        'Carousel controls at the sides',
        el('Carousel', {
            items: ['One', 'Two', 'Three'],
            label: 'News',
            controlsPosition: 'sides',
            children: () => null,
        }),
    ],
    [
        'Carousel vertical, part slides, steps, breakpoints',
        el('Carousel', {
            items: ['One', 'Two', 'Three'],
            label: 'News',
            orientation: 'vertical',
            height: '240px',
            slidesPerPage: 1.5,
            slidesToScroll: 1,
            allowMouseDrag: true,
            breakpoints: [{ minWidth: 640, slidesPerPage: 2 }],
            children: () => null,
        }),
    ],
    [
        'Listbox',
        el('Listbox', {
            label: 'Services',
            items: [...selectItems, { value: 'cloud', label: 'Cloud' }],
            defaultValue: ['hosting'],
        }),
    ],
    [
        'Listbox multiple',
        el('Listbox', { 'aria-label': 'Services', items: selectItems, multiple: true, disabled: true }),
    ],
    [
        'Listbox groups',
        el('Listbox', { label: 'Services', items: groupedItems, multiple: true, defaultValue: ['fra'] }),
    ],
    [
        'Listbox filter, loading, more',
        el('Listbox', {
            'aria-label': 'Contact person',
            items: people,
            itemValue: 'id',
            itemLabel: 'name',
            itemGroup: 'team',
            defaultValue: [2],
            filter: true,
            loading: true,
            hasMore: true,
        }),
    ],
    ['Listbox empty', el('Listbox', { label: 'Services', items: [], emptyText: 'Nothing found' })],
    [
        'Select, MultiSelect, Combobox and Autocomplete with a data source',
        el(
            'div',
            {},
            el('Select', { items: [], 'aria-label': 'Person', dataSource: pendingSource, defaultValue: 'p1' }),
            el('MultiSelect', {
                items: [],
                'aria-label': 'People',
                dataSource: pendingSource,
                defaultValue: ['p1', 'p2'],
                display: 'chips',
                filter: true,
            }),
            el('Combobox', { items: [], 'aria-label': 'City', dataSource: pendingSource, minSearchLength: 2 }),
            el('Autocomplete', { items: [], 'aria-label': 'Name', dataSource: pendingSource })
        ),
    ],
    [
        'Listbox check boxes, select all',
        el('Listbox', {
            label: 'Services',
            items: selectItems,
            multiple: true,
            checkboxes: true,
            selectAll: true,
            defaultValue: ['web'],
        }),
    ],
    [
        'Listbox data source',
        el('Listbox', {
            label: 'People',
            items: [],
            multiple: true,
            filter: true,
            // Never answers: the list stays loading
            dataSource: { getItems: () => new Promise(() => undefined) },
        }),
    ],
    [
        'SplitButton',
        el('SplitButton', {
            label: 'Send',
            icon: icon('ArrowRight'),
            items: menuItems,
            variant: 'outline',
            size: 'sm',
        }),
    ],
    [
        'SplitButton danger outline, rounded',
        el('SplitButton', {
            label: 'Delete',
            items: menuItems,
            variant: 'outline',
            color: 'danger',
            shape: 'rounded',
        }),
    ],
    [
        'ConfirmPopup closed',
        el('ConfirmPopup', { message: 'Really delete?', danger: true }, el('Button', {}, 'Delete')),
    ],
    [
        'Toolbar',
        el(
            'Toolbar',
            { label: 'Formatting' },
            el('IconButton', { icon: icon('Plus'), label: 'New' }),
            el('ToggleButton', { defaultPressed: true }, 'Bold'),
            el('IconButton', { icon: icon('Bell'), label: 'Notices', disabled: true })
        ),
    ],
    [
        'Panel',
        el('Panel', { title: 'Contract', $slots: { actions: el('Button', { size: 'sm' }, 'Edit') } }, 'Term 24 months'),
    ],
    [
        'Panel toggleable closed',
        el(
            'Panel',
            { title: 'Contract', toggleable: true, defaultOpen: false, headingLevel: 2, $slots: { footer: 'Footer' } },
            'Content'
        ),
    ],
    [
        'Fieldset',
        el(
            'Fieldset',
            { legend: 'Address', helperText: 'For the invoice', errorText: 'Incomplete', invalid: true },
            el('Field', { label: 'City' }, el('Input', {}))
        ),
    ],
    [
        'Fieldset disabled',
        el('Fieldset', { legend: 'Address', disabled: true }, el('Field', { label: 'City' }, el('Input', {}))),
    ],
    [
        'Fieldset collapsible open',
        el(
            'Fieldset',
            { legend: 'Delivery address', collapsible: true },
            el('Field', { label: 'City' }, el('Input', {}))
        ),
    ],
    [
        'Fieldset collapsible closed, disabled',
        el(
            'Fieldset',
            {
                legend: 'Delivery address',
                collapsible: true,
                defaultOpen: false,
                disabled: true,
                helperText: 'Optional',
            },
            el('Field', { label: 'City' }, el('Input', {}))
        ),
    ],
    ['ToggleButton', el('ToggleButton', { icon: icon('Check'), size: 'sm' }, 'Active only')],
    ['ToggleButton pressed disabled', el('ToggleButton', { pressed: true, disabled: true }, 'Bold')],
    [
        'ToggleButton pressed icon',
        el(
            'ToggleButton',
            {
                icon: icon('Bell'),
                pressedIcon: icon('Check'),
                pressedIconProps: { fill: 'currentColor' },
                pressed: true,
            },
            'Flagged only'
        ),
    ],
    [
        'InputGroup',
        el(
            'Field',
            { label: 'Domain' },
            el(
                'InputGroup',
                {},
                el('InputGroupAddon', {}, 'https://'),
                el('Input', {}),
                el('Button', { variant: 'outline' }, 'Check')
            )
        ),
    ],
    [
        'OverlayBadge count',
        el('OverlayBadge', { count: 120, label: '120 alerts' }, el('Avatar', { name: 'Julia Klein' })),
    ],
    ['OverlayBadge dot', el('OverlayBadge', { label: 'Online' }, el('Avatar', { name: 'Max Schulz' }))],
    [
        'Textarea autoResize',
        el('Field', { label: 'Message' }, el('Textarea', { autoResize: true, defaultValue: 'Hello' })),
    ],
    [
        'PasswordInput strength',
        el(
            'Field',
            { label: 'New password', helperText: 'At least 12 characters' },
            el('PasswordInput', { strength: true, defaultValue: 'Summer2026!House' })
        ),
    ],
    ['DialogHost empty', el('DialogHost', {})],
    [
        'DataView',
        el('DataView', {
            items: ['a', 'b', 'c'],
            label: 'Server',
            defaultLayout: 'grid',
            pageSize: 2,
            // React renders the items with this function, Vue with the item slot (none here)
            children: () => null,
        }),
    ],
    ['DataView empty', el('DataView', { items: [], label: 'Server', layoutToggle: false, children: () => null })],
    [
        'DataView server pages',
        el('DataView', {
            items: ['web-07', 'web-08'],
            label: 'Server',
            layoutToggle: false,
            manual: true,
            totalCount: 30,
            pageSize: 2,
            page: 4,
            $scoped: {
                item: {
                    react: 'children',
                    args: (item: string, layout: string) => ({ item, layout }),
                    render: ({ item }: { item: string }) => el('span', {}, item),
                },
            },
        }),
    ],
    [
        'DataView loading placeholders',
        el('DataView', { items: [], label: 'Server', layoutToggle: false, loading: true, children: () => null }),
    ],
    [
        'DataView grows with "load more"',
        el('DataView', {
            items: ['web-01', 'web-02'],
            label: 'Server',
            layoutToggle: false,
            loadMode: 'infinite',
            hasMore: true,
            manual: true,
            totalCount: 12,
            children: () => null,
        }),
    ],
    [
        'DataView error, no results',
        el(
            'div',
            {},
            el('DataView', { items: [], label: 'Server', error: new Error('offline'), children: () => null }),
            el('DataView', { items: [], label: 'Filtered', filtered: true, layoutToggle: false, children: () => null })
        ),
    ],
    [
        'OrderList',
        el('OrderList', {
            label: 'Steps',
            defaultValue: [
                { value: 'a', label: 'Backup' },
                { value: 'b', label: 'Update' },
            ],
        }),
    ],
    [
        'PickList',
        el('PickList', {
            items: [
                { value: 'jk', label: 'Julia Klein' },
                { value: 'ms', label: 'Max Schulz' },
                { value: 'al', label: 'Ana Lopez' },
            ],
            defaultValue: ['ms'],
        }),
    ],
    [
        'PickList objects, search, select all, drag',
        el('PickList', {
            items: [
                { id: 1, name: 'Julia Klein' },
                { id: 2, name: 'Max Schulz' },
                { id: 3, name: 'Ana Lopez' },
            ],
            itemValue: (person: { id: number }) => person,
            itemLabel: 'name',
            valueKey: 'id',
            defaultValue: [{ id: 2, name: 'Max Schulz' }],
            filter: true,
            selectAll: true,
            draggable: true,
        }),
    ],
    [
        'OrderList objects, search, drag',
        el('OrderList', {
            label: 'Steps',
            itemValue: 'id',
            itemLabel: 'title',
            defaultValue: [
                { id: 1, title: 'Backup' },
                { id: 2, title: 'Update' },
            ],
            filter: true,
            draggable: true,
        }),
    ],
    [
        'Timeline feed, loading older',
        el('Timeline', {
            label: 'Activities',
            feed: true,
            hasMore: true,
            loading: true,
            items: [
                { time: 'Oct 21, 2026', title: 'Ticket closed', description: 'By Julia Klein' },
                { time: 'Oct 20, 2026', title: 'Comment', status: 'info' },
            ],
        }),
    ],
    [
        'Timeline',
        el('Timeline', {
            label: 'History',
            items: [
                { time: 'Oct 20, 2026', datetime: '2026-10-20', title: 'Submitted', icon: icon('Check') },
                { time: 'Oct 21, 2026', title: 'Rolled out', description: 'Frankfurt', status: 'success' },
            ],
        }),
    ],
    [
        'Timeline alternate, opposite, active',
        el('Timeline', {
            label: 'History',
            align: 'alternate',
            activeIndex: 1,
            items: [
                { time: 'Oct 20, 2026', title: 'Submitted', opposite: 'Anna Berg' },
                { time: 'Oct 21, 2026', title: 'Reviewed', icon: icon('Check') },
                { time: 'Oct 22, 2026', title: 'Rolled out', status: 'success' },
            ],
        }),
    ],
    [
        'Timeline end, horizontal',
        el(
            'div',
            {},
            el('Timeline', {
                label: 'Right',
                align: 'end',
                items: [{ time: 'Oct 20, 2026', title: 'Submitted', opposite: 'Anna' }],
            }),
            el('Timeline', {
                label: 'Process',
                orientation: 'horizontal',
                activeIndex: 0,
                items: [
                    { time: 'Q1', title: 'Planning' },
                    { time: 'Q2', title: 'Implementation' },
                ],
            })
        ),
    ],
    [
        'Timeline own content, opposite and marker',
        el('Timeline', {
            label: 'History',
            items: [{ time: 'Oct 20, 2026', title: 'Submitted' }],
            $scoped: {
                content: {
                    react: 'renderContent',
                    args: (item: unknown, index: number) => ({ item, index }),
                    render: ({ item }: { item: { title: string } }) => el('strong', {}, item.title),
                },
                opposite: {
                    react: 'renderOpposite',
                    args: (item: unknown, index: number) => ({ item, index }),
                    render: ({ index }: { index: number }) => `#${index + 1}`,
                },
                marker: {
                    react: 'renderMarker',
                    args: (item: unknown, index: number) => ({ item, index }),
                    render: ({ index }: { index: number }) => String(index + 1),
                },
            },
        }),
    ],
    [
        'OrgChart',
        el('OrgChart', {
            label: 'Org chart',
            node: {
                label: 'Management',
                title: 'Executive board',
                children: [{ label: 'Development', children: [{ label: 'Frontend' }] }, { label: 'Operations' }],
            },
        }),
    ],
    [
        'OrgChart collapsible, selectable, lazy team',
        el('OrgChart', {
            label: 'Org chart',
            collapsible: true,
            selectionMode: 'single',
            defaultSelectedKeys: ['development'],
            defaultCollapsedKeys: ['operations'],
            loadChildren: () => new Promise(() => undefined),
            node: {
                id: 'management',
                label: 'Management',
                children: [
                    { id: 'development', label: 'Development', children: [{ label: 'Frontend' }] },
                    { id: 'operations', label: 'Operations', children: [{ label: 'Hosting' }] },
                    { id: 'sales', label: 'Sales', hasChildren: true },
                ],
            },
            $scoped: {
                content: {
                    react: 'renderContent',
                    args: (node: unknown, state: Record<string, unknown>) => ({ node, ...state }),
                    render: ({ node, selected }: { node: { label: string }; selected: boolean }) =>
                        el('span', {}, `${node.label}${selected ? ' (selected)' : ''}`),
                },
            },
        }),
    ],
    [
        'MeterGroup',
        el('MeterGroup', {
            label: 'Storage',
            max: 1000,
            items: [
                { label: 'Databases', value: 420 },
                { label: 'Logs', value: 90, color: 'warn' },
            ],
        }),
    ],
    ['VirtualList', el('VirtualList', { items: ['a', 'b', 'c'], label: 'Log', children: () => null })],
    [
        'VirtualList groups, loading more',
        el('VirtualList', {
            items: [
                { name: 'Anna', team: 'A' },
                { name: 'Arne', team: 'A' },
                { name: 'Berta', team: 'B' },
            ],
            label: 'People',
            itemGroup: 'team',
            hasMore: true,
            loadingMore: true,
            // jsdom measures 0 px: the rows keep the estimate (40 = itemHeight, as measured rows get)
            estimateSize: () => 40,
            $scoped: {
                default: {
                    react: 'children',
                    args: (item: { name: string }, index: number) => ({ item, index }),
                    render: ({ item }: { item: { name: string } }) => el('span', {}, item.name),
                },
            },
        }),
    ],
    [
        'VirtualTree',
        el('VirtualTree', {
            items: fileTree,
            label: 'Files',
            defaultExpandedValue: ['documents'],
            checkable: true,
            defaultCheckedValue: ['proposal'],
        }),
    ],
    [
        'VirtualTree loading, search',
        el('VirtualTree', {
            items: [{ id: 'server', label: 'Server', hasChildren: true }, ...fileTree],
            label: 'Files',
            defaultExpandedValue: ['server'],
            loadChildren: () => new Promise(() => undefined),
            filter: true,
            expandControls: true,
        }),
    ],
    [
        'Splitter',
        el('Splitter', {
            panels: [
                { id: 'nav', label: 'Navigation', defaultSize: 30 },
                { id: 'main', label: 'Content' },
            ],
            // React renders the panels with this function, Vue with the panel slot (none here)
            children: () => null,
        }),
    ],
    ['ScrollPanel', el('ScrollPanel', { label: 'Conditions' }, el('p', {}, 'Text'))],
    ...(['hover', 'always', 'hidden'] as const).map((scrollbars): [string, El] => [
        `ScrollPanel scrollbars ${scrollbars}`,
        el('ScrollPanel', { label: 'Conditions', scrollbars, fade: scrollbars === 'hover' }, el('p', {}, 'Text')),
    ]),
    ['Image', el('Image', { src: '/image.jpg', alt: 'Data center', width: '320' })],
    ['Image preview', el('Image', { src: '/image.jpg', alt: 'Data center', preview: true })],
    [
        'Image fallback, preview source',
        el('Image', {
            src: '/image.jpg',
            alt: 'Data center',
            fallbackSrc: '/placeholder.svg',
            previewSrc: '/image-large.jpg',
            preview: true,
            loading: 'lazy',
        }),
    ],
    ['Inplace', el('Inplace', { $slots: { display: 'web-01' }, children: () => null })],
    ['ScrollTop', el('ScrollTop', {})],
    ['BlockUi', el('BlockUi', { blocked: true }, el('Button', {}, 'Save'))],
    ['BlockUi free', el('BlockUi', {}, el('Button', {}, 'Save'))],
    ...(['idle', 'saving', 'saved', 'error'] as const).map((status): [string, El] => [
        `SaveStatus ${status}`,
        el('SaveStatus', { status }),
    ]),
    ['SaveStatus own text', el('SaveStatus', { status: 'saved', translations: { saved: 'Draft saved' } })],
    ['SpeedDial', el('SpeedDial', { items: [{ value: 'new', label: 'New', icon: icon('Plus') }], label: 'Create' })],
    [
        'AppShell',
        el(
            'AppShell',
            {
                $slots: {
                    header: el('span', {}, 'Admin'),
                    navbar: el('SidebarNav', {
                        label: 'Main navigation',
                        items: [{ label: 'Start', href: '#', current: true }],
                    }),
                    aside: el('p', {}, 'Notices'),
                },
            },
            el('h1', {}, 'Overview')
        ),
    ],
    ['CommandPalette closed', el('CommandPalette', { items: [{ value: 'a', label: 'Start', group: 'Pages' }] })],
    [
        'CommandPalette closed, options',
        el('CommandPalette', {
            items: [{ value: 'a', label: 'Start', description: 'Overview', group: 'Pages' }],
            hotkey: ['mod+p', '/'],
            limit: 5,
            loading: true,
            emptyText: 'Nothing',
            closeOnSelect: false,
            clearQueryOnClose: false,
        }),
    ],
    [
        'TagsInput',
        el(
            'Field',
            { label: 'Keywords', helperText: 'Enter adds' },
            el('TagsInput', { defaultValue: ['hosting', 'web'], placeholder: 'New' })
        ),
    ],
    ['TagsInput empty, disabled', el('TagsInput', { 'aria-label': 'Tags', disabled: true })],
    [
        'TagsInput suggestions',
        el(
            'Field',
            { label: 'Keywords' },
            el('TagsInput', { defaultValue: ['hosting'], suggestions: ['hosting', 'linux', 'docker'], loading: true })
        ),
    ],
    ['CopyButton', el('CopyButton', { value: '10.0.1.11', showValue: true, label: 'Copy IP' })],
    [
        'HoverCard closed',
        el('HoverCard', { $slots: { content: 'Card' }, content: 'Card' }, el('a', { href: '#a' }, 'Julia')),
    ],
    ['HoverCard without trigger', el('div', {}, el('HoverCard', { $slots: { content: 'Card' }, content: 'Card' }))],
    ['Kbd', el('p', {}, el('Kbd', {}, 'Ctrl'), ' + ', el('Kbd', {}, 'K'))],
    ['MonthPicker', el('Field', { label: 'Month' }, el('MonthPicker', { defaultValue: '2026-10' }))],
    ['Calendar', el('Calendar', { selectionMode: 'multiple', defaultValue: ['2026-10-20', '2026-10-22'] })],
    [
        'DateRangePicker presets',
        el('DateRangePicker', {
            'aria-label': 'Period',
            presets: ['last7Days'],
            defaultValue: { start: '2026-10-01', end: '2026-10-07' },
        }),
    ],
    [
        'NavigationMenu',
        el('NavigationMenu', {
            items: [
                {
                    label: 'Services',
                    children: [{ label: 'Hosting', href: '#h', description: 'Operations', icon: icon('House') }],
                },
                { label: 'Contact', href: '#k', current: true },
            ],
        }),
    ],
    ['ProgressCircle', el('ProgressCircle', { value: 72, label: 'Storage', status: 'warn', size: 'lg' })],
    // Mega menu: a button with a panel (columns, groups, badge, description, featured, all link), a link with its own
    // chevron button, a plain link; open panels render in place
    ['MegaMenu', el('MegaMenu', { items: megaItems, currentHref: '/services/hosting' })],
    ['MegaMenu open panel', el('MegaMenu', { items: megaItems, defaultValue: 'Services', headingLevel: 2 })],
    ['MegaMenu link with chevron, open', el('MegaMenu', { items: megaItems, defaultValue: 'Products' })],
    [
        'MegaMenu vertical, hover, no arrow keys, never collapsed',
        el('MegaMenu', {
            items: megaItems,
            orientation: 'vertical',
            openOn: 'hover',
            arrowKeys: false,
            collapse: 'never',
            label: 'Sections',
        }),
    ],
    [
        'MegaMenu container collapse, own menu label, isCurrent',
        el('MegaMenu', { items: megaItems, collapse: 'container', menuLabel: 'Navigation', currentHref: '/contact' }),
    ],
    ['Stack', el('Stack', { gap: 'lg', align: 'center', as: 'ul' }, el('li', {}, 'One'), el('li', {}, 'Two'))],
    [
        'Group',
        el(
            'Group',
            { gap: 'sm', justify: 'between', align: 'top', nowrap: true, grow: true },
            el('Button', {}, 'Save'),
            el('Button', { variant: 'outline' }, 'Cancel')
        ),
    ],
    [
        'SimpleGrid responsive',
        el('SimpleGrid', { columns: { base: 1, sm: 2, lg: 4 }, gap: 'lg' }, el('div', {}, 'A'), el('div', {}, 'B')),
    ],
    ['SimpleGrid auto-fit', el('SimpleGrid', { minColumnWidth: '14rem', as: 'section' }, el('p', {}, 'A'))],
    ['Container', el('Container', { size: 'sm', flush: true }, el('p', {}, 'Content'))],
    ['Center', el('Center', { inline: true }, el('span', {}, 'Middle'))],
    ['AspectRatio', el('AspectRatio', { ratio: 4 / 3 }, el('img', { src: '/image.jpg', alt: 'Data center' }))],
    ['Affix', el('Affix', { position: 'top-start', offset: '1rem' }, el('Button', {}, 'Help'))],
    [
        'Sticky bar',
        el(
            'Sticky',
            { edge: 'bottom', bar: true, offset: '0.5rem', as: 'footer' },
            el('Button', { variant: 'outline' }, 'Cancel'),
            el('Button', {}, 'Save')
        ),
    ],
    ['Collapse open', el('Collapse', { open: true, id: 'details' }, el('p', {}, 'More text'))],
    ['Collapse closed, horizontal', el('Collapse', { orientation: 'horizontal' }, el('p', {}, 'Sidebar'))],
    [
        'Scroller',
        el(
            'Scroller',
            { label: 'Categories' },
            el('Button', { variant: 'outline' }, 'Hosting'),
            el('Button', { variant: 'outline' }, 'Cloud')
        ),
    ],
    [
        'Masonry',
        el('Masonry', { columns: { base: 1, md: 3 }, gap: 'lg' }, el('div', {}, 'Card 1'), el('div', {}, 'Card 2')),
    ],
    ['Masonry rows', el('Masonry', { columns: 2, mode: 'rows', gap: 'sm' }, el('div', {}, 'Card 1'))],
    [
        'PageHeader',
        el('PageHeader', {
            title: 'Server web-01',
            subtitle: 'Frankfurt · Ubuntu 26.04',
            backHref: '/server',
            status: 'Online',
            statusVariant: 'success',
            divided: true,
            $slots: {
                breadcrumb: el('Breadcrumb', {
                    items: [{ label: 'Start', href: '/' }, { label: 'Server', href: '/server' }, { label: 'web-01' }],
                }),
                meta: el('span', {}, 'Created on Mar 12, 2026'),
                actions: el('Button', { size: 'sm' }, 'Restart'),
                tabs: tabsExample(),
            },
        }),
    ],
    ['PageHeader small', el('PageHeader', { title: 'Settings', headingLevel: 2, size: 'sm', backLabel: 'Up' })],
    [
        'BottomNavigation',
        el('BottomNavigation', {
            items: [
                { label: 'Start', href: '/', icon: icon('House') },
                { label: 'Messages', href: '/messages', icon: icon('Mail'), badge: 120 },
                { label: 'Notices', href: '/notices', icon: icon('Bell'), badge: 'new' },
                { label: 'More', href: '/more', icon: icon('Ellipsis'), badge: 0 },
            ],
            currentHref: '/messages',
            inline: true,
            label: 'Sections',
        }),
    ],
    ...(['info', 'success', 'warn', 'danger', 'neutral'] as const).map((variant): [string, El] => [
        `Banner ${variant}`,
        el('Banner', { variant, title: 'Maintenance' }, 'The portal will be briefly unavailable from 10 pm tonight.'),
    ]),
    [
        'Banner dismissible, actions, top',
        el(
            'Banner',
            {
                dismissible: true,
                position: 'top',
                storageKey: 'parity-banner',
                icon: icon('Bell'),
                $slots: { actions: el('Button', { size: 'sm', variant: 'outline' }, 'Learn more') },
            },
            'New features are here.'
        ),
    ],
    [
        'Banner without icon, bottom',
        el('Banner', { hideIcon: true, position: 'bottom', dismissLabel: 'Dismiss' }, 'Cookies'),
    ],
    ...(['success', 'info', 'warn', 'error', '403', '404', '500'] as const).map((status): [string, El] => [
        `Result ${status}`,
        el('Result', { status }),
    ]),
    [
        'Result with text, actions and extra',
        el(
            'Result',
            {
                status: 'success',
                title: 'Order sent',
                description: 'You will receive a confirmation by email shortly.',
                headingLevel: 1,
                icon: icon('Mail'),
                $slots: { actions: el('Button', {}, 'To the overview') },
            },
            el('p', {}, 'Order number 4711')
        ),
    ],
    ['Descriptions', el('Descriptions', { items: descriptionItems })],
    [
        'Descriptions bordered, horizontal, title, actions',
        el('Descriptions', {
            items: descriptionItems,
            title: 'Contract',
            headingLevel: 2,
            columns: 2,
            orientation: 'horizontal',
            bordered: true,
            $slots: { actions: el('Button', { size: 'sm' }, 'Edit') },
        }),
    ],
    [
        'Descriptions editing',
        el('Descriptions', {
            items: descriptionItems.slice(0, 2),
            editing: true,
            $scoped: Object.fromEntries(
                ['customer', 'term'].map((id) => [
                    `edit-${id}`,
                    {
                        react: 'renderEdit',
                        args: (item: unknown, state: { labelId: string }) => ({ item, ...state }),
                        render: ({ item, labelId }: { item: { value: string }; labelId: string }) =>
                            el('Input', { 'aria-labelledby': labelId, placeholder: item.value }),
                    },
                ])
            ),
        }),
    ],
    ['NotificationCenter', el('NotificationCenter', { items: notifications, now: notificationNow })],
    [
        'NotificationCenter drawer, unread count',
        el('NotificationCenter', {
            items: notifications,
            now: notificationNow,
            display: 'drawer',
            unreadCount: 12,
            label: 'Alerts',
        }),
    ],
    [
        'AppShell rail, resizable, footer, headroom, navbar first',
        el(
            'AppShell',
            {
                navbarCollapsed: true,
                collapsible: true,
                navbarResizable: true,
                asideResizable: true,
                headroom: true,
                layout: 'navbar-first',
                $slots: {
                    header: el('span', {}, 'Admin'),
                    navbar: el('SidebarNav', { label: 'Main navigation', items: sidebarItems }),
                    aside: el('p', {}, 'Notices'),
                    footer: el('p', {}, '© 2026'),
                },
            },
            el('h1', {}, 'Overview')
        ),
    ],
    [
        'AppShell resizable navbar, own widths',
        el(
            'AppShell',
            {
                navbarResizable: true,
                navbarWidth: 300,
                navbarMinWidth: 240,
                navbarMaxWidth: 400,
                collapsible: true,
                navbarExpandOnHover: true,
                $slots: { navbar: el('SidebarNav', { label: 'Main navigation', items: sidebarItems }) },
            },
            el('h1', {}, 'Overview')
        ),
    ],
    [
        'SidebarNav rail, badges, header and footer',
        el('SidebarNav', {
            label: 'Main navigation',
            items: sidebarItems,
            rail: true,
            $slots: { header: el('span', {}, 'WireLayer'), footer: el('a', { href: '/account' }, 'Account') },
        }),
    ],
    [
        'SidebarNav rail expanding on hover',
        el('SidebarNav', { label: 'Main navigation', items: sidebarItems, rail: true, expandOnHover: true }),
    ],
    ['SidebarNav badges', el('SidebarNav', { label: 'Main navigation', items: sidebarItems })],
    [
        'Splitter px sizes, collapsible, steps',
        el('Splitter', {
            panels: [
                { id: 'nav', label: 'Navigation', defaultSize: '240px', minSize: '160px', collapsible: true },
                { id: 'main', label: 'Content' },
            ],
            step: 5,
            shiftStep: 20,
            storageKey: 'parity-splitter',
            children: () => null,
        }),
    ],
    [
        'Splitter collapsible, vertical',
        el('Splitter', {
            panels: [
                { id: 'top', label: 'Top', defaultSize: 60, minSize: 20, collapsible: true, collapsedSize: 5 },
                { id: 'bottom', label: 'Bottom' },
            ],
            orientation: 'vertical',
            children: () => null,
        }),
    ],
    [
        'TopBar',
        el(
            'TopBar',
            {
                $slots: {
                    start: el('span', {}, 'Console'),
                    end: el('Avatar', { name: 'Julia Klein', as: 'button', size: 'sm' }),
                },
            },
            el('span', {}, 'Search')
        ),
    ],
    [
        'Toolbar regions',
        el(
            'Toolbar',
            {
                label: 'Editor',
                $slots: {
                    start: el('IconButton', { icon: icon('Plus'), label: 'New' }),
                    center: el('ToggleButton', {}, 'Bold'),
                    end: el('Button', { size: 'sm' }, 'Save'),
                },
            },
            el('IconButton', { icon: icon('Mail'), label: 'Send' })
        ),
    ],
    ...(['circle', 'semicircle', 'quarter'] as const).map((layout): [string, El] => [
        `SpeedDial ${layout}`,
        el('SpeedDial', {
            items: [
                { value: 'new', label: 'New', icon: icon('Plus') },
                { value: 'mail', label: 'Send', icon: icon('Mail') },
            ],
            layout,
            direction: 'left',
        }),
    ]),
    ['Tour closed', el('Tour', { steps: [{ id: 'a', title: 'Start', description: 'Hello' }] })],
    [
        'TableOfContents',
        el('TableOfContents', {
            items: [
                { id: 'a', label: 'Services' },
                { id: 'b', label: 'Term', depth: 2 },
            ],
        }),
    ],
    [
        'NativeSelect',
        el(
            'Field',
            { label: 'Location', helperText: 'Data center' },
            el('NativeSelect', {
                placeholder: 'Please choose',
                items: [
                    { value: 'fra', label: 'Frankfurt' },
                    { value: 'vie', label: 'Vienna', disabled: true },
                ],
            })
        ),
    ],
    [
        'NativeSelect sm invalid',
        el('NativeSelect', { 'aria-label': 'City', size: 'sm', invalid: true, items: [{ value: 'a', label: 'A' }] }),
    ],
    ['Spoiler', el('Spoiler', { maxHeight: 60 }, el('p', {}, 'Long text'))],
    ['Highlight', el('p', {}, el('Highlight', { text: 'Server web-01, Backup-Server', query: 'server' }))],
    [
        'Highlight whole words, accents, colours',
        el(
            'p',
            {},
            el('Highlight', {
                text: 'Müller and webserver, Server and Muller',
                query: ['muller', 'server'],
                wholeWord: true,
                ignoreAccents: true,
                colors: ['info', 'success'],
            })
        ),
    ],
    [
        'Highlight first hit only, own splitting',
        el('p', {}, el('Highlight', { text: 'a b a', query: 'a', matchAll: false, wholeWord: true })),
    ],
    ['NavigationProgress idle', el('NavigationProgress', {})],
    ['Sparkline', el('Sparkline', { data: [1, 4, 2, 8], label: 'Load' })],
    ['Divider', el('Divider', {})],
    ['Divider vertical', el('Divider', { orientation: 'vertical' })],
    ['Divider with label', el('Divider', { label: 'or' })],
    ['Divider dashed', el('Divider', { lineStyle: 'dashed' })],
    ['Divider dotted vertical', el('Divider', { lineStyle: 'dotted', orientation: 'vertical' })],
    ['Divider label start', el('Divider', { label: 'Details', labelPosition: 'start' })],
    ['Divider label end, dashed', el('Divider', { label: 'End', labelPosition: 'end', lineStyle: 'dashed' })],
    ...(['line', 'rect', 'circle'] as const).map((shape): [string, El] => [
        `Skeleton ${shape}`,
        el('Skeleton', { shape, width: '60%' }),
    ]),
    [
        'Accordion',
        el(
            'Accordion',
            { defaultValue: ['hosting'] },
            el('AccordionItem', { value: 'software', title: 'Software', icon: icon('House') }, 'Web applications'),
            el('AccordionItem', { value: 'hosting', title: 'Hosting' }, 'Operations and monitoring'),
            el('AccordionItem', { value: 'cloud', title: 'Cloud', disabled: true }, 'Kubernetes')
        ),
    ],
    [
        'Accordion multiple, h2',
        el(
            'Accordion',
            { multiple: true, defaultValue: ['a', 'b'] },
            el('AccordionItem', { value: 'a', title: 'A', headingLevel: 2 }, 'Content A'),
            el('AccordionItem', { value: 'b', title: 'B', headingLevel: 2 }, 'Content B')
        ),
    ],
    [
        'Accordion not collapsible, actions',
        el(
            'Accordion',
            { defaultValue: ['a'], collapsible: false },
            el(
                'AccordionItem',
                {
                    value: 'a',
                    title: 'Server',
                    $slots: { actions: el('IconButton', { icon: icon('Plus'), label: 'Create server', size: 'sm' }) },
                },
                'List'
            ),
            el('AccordionItem', { value: 'b', title: 'Network' }, 'Networks')
        ),
    ],

    ['Button inverted', el('Button', { variant: 'inverted' }, 'Start a project')],

    [
        'SiteHeader',
        el('SiteHeader', {
            brand: 'WireLayer',
            items: [
                { label: 'Software', href: '/software', current: true },
                { label: 'Hosting', href: '/hosting' },
            ],
        }),
    ],
    [
        'SiteHeader logo actions',
        el('SiteHeader', {
            brand: 'WireLayer',
            homeHref: '/start',
            items: [{ label: 'AI', href: '/ai' }],
            $slots: {
                logo: el('svg', { viewBox: '0 0 24 24' }),
                actions: el('Button', { size: 'sm' }, 'Start a project'),
            },
        }),
    ],
    ['SiteHeader brand only', el('SiteHeader', { brand: 'WireLayer' })],
    [
        'CtaSection',
        el(
            'CtaSection',
            {
                title: 'Tell us what you are planning.',
                description: 'We will get back to you within one business day.',
            },
            el('Button', { variant: 'inverted' }, 'Start a project')
        ),
    ],
    ['CtaSection image h3', el('CtaSection', { title: 'Contact', image: '/logo.svg', titleTag: 'h3' })],
    ['ModeToggle', el('ModeToggle', {})],

    ['DataTable', el('DataTable', { data: servers, columns: serverColumns, caption: 'Server', getRowId })],
    [
        // The filter row with DatePicker and NumberInput instead of the browser's inputs
        'DataTable features dateInput, numberInput',
        el('DataTable', {
            data: servers,
            columns: serverColumns,
            caption: 'Server',
            getRowId,
            features: [feature('dateInput'), feature('numberInput')],
        }),
    ],
    [
        'DataTable paginated selectable',
        el('DataTable', {
            data: servers,
            columns: serverColumns,
            caption: 'Server',
            getRowId,
            pageSize: 2,
            selectable: true,
            selection: ['web-01'],
            rowLabel: (row: { name: string }) => row.name,
        }),
    ],
    [
        'DataTable sorted desc',
        el('DataTable', {
            data: servers,
            columns: serverColumns,
            caption: 'Server',
            sorting: { id: 'load', desc: true },
        }),
    ],
    ['DataTable empty', el('DataTable', { data: [], columns: serverColumns, caption: 'Server' })],
    ['DataTable loading', el('DataTable', { data: [], columns: serverColumns, caption: 'Server', loading: true })],
    [
        'DataTable manual',
        el('DataTable', {
            data: servers.slice(0, 2),
            columns: serverColumns,
            caption: 'Server',
            manual: true,
            rowCount: 40,
            pageSize: 2,
            page: 3,
        }),
    ],
    [
        'DataTable tools',
        el('DataTable', {
            data: servers,
            columns: [
                {
                    id: 'name',
                    header: 'Name',
                    sortable: true,
                    filter: 'text',
                    pinned: 'start',
                    width: 160,
                    editable: true,
                },
                { id: 'location', header: 'Location', filter: 'select', width: 170 },
                { id: 'load', header: 'Load', align: 'end', width: 120, hideable: false },
            ],
            caption: 'Server',
            getRowId,
            selectable: true,
            search: true,
            resizable: true,
            columnToggle: true,
            exportFilename: 'server',
            hiddenColumns: [],
            filters: { location: 'Frankfurt' },
        }),
    ],
    [
        'DataTable grouped',
        el('DataTable', { data: servers, columns: serverColumns, caption: 'Server', getRowId, groupBy: 'location' }),
    ],
    [
        'DataTable tree',
        el('DataTable', {
            data: fileRows,
            columns: serverColumns,
            caption: 'Files',
            getRowId,
            getSubRows: (row: { children?: unknown[] }) => row.children,
            defaultExpanded: ['projects'],
        }),
    ],
    [
        'DataTable tree as treegrid (grid keys)',
        el('DataTable', {
            data: fileRows,
            columns: serverColumns,
            caption: 'Files',
            getRowId,
            navigation: 'grid',
            getSubRows: (row: { children?: unknown[] }) => row.children,
            defaultExpanded: ['projects'],
        }),
    ],
    [
        'DataTable filter menu, multiple sort, column menu',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns,
            caption: 'Server',
            getRowId,
            filterDisplay: 'menu',
            sortMode: 'multiple',
            sorting: [
                { id: 'load', desc: true },
                { id: 'name', desc: false },
            ],
            filters: { load: { operator: 'and', constraints: [{ matchMode: 'gte', value: 20 }] } },
            columnMenu: true,
            reorderableColumns: true,
            resizable: true,
        }),
    ],
    [
        'DataTable typed row filters',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns,
            caption: 'Server',
            getRowId,
            filters: { location: { operator: 'and', constraints: [{ matchMode: 'in', value: ['Frankfurt'] }] } },
        }),
    ],
    [
        'DataTable column groups and footer',
        el('DataTable', {
            data: fleet,
            caption: 'Server',
            getRowId,
            columns: [
                { id: 'name', header: 'Name', footer: 'Total' },
                {
                    id: 'usage',
                    header: 'Usage',
                    columns: [
                        { id: 'load', header: 'Load', align: 'end', aggregate: 'sum' },
                        { id: 'since', header: 'Since', aggregate: 'count' },
                    ],
                },
            ],
        }),
    ],
    [
        'DataTable details, numbers, actions, reorder, single selection',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns.slice(0, 3),
            caption: 'Server',
            getRowId,
            rowLabel: (row: { name: string }) => row.name,
            selectable: true,
            selectionMode: 'single',
            selection: ['db-primary'],
            reorderableRows: true,
            rowNumbers: true,
            rowActions: [
                { value: 'restart', label: 'Restart' },
                { value: 'delete', label: 'Delete', danger: true },
            ],
            contextMenu: true,
            defaultExpanded: ['web-01'],
            $render: { expansion: (row: { name: string }) => el('p', {}, `Details for ${row.name}`) },
        }),
    ],
    [
        'DataTable details on some rows',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns.slice(0, 2),
            caption: 'Server',
            getRowId,
            rowLabel: (row: { name: string }) => row.name,
            rowExpandable: (row: { name: string }) => row.name !== 'web-01',
            defaultExpanded: ['db-primary'],
            $render: { expansion: (row: { name: string }) => el('p', {}, `Details for ${row.name}`) },
        }),
    ],
    [
        'DataTable grouped with aggregates',
        el('DataTable', { data: fleet, columns: fleetColumns, caption: 'Server', getRowId, groupBy: 'location' }),
    ],
    [
        'DataTable look and toolbar',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns.slice(0, 3),
            caption: 'Server',
            getRowId,
            size: 'sm',
            gridlines: true,
            striped: true,
            search: true,
            globalFilter: 'web',
            highlightSearch: true,
            densityToggle: true,
            fullscreenToggle: true,
            columnToggle: true,
            exportFilename: 'server',
            pageSize: 2,
            pageSizeOptions: [2, 10, 25],
            paginatorPosition: 'top',
            $slots: { toolbar: el('Button', { size: 'sm', variant: 'outline' }, 'New') },
        }),
    ],
    [
        'DataTable frozen rows, scroll height',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns.slice(0, 3),
            caption: 'Server',
            getRowId,
            frozenRows: ['db-primary'],
            scrollHeight: '240px',
        }),
    ],
    [
        'DataTable frozen rows editable (row mode)',
        el('DataTable', {
            data: fleet,
            caption: 'Server',
            getRowId,
            frozenRows: ['db-primary'],
            editMode: 'row',
            columns: [
                { id: 'name', header: 'Name', editable: true },
                { id: 'load', header: 'Load', editable: true, editor: 'number' },
            ],
        }),
    ],
    [
        'DataTable row edit',
        el('DataTable', {
            data: fleet,
            caption: 'Server',
            getRowId,
            editMode: 'row',
            columns: [
                { id: 'name', header: 'Name', editable: true },
                { id: 'load', header: 'Load', editable: true, editor: 'number' },
            ],
        }),
    ],
    [
        'DataTable range filter, own choices, filter toggle, status bar',
        el('DataTable', {
            data: fleet,
            caption: 'Server',
            getRowId,
            columns: [
                { id: 'name', header: 'Name', filter: 'text' },
                { id: 'load', header: 'Load', align: 'end', filter: 'number', filterMatchMode: 'between' },
                {
                    id: 'online',
                    header: 'Online',
                    filter: 'select',
                    format: (value: unknown) => (value ? 'Yes' : 'No'),
                    filterOptions: [
                        { value: true, label: 'Yes', group: 'Status' },
                        { value: false, label: 'No', group: 'Status' },
                    ],
                },
            ],
            filters: {
                load: { operator: 'and', constraints: [{ matchMode: 'between', value: [20, null] }] },
                online: { operator: 'and', constraints: [{ matchMode: 'equals', value: true }] },
            },
            selectable: true,
            selection: ['web-01', 'db-primary'],
            filterToggle: true,
            statusBar: true,
            wrapHeaders: true,
            $slots: { toolbarStart: el('strong', {}, 'Fleet'), toolbarEnd: el('span', {}, 'As of today') },
        }),
    ],
    [
        'DataTable filter reset, header for screen readers, column classes, filter input settings',
        el('DataTable', {
            data: fleet,
            caption: 'Server',
            getRowId,
            columns: [
                {
                    id: 'name',
                    header: 'Name',
                    filter: 'text',
                    headerClass: 'w-40',
                    cellClass: 'font-semibold',
                    filterInputProps: { placeholder: 'Hostname …' },
                },
                {
                    id: 'location',
                    header: 'Location',
                    filter: 'multiSelect',
                    filterOptions: [
                        { value: 'Frankfurt', label: 'Frankfurt', keywords: ['Hesse'] },
                        { value: 'Nuremberg', label: 'Nuremberg', keywords: ['Bavaria'] },
                    ],
                    filterInputProps: { filter: true, maxShown: 1, clearable: true, placeholder: 'Any location' },
                },
                {
                    id: 'load',
                    header: 'Load',
                    align: 'end',
                    cellClass: (row: { load: number }) => (row.load > 50 ? 'text-danger' : undefined),
                },
                { id: 'actions', header: 'Actions', headerHidden: true, accessor: () => '' },
            ],
            filters: { name: 'o' },
            filterReset: true,
            filterToggle: true,
            search: true,
        }),
    ],
    [
        'DataTable grid navigation, row links, vertical headers',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns.slice(0, 3),
            caption: 'Server',
            getRowId,
            navigation: 'grid',
            selectable: true,
            selection: ['k8s-node-3'],
            rowHref: (row: { id: string }) => `/server/${row.id}`,
            verticalHeaders: true,
            filterDisplay: 'menu',
        }),
    ],
    [
        'DataTable skeleton loading',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns.slice(0, 3),
            caption: 'Server',
            getRowId,
            selectable: true,
            loading: true,
            loadingVariant: 'skeleton',
        }),
    ],
    [
        'DataTable no results, filters hidden',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns,
            caption: 'Server',
            getRowId,
            globalFilter: 'nothing',
            noResultsText: 'No matches for this search',
            showFilters: false,
        }),
    ],
    [
        'DataTable select all across pages',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns.slice(0, 3),
            caption: 'Server',
            getRowId,
            manual: true,
            rowCount: 30,
            pageSize: 3,
            first: 3,
            selectable: true,
            selectAllMode: 'all',
            allSelection: { mode: 'all', except: ['db-primary'] },
        }),
    ],
    [
        'DataTable cell selection, batch editing, find, export formats',
        el('DataTable', {
            data: fleet,
            columns: [
                { id: 'name', header: 'Name', editable: true },
                { id: 'load', header: 'Load', align: 'end', editable: true, editor: 'number' },
                { id: 'since', header: 'In service since', filter: 'date' },
            ],
            caption: 'Server',
            getRowId,
            navigation: 'grid',
            cellSelection: true,
            editMode: 'batch',
            find: true,
            exportFilename: 'server',
            exportFormats: ['csv', 'xlsx'],
        }),
    ],
    [
        'DataTable cell selection without grid navigation',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns.slice(0, 3),
            caption: 'Server',
            getRowId,
            cellSelection: true,
            selectable: true,
        }),
    ],
    [
        'DataTable merged cells',
        el('DataTable', {
            data: fleet,
            columns: [
                { id: 'location', header: 'Location', rowSpan: 'auto' },
                {
                    id: 'name',
                    header: 'Name',
                    colSpan: (row: { id: string }) => (row.id === 'k8s-node-3' ? 2 : 1),
                },
                { id: 'load', header: 'Load', align: 'end' },
            ],
            caption: 'Server',
            getRowId,
            defaultSorting: { id: 'location', desc: false },
        }),
    ],
    [
        'DataTable pivot',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns,
            caption: 'Load by location',
            pivot: {
                rows: ['location'],
                columns: ['online'],
                values: [
                    { id: 'load', aggregate: 'sum' },
                    { id: 'load', aggregate: 'count', header: 'Count' },
                ],
            },
        }),
    ],
    [
        'DataTable reorder in groups and a tree',
        el('DataTable', {
            data: [
                { id: 'a', name: 'Projects', children: [{ id: 'a1', name: 'WireLayer' }] },
                { id: 'b', name: 'Notes' },
            ],
            columns: [{ id: 'name', header: 'Name' }],
            caption: 'Files',
            getRowId,
            getSubRows: (row: { children?: object[] }) => row.children,
            defaultExpanded: ['a'],
            reorderableRows: true,
        }),
    ],
    [
        'DataTable grouped rows to move',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns.slice(0, 3),
            caption: 'Server',
            getRowId,
            groupBy: 'location',
            reorderableRows: true,
        }),
    ],
    [
        'Chart bar',
        el('Chart', {
            type: 'bar',
            title: 'Revenue per quarter',
            data: {
                labels: ['Q1', 'Q2'],
                datasets: [
                    { label: '2025', data: [1820.5, 2040] },
                    { label: '2026', data: [2150, null] },
                ],
            },
        }),
    ],
    [
        'Chart doughnut, hidden title, no table',
        el('Chart', {
            type: 'doughnut',
            title: 'Tickets',
            hideTitle: true,
            table: false,
            height: '12rem',
            data: { labels: ['Open', 'Done'], datasets: [{ data: [3, 9] }] },
        }),
    ],
    [
        'Editor',
        el(
            'Field',
            { label: 'Description', helperText: 'With formatting', required: true },
            el('Editor', {
                defaultValue:
                    '<h2>Title</h2><p>A <strong>bold</strong> and <a href="https://wirecore.de">linked</a> text.</p><ul><li><p>Item</p></li></ul>',
            })
        ),
    ],
    [
        'Editor disabled, few tools',
        el('Editor', {
            'aria-label': 'Note',
            disabled: true,
            invalid: true,
            defaultValue: '<p>Locked</p>',
            toolbar: ['bold', 'italic', '|', 'link'],
        }),
    ],
    ['VirtualSelect', el('VirtualSelect', { items: manyItems, 'aria-label': 'Item', defaultValue: 'item-7' })],
    [
        'VirtualSelect clearable sm loading',
        el('VirtualSelect', {
            items: manyItems,
            'aria-label': 'Item',
            defaultValue: 'item-7',
            clearable: true,
            size: 'sm',
            loading: true,
            filter: true,
        }),
    ],

    ...['neutral', 'success', 'info', 'warn', 'danger'].map((status): [string, El] => [
        `StatusDot ${status}`,
        el('StatusDot', { status }, 'ONLINE'),
    ]),
    ['StatusDot pulse', el('StatusDot', { status: 'success', pulse: true }, 'ONLINE')],
    ...['neutral', 'success', 'warn', 'danger'].map((status): [string, El] => [
        `StatusDot ${status} icon`,
        el('StatusDot', { status, icon: true }, status.toUpperCase()),
    ]),
    ['StatusDot own icon', el('StatusDot', { status: 'info', icon: icon('Mail') }, 'NEW MAIL')],

    [
        'Breadcrumb',
        el(
            'Breadcrumb',
            {},
            el('BreadcrumbItem', { href: '/', icon: icon('House'), iconOnly: true }, 'Home'),
            el('BreadcrumbItem', { href: '/services' }, 'Services'),
            el('BreadcrumbItem', { current: true }, 'Hosting')
        ),
    ],
    [
        'Breadcrumb items, collapsed',
        el('Breadcrumb', {
            maxItems: 3,
            items: [
                { label: 'Start', href: '/' },
                { label: 'Services', href: '/services' },
                { label: 'Hosting', href: '/services/hosting' },
                { label: 'Managed', href: '/services/hosting/managed' },
                { label: 'Pricing', current: true },
            ],
        }),
    ],
    [
        'Breadcrumb items, not collapsed',
        el('Breadcrumb', {
            maxItems: 4,
            itemsBeforeCollapse: 2,
            items: [
                { label: 'Start', href: '/', icon: icon('House'), iconOnly: true },
                { label: 'Services', href: '/services' },
                { label: 'Pricing', current: true },
            ],
        }),
    ],
    [
        'en-US Breadcrumb collapsed',
        inLocale(
            'en-US',
            el('Breadcrumb', {
                maxItems: 2,
                items: [
                    { label: 'Home', href: '/' },
                    { label: 'A', href: '/a' },
                    { label: 'B', current: true },
                ],
            })
        ),
    ],
    [
        'Breadcrumb asChild + label',
        el(
            'Breadcrumb',
            { label: 'Page path' },
            el('BreadcrumbItem', { asChild: true }, el('a', { href: '/customers' }, 'Customers')),
            el('BreadcrumbItem', { href: '/customers/42', current: true }, 'Example Inc.')
        ),
    ],

    ...badgeVariants.map((variant): [string, El] => [`Badge ${variant}`, el('Badge', { variant }, 'NEW')]),
    ['Badge icon', el('Badge', { variant: 'success', icon: icon('Check') }, 'Active')],
    ['Badge circle', el('Badge', { variant: 'solid', circle: true }, '4')],
    ['Badge circle 2 digits', el('Badge', { variant: 'danger', circle: true }, '12')],

    ...sizes.map((size): [string, El] => [`Spinner ${size}`, el('Spinner', { size })]),
    ['Spinner label', el('Spinner', { label: 'Loading servers' })],

    ['Card', el('Card', {}, el('h3', {}, 'Software & Web'))],
    ['Card interactive asChild', el('Card', { interactive: true, asChild: true }, el('a', { href: '#' }, 'Hosting'))],
    [
        'Card title, media, header and footer',
        el(
            'Card',
            {
                title: 'Hosting',
                subtitle: 'Data centers in Germany',
                $slots: {
                    media: el('img', { src: '/data-center.jpg', alt: 'Server room' }),
                    header: el('Badge', {}, 'NEW'),
                    footer: el('Button', { size: 'sm' }, 'Enquire'),
                },
            },
            el('p', {}, 'Operations around the clock.')
        ),
    ],
    ['Card horizontal h2', el('Card', { title: 'Maintenance', titleTag: 'h2', orientation: 'horizontal' }, 'Content')],
    ['Card title only', el('Card', { title: 'Title only' })],
    ['Card horizontal, plain content', el('Card', { orientation: 'horizontal' }, 'Left', 'Right')],

    ...statuses.map((status): [string, El] => [
        `Alert ${status}`,
        el('Alert', { status, title: 'Deployment' }, 'customer-portal · v2.4.1'),
    ]),
    ['Alert dismissible', el('Alert', { title: 'Note', dismissible: true, dismissLabel: 'Hide' })],
    ['Alert neutral', el('Alert', { status: 'neutral', title: 'Draft' }, 'Not published yet')],
    ['Alert simple danger', el('Alert', { variant: 'simple', status: 'danger' }, 'Please enter a valid email')],
    ['Alert simple success sm', el('Alert', { variant: 'simple', status: 'success', size: 'sm', title: 'Saved' })],
    ['Alert sm, duration', el('Alert', { size: 'sm', title: 'Copied', duration: 5000, dismissible: true })],

    ['Input', el('Input', { 'aria-label': 'Name', placeholder: 'John Doe' })],
    ...sizes.map((size): [string, El] => [`Input ${size}`, el('Input', { 'aria-label': 'Name', size })]),
    ['Input icon', el('Input', { 'aria-label': 'Email', leadingIcon: icon('Mail'), type: 'email' })],
    ['Input invalid', el('Input', { 'aria-label': 'Email', leadingIcon: icon('Mail'), invalid: true })],
    [
        'Input prefix suffix',
        el('Input', { 'aria-label': 'Domain', prefix: 'https://', suffix: '.de', placeholder: 'customer-portal' }),
    ],
    ['Input disabled', el('Input', { 'aria-label': 'Company', disabled: true, placeholder: '—' })],
    ['Input success', el('Input', { 'aria-label': 'Username', success: true })],
    ['Input loading', el('Input', { 'aria-label': 'Domain', loading: true, size: 'sm' })],
    ['Input clearable empty', el('Input', { 'aria-label': 'Search', clearable: true })],
    ['Input clearable lg', el('Input', { 'aria-label': 'Search', clearable: true, size: 'lg' })],
    [
        'Input clearable disabled, invalid',
        el('Input', {
            'aria-label': 'Search',
            clearable: true,
            disabled: true,
            invalid: true,
        }),
    ],

    ['Textarea', el('Textarea', { 'aria-label': 'Message', rows: 3, placeholder: 'Your message' })],
    ['Textarea invalid disabled', el('Textarea', { 'aria-label': 'Message', invalid: true, disabled: true })],
    ...['sm', 'lg'].map((size): [string, El] => [
        `Textarea ${size}`,
        el('Textarea', { 'aria-label': 'Message', size }),
    ]),
    ['Textarea success', el('Textarea', { 'aria-label': 'Message', success: true })],
    [
        'Textarea counter',
        el('Field', { label: 'Message' }, el('Textarea', { showCount: true, maxLength: 200, defaultValue: 'Hello' })),
    ],
    [
        'Textarea loading, clearable, autoResize rows',
        el('Textarea', {
            'aria-label': 'Note',
            loading: true,
            clearable: true,
            autoResize: true,
            minRows: 2,
            maxRows: 6,
            defaultValue: 'Text',
        }),
    ],

    ['Field', el('Field', { label: 'Name', helperText: 'First and last name' }, el('Input', { placeholder: 'Max' }))],
    ['Field required', el('Field', { label: 'Name', required: true }, el('Input', {}))],
    [
        'Field error',
        el(
            'Field',
            { label: 'Email', error: 'Please enter a valid address.' },
            el('Input', { leadingIcon: icon('Mail') })
        ),
    ],
    ['Field disabled textarea', el('Field', { label: 'Message', disabled: true }, el('Textarea', {}))],
    [
        'Field success, optional',
        el('Field', { label: 'Username', success: 'Is still available', optional: true }, el('Input', {})),
    ],
    [
        'Field success with helper text',
        el(
            'Field',
            {
                label: 'Username',
                helperText: 'Lowercase letters only',
                success: 'Is still available',
                optionalText: 'voluntary',
                optional: true,
            },
            el('Input', {})
        ),
    ],
    [
        'Field success ignored when invalid',
        el('Field', { label: 'Email', success: 'Ok', error: 'Invalid' }, el('Input', {})),
    ],
    ['Field optional and required', el('Field', { label: 'Name', optional: true, required: true }, el('Input', {}))],
    [
        'FormErrorSummary',
        el('FormErrorSummary', {
            autoFocus: false,
            errors: [{ message: 'Please enter the name', id: 'name' }, { message: 'Please agree' }],
        }),
    ],
    ['FormErrorSummary empty', el('FormErrorSummary', { errors: [] })],
    [
        'FormErrorSummary own title h3',
        el('FormErrorSummary', {
            autoFocus: false,
            title: 'Errors',
            titleTag: 'h3',
            errors: [{ message: 'Required field' }],
        }),
    ],
    [
        'en-US FormErrorSummary',
        inLocale('en-US', el('FormErrorSummary', { autoFocus: false, errors: [{ message: 'Required' }] })),
    ],
    [
        'en-US Field optional, clearable',
        inLocale('en-US', el('Field', { label: 'Name', optional: true }, el('Input', { clearable: true }))),
    ],

    [
        'EmptyState',
        el('EmptyState', {
            title: 'No servers yet',
            description: 'Create your first server.',
            icon: icon('Plus'),
            variant: 'dashed',
            headingLevel: 2,
            $slots: { actions: el('Button', {}, 'Create server') },
        }),
    ],
    ['EmptyState small', el('EmptyState', { title: 'No matches', size: 'sm' })],
    ...(['week', 'day', 'month', 'agenda'] as const).map((view): [string, El] => [
        `Scheduler ${view}`,
        el('Scheduler', {
            defaultDate: '2027-03-16',
            defaultView: view,
            editable: true,
            events: [
                { id: 'a', title: 'Planning', start: '2027-03-16T09:00', end: '2027-03-16T10:30' },
                { id: 'b', title: 'Review', start: '2027-03-16T10:00', end: '2027-03-16T11:00', tone: 'success' },
                { id: 'c', title: 'Trade fair', start: '2027-03-17', end: '2027-03-18', allDay: true, tone: 'warn' },
            ],
        }),
    ]),
    ...(
        [
            ['Scheduler resources by date', { defaultView: 'week', editable: true }],
            ['Scheduler resources by resource, hours', { defaultView: 'day', groupBy: 'resource', businessHours }],
            ['Scheduler timeline week', { defaultView: 'timeline', editable: true, businessHours }],
            [
                'Scheduler timeline day',
                { defaultView: 'timeline', defaultTimelineRange: 'day', startScrollTime: '08:00' },
            ],
            [
                'Scheduler timeline month, zoomed',
                { defaultView: 'timeline', defaultTimelineRange: 'month', defaultZoom: 0.5 },
            ],
            ['Scheduler month filtered by resource', { defaultView: 'month', defaultResourceFilter: 'anna' }],
            ['Scheduler read-only', { defaultView: 'week', readOnly: true }],
            ['Scheduler resources paged', { defaultView: 'week', resourcesPerPage: 1 }],
        ] as const
    ).map(([name, props]): [string, El] => [
        name,
        el('Scheduler', {
            defaultDate: '2027-03-16',
            events: schedulerEvents,
            resources: schedulerResources,
            ...props,
        }),
    ]),
    [
        'Scheduler series, holiday, stacked',
        el('Scheduler', {
            defaultDate: '2027-03-16',
            editable: true,
            overlapMode: 'stack',
            hideWeekends: true,
            events: [
                ...schedulerEvents,
                {
                    id: 'jf',
                    title: 'Weekly sync',
                    start: '2027-03-15T09:00',
                    end: '2027-03-15T09:30',
                    rrule: 'FREQ=WEEKLY;BYDAY=MO,WE',
                },
                {
                    id: 'hol',
                    title: 'Holiday',
                    start: '2027-03-19',
                    end: '2027-03-19',
                    allDay: true,
                    background: true,
                },
            ],
        }),
    ],
    ...(['month', 'agenda', 'year'] as const).map((view): [string, El] => [
        `Scheduler series ${view}`,
        el('Scheduler', {
            defaultDate: '2027-03-16',
            defaultView: view,
            views: ['day', 'week', 'month', 'agenda', 'timeline', 'year'],
            monthEventLimit: 1,
            morePopover: true,
            hideWeekends: view === 'month',
            events: [
                ...schedulerEvents,
                {
                    id: 'jf',
                    title: 'Weekly sync',
                    start: '2027-03-01T09:00',
                    end: '2027-03-01T09:30',
                    rrule: 'FREQ=MONTHLY;BYDAY=1MO,3TU',
                },
                {
                    id: 'hol',
                    title: 'Holiday',
                    start: '2027-03-19',
                    end: '2027-03-19',
                    allDay: true,
                    background: true,
                },
            ],
        }),
    ]),
    [
        'Scheduler time zone',
        el('Scheduler', {
            defaultDate: '2027-03-16',
            timeZone: 'America/New_York',
            events: [{ id: 'z', title: 'Call', start: '2027-03-16T15:00Z', end: '2027-03-16T16:00Z' }],
        }),
    ],
    [
        'en-US Scheduler timeline',
        inLocale(
            'en-US',
            el('Scheduler', {
                defaultDate: '2027-03-16',
                defaultView: 'timeline',
                events: schedulerEvents,
                resources: schedulerResources,
            })
        ),
    ],
    ['Gantt', el('Gantt', { tasks: ganttTasks, today: '2027-03-17' })],
    ['Gantt loading', el('Gantt', { tasks: [], loading: true, today: '2027-03-17' })],
    [
        'Gantt editable, critical path, linkable',
        el('Gantt', { tasks: ganttTasks, editable: true, linkable: true, showCriticalPath: true, title: 'Relaunch' }),
    ],
    ['Gantt collapsed, months', el('Gantt', { tasks: ganttTasks, defaultExpanded: [], defaultZoom: 'month' })],
    ['Gantt days and quarters', el('Gantt', { tasks: ganttTasks, defaultZoom: 'day', zooms: ['day', 'quarter'] })],
    ['Gantt empty', el('Gantt', { tasks: [], zooms: ['week'] })],
    ['en-US Gantt', inLocale('en-US', el('Gantt', { tasks: ganttTasks, showCriticalPath: true }))],
    [
        'CodeHighlight',
        el('CodeHighlight', {
            code: 'npm install @wirecore/wirelayer-vue\n\nnpm run dev',
            title: 'Terminal',
            lineNumbers: true,
            highlightLines: [3],
        }),
    ],
    ['CodeHighlight plain', el('CodeHighlight', { code: 'Hello', copyable: false })],
    [
        'Compare',
        el('Compare', {
            before: { src: '/before.jpg', alt: 'Before' },
            after: { src: '/after.jpg', alt: 'After' },
            defaultValue: 30,
            beforeLabel: 'Old',
        }),
    ],
    [
        'he-IL Compare',
        inLocale(
            'he-IL',
            el('Compare', { before: { src: '/a.jpg', alt: 'Before' }, after: { src: '/b.jpg', alt: 'After' } })
        ),
    ],
    [
        'Gauge',
        el('Gauge', {
            value: 82,
            label: 'CPU load',
            thresholds: [
                { from: 70, status: 'warn' },
                { from: 90, status: 'danger' },
            ],
            formatOptions: { style: 'unit', unit: 'percent' },
        }),
    ],
    [
        'Gauge small',
        el('Gauge', { value: 1200, min: 0, max: 5000, label: 'Memory (MB)', size: 'sm', status: 'success' }),
    ],
    [
        'Heatmap',
        el('Heatmap', {
            caption: 'Requests per day',
            rows: ['Frankfurt', 'Vienna'],
            columns: ['Mon', 'Tue', 'Wed'],
            values: [
                [12, 40, null],
                [3, 0, 25],
            ],
        }),
    ],
    [
        'Heatmap without values',
        el('Heatmap', {
            caption: 'Errors',
            rows: ['web-01'],
            columns: ['8 am', '12 pm'],
            values: [[1, 7]],
            showValues: false,
            legend: false,
        }),
    ],
    [
        'Treemap',
        el('Treemap', {
            label: 'Storage by project',
            showTitle: true,
            items: [
                { label: 'Customer portal', value: 420 },
                { label: 'Intranet', value: 180, tone: 'success' },
                { label: 'Archive', value: 90 },
            ],
        }),
    ],
    [
        'Sankey',
        el('Sankey', {
            title: 'Visitor flow',
            nodes: [
                { id: 'search', label: 'Search' },
                { id: 'ads', label: 'Ads' },
                { id: 'shop', label: 'Shop' },
                { id: 'order', label: 'Order' },
            ],
            links: [
                { source: 'search', target: 'shop', value: 60 },
                { source: 'ads', target: 'shop', value: 30 },
                { source: 'shop', target: 'order', value: 20 },
            ],
        }),
    ],
    [
        'RecipesProvider and classes',
        el(
            'RecipesProvider',
            { recipes: { button: { defaultVariants: { size: 'sm' }, classes: { base: 'tracking-wide' } } } },
            el('Button', { classes: { icon: 'size-5' }, leadingIcon: icon('Plus') }, 'New'),
            el('Card', { classes: { base: 'p-8' } }, 'Content')
        ),
    ],
    [
        'DataList horizontal divided',
        el(
            'DataList',
            { orientation: 'horizontal', divided: true },
            el('DataListItem', { label: 'Server' }, 'web-01'),
            el('DataListItem', { label: 'Status' }, el('Badge', { variant: 'success' }, 'Online'))
        ),
    ],
    ['DataList', el('DataList', {}, el('DataListItem', { label: 'Customer' }, 'North Utilities'))],
    [
        'ActionBar',
        el(
            'ActionBar',
            { count: 2, placement: 'inline' },
            el('Button', { variant: 'text', size: 'sm' }, 'Archive'),
            el('Button', { variant: 'text', size: 'sm' }, 'Delete')
        ),
    ],
    ['ActionBar hidden', el('div', {}, el('ActionBar', { count: 0 }))],
    ['Countdown ended', el('Countdown', { target: '2020-01-01T00:00:00', label: 'Offer ends in' })],
    [
        'Countdown hours plain',
        el('Countdown', {
            target: 0,
            label: 'Start in',
            units: ['hours', 'minutes'],
            variant: 'plain',
            size: 'lg',
        }),
    ],
    [
        'NumberFormatter',
        el(
            'p',
            {},
            el('NumberFormatter', { value: 1234.5, formatOptions: { style: 'currency', currency: 'EUR' } }),
            ' · ',
            el('NumberFormatter', { value: null })
        ),
    ],
    [
        'Autocomplete',
        el(
            'Field',
            { label: 'Department' },
            el('Autocomplete', {
                items: ['Purchasing', 'Sales'],
                defaultValue: 'Sales',
                placeholder: 'e.g. Sales',
            })
        ),
    ],
    ['Autocomplete disabled', el('Autocomplete', { items: [], 'aria-label': 'Department', disabled: true })],
    [
        'Autocomplete clearable loading lg',
        el('Autocomplete', {
            items: [{ label: 'Purchasing', group: 'Administration' }],
            defaultValue: 'Sales',
            clearable: true,
            loading: true,
            size: 'lg',
            'aria-label': 'Department',
        }),
    ],
    [
        'Autocomplete multiple',
        el(
            'Field',
            { label: 'Departments' },
            el('Autocomplete', { items: ['Purchasing', 'Sales'], multiple: true, defaultValues: ['Purchasing'] })
        ),
    ],
    ['YearPicker', el('Field', { label: 'Fiscal year' }, el('YearPicker', { defaultValue: '2026', min: '2020' }))],

    ['en-US Select', inLocale('en-US', el('Select', { items: selectItems, 'aria-label': 'Service' }))],
    ['en-US MultiSelect', inLocale('en-US', el('MultiSelect', { items: selectItems, 'aria-label': 'Services' }))],
    ['en-US Pagination', inLocale('en-US', el('Pagination', { count: 200, pageSize: 10, defaultPage: 10 }))],
    ['en-US NumberInput', inLocale('en-US', el('NumberInput', { defaultValue: 1234.5, 'aria-label': 'Budget' }))],
    ['en-US PasswordInput', inLocale('en-US', el('PasswordInput', { 'aria-label': 'Password' }))],
    ['en-US Slider range', inLocale('en-US', el('Slider', { label: 'Price', defaultValue: [20, 80] }))],
    ['en-US Alert dismissible', inLocale('en-US', el('Alert', { title: 'Note', dismissible: true }))],
    ['en-US Spinner', inLocale('en-US', el('Spinner', {}))],
    ['en-US FileUpload', inLocale('en-US', el('FileUpload', { label: 'Images', maxFiles: 5 }))],
    [
        'en-US DataView empty',
        inLocale('en-US', el('DataView', { items: [], label: 'Servers', layoutToggle: false, children: () => null })),
    ],
    [
        'en-US DatePicker',
        inLocale('en-US', el('Field', { label: 'Date' }, el('DatePicker', { defaultValue: '2026-10-20' }))),
    ],
    [
        'en-US DateRangePicker',
        inLocale(
            'en-US',
            el(
                'Field',
                { label: 'Vacation' },
                el('DateRangePicker', { defaultValue: { start: '2026-10-20', end: '2026-10-24' } })
            )
        ),
    ],
    ['en-US TimePicker', inLocale('en-US', el('TimePicker', { defaultValue: '14:30', 'aria-label': 'Start' }))],
    ['en-US Calendar', inLocale('en-US', el('Calendar', { defaultValue: ['2026-10-20'] }))],
    ['en-US DurationInput', inLocale('en-US', el('DurationInput', { defaultValue: 61, 'aria-label': 'Duration' }))],
    [
        'en-US TimeGrid',
        inLocale('en-US', el('TimeGrid', { start: '11:00', end: '13:00', interval: 60, defaultValue: '12:00' })),
    ],
    [
        'en-US QuarterPicker',
        inLocale('en-US', el('QuarterPicker', { defaultValue: '2026-Q1', 'aria-label': 'Quarter' })),
    ],
    ['en-US Countdown', inLocale('en-US', el('Countdown', { target: 0, label: 'Ends in' }))],
    [
        'en-US DataTable menu filters',
        inLocale(
            'en-US',
            el('DataTable', {
                data: fleet,
                columns: fleetColumns,
                caption: 'Servers',
                getRowId,
                filterDisplay: 'menu',
                columnMenu: true,
                rowNumbers: true,
            })
        ),
    ],
    ['en-US NumberFormatter', inLocale('en-US', el('NumberFormatter', { value: 1234.5 }))],
    ['en-US ActionBar', inLocale('en-US', el('ActionBar', { count: 1, placement: 'inline' }))],
    ['he-IL Slider range', inLocale('he-IL', el('Slider', { label: 'Price', defaultValue: [20, 80] }))],
    ['he-IL Tabs', inLocale('he-IL', tabsExample())],
    [
        'he-IL DatePicker',
        inLocale('he-IL', el('Field', { label: 'Date' }, el('DatePicker', { defaultValue: '2026-10-20' }))),
    ],
    [
        'Statistic',
        el('Statistic', {
            label: 'Revenue',
            value: 12400,
            formatOptions: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
            trend: 12,
            trendLabel: 'vs. previous month',
            icon: icon('Bell'),
            bordered: true,
        }),
    ],
    [
        'Statistic inverted trend, unit, prefix and suffix',
        el('Statistic', {
            label: 'Error rate',
            value: 2.5,
            unit: 'percent',
            trend: -0.8,
            invertTrend: true,
            prefix: '≈',
            suffix: 'of requests',
            size: 'sm',
            description: 'Last 24 hours',
        }),
    ],
    [
        'Statistic loading, chart',
        el('Statistic', { label: 'Users', loading: true, size: 'lg', $slots: { chart: el('span', {}, 'History') } }),
    ],
    ['Statistic animated, live', el('Statistic', { label: 'Active sessions', value: 1280, animate: true, live: true })],
    ['Truncate', el('Truncate', { text: longText })],
    ['Truncate lines, no tooltip', el('Truncate', { text: longText, lines: 2, tooltip: false, as: 'p' })],
    ['Truncate expandable', el('Truncate', { text: longText, lines: 3, expandable: true, as: 'p' })],
    [
        'OverflowList maxVisible',
        el('OverflowList', { items: techItems, maxVisible: 3, label: 'Technologies', $scoped: badgeItem }),
    ],
    [
        'OverflowList from the start, rows',
        el('OverflowList', {
            items: techItems,
            maxVisible: 2,
            maxRows: 2,
            collapseFrom: 'start',
            label: 'Technologies',
            $scoped: badgeItem,
        }),
    ],
    ['OverflowList all fit', el('OverflowList', { items: techItems.slice(0, 2), $scoped: badgeItem })],
    ['Toggletip', el('Toggletip', { content: 'Printed at the top right of every invoice.', label: 'VAT ID' })],
    ['Toggletip open', el('Toggletip', { content: 'Printed at the top right of every invoice.', open: true })],
    [
        'Field labelHelp',
        el(
            'Field',
            { label: 'VAT ID', labelHelp: 'Printed at the top right of every invoice.', required: true },
            el('Input', {})
        ),
    ],
    [
        'CheckboxGroup',
        el(
            'CheckboxGroup',
            { label: 'Notifications', helperText: 'Several allowed', defaultValue: ['mail'], name: 'notify' },
            el('Checkbox', { value: 'mail' }, 'Email'),
            el('Checkbox', { value: 'sms' }, 'SMS')
        ),
    ],
    [
        'CheckboxGroup max, error, horizontal',
        el(
            'CheckboxGroup',
            {
                label: 'Channels',
                max: 1,
                error: 'Please choose one at most',
                orientation: 'horizontal',
                required: true,
                defaultValue: ['mail'],
            },
            el('Checkbox', { value: 'mail' }, 'Email'),
            el('Checkbox', { value: 'sms' }, 'SMS')
        ),
    ],
    [
        'CheckboxCard grid',
        el(
            'CheckboxGroup',
            { label: 'Modules', columns: 2, defaultValue: ['backup'] },
            el('CheckboxCard', {
                value: 'backup',
                title: 'Backup',
                description: 'Daily, kept for 30 days',
                price: '€9 / month',
                icon: icon('Check'),
            }),
            el('CheckboxCard', { value: 'monitoring', title: 'Monitoring', disabled: true })
        ),
    ],
    ['CheckboxCard alone', el('CheckboxCard', { title: 'Accept terms', description: 'Version 2026', name: 'terms' })],
    [
        'RadioCard grid',
        el(
            'RadioGroup',
            { label: 'Plan', columns: 3, defaultValue: 'pro' },
            el('RadioCard', { value: 'basic', title: 'Basic', price: '€0' }),
            el('RadioCard', {
                value: 'pro',
                title: 'Pro',
                description: 'For teams',
                price: '€29',
                icon: icon('House'),
            }),
            el('RadioCard', { value: 'enterprise', title: 'Enterprise', disabled: true })
        ),
    ],
    [
        'SwitchGroup',
        el(
            'SwitchGroup',
            { label: 'Channels', defaultValue: ['mail', 'push'], max: 2, helperText: 'Two at most' },
            el('Switch', { value: 'mail' }, 'Email'),
            el('Switch', { value: 'push' }, 'Push'),
            el('Switch', { value: 'sms' }, 'SMS')
        ),
    ],
    ['VisuallyHidden', el('p', {}, 'Visible ', el('VisuallyHidden', {}, 'screen readers only'))],
    [
        'VisuallyHidden focusable',
        el('VisuallyHidden', { as: 'a', href: '#content', focusable: true }, 'To the content'),
    ],
    ['LiveAnnouncer', el('LiveAnnouncer', {}, el('p', {}, 'Content'))],
    ['LandmarkNavigation', el('LandmarkNavigation', {}, el('p', {}, 'Content'))],
    [
        'SkipLinks',
        el('SkipLinks', {
            links: [
                { href: '#content', label: 'Skip to content' },
                { href: '#search', label: 'Skip to search' },
            ],
        }),
    ],
    ['AppShell skip links', el('AppShell', { skipLinks: [{ href: '#search', label: 'Skip to search' }] }, 'Content')],
    ['Kbd hotkey', el('p', {}, el('Kbd', { hotkey: 'mod+shift+k' }), ' ', el('Kbd', { hotkey: 'g i' }))],
    ['HotkeysDialog closed', el('div', {}, el('HotkeysDialog', { hotkey: false }))],
    [
        'Format components',
        el(
            'p',
            {},
            el('FormatRelativeTime', { value: '2026-10-21T09:57:00Z', now: '2026-10-21T10:00:00Z' }),
            ' · ',
            el('FormatRelativeTime', { value: '2026-10-20', now: '2026-10-21T10:00:00Z', showTitle: false }),
            ' · ',
            el('FormatDate', { value: '2026-10-21', timeZone: 'Europe/Berlin' }),
            ' · ',
            el('FormatDateTime', { value: '2026-10-21T12:30:00Z', timeZone: 'Europe/Berlin' }),
            ' · ',
            el('FormatBytes', { value: 1_234_567 }),
            ' · ',
            el('FormatBytes', { value: 1_234_567, base: 'binary' }),
            ' · ',
            el('FormatList', { items: ['Anna', 'Ben', 'Clara'] }),
            ' · ',
            el('FormatList', { items: ['Mail', 'SMS'], type: 'disjunction' }),
            ' · ',
            el('FormatNumber', { value: 0.42, formatOptions: { style: 'percent' } })
        ),
    ],
    [
        'en-US Format components',
        inLocale(
            'en-US',
            el(
                'p',
                {},
                el('FormatRelativeTime', { value: '2026-10-22T10:00:00Z', now: '2026-10-21T10:00:00Z' }),
                ' · ',
                el('FormatDate', { value: '2026-10-21', formatOptions: { dateStyle: 'long' }, timeZone: 'UTC' }),
                ' · ',
                el('FormatBytes', { value: 2048, unitDisplay: 'long' }),
                ' · ',
                el('FormatList', { items: ['Anna', 'Ben', 'Clara'] })
            )
        ),
    ],
    ['Persona', el('Persona', { name: 'Anna Berg', description: 'Project lead', presence: 'online' })],
    ['Persona link, large', el('Persona', { name: 'Ben Ott', href: '/team/ben', size: 'lg', presence: 'away' })],
    [
        'Persona button, small',
        el('Persona', { name: 'Clara Weiß', description: 'Design', as: 'button', size: 'sm', presence: 'busy' }),
    ],
    ['InlineEdit', el('InlineEdit', { label: 'Project name', defaultValue: 'Customer portal' })],
    ['InlineEdit empty, popover', el('InlineEdit', { label: 'Description', mode: 'popover', placeholder: 'None' })],
    ['InlineEdit editing', el('InlineEdit', { label: 'Project name', defaultValue: 'Customer portal', editing: true })],
    ['SearchField', el('SearchField', { defaultValue: 'web-01', loading: true })],
    [
        'SearchField scopes',
        el('SearchField', {
            label: 'Search customers',
            scopes: [
                { value: 'all', label: 'All' },
                { value: 'name', label: 'Name' },
            ],
            scope: 'all',
            size: 'sm',
        }),
    ],
    ['SearchField suggestions', el('SearchField', { suggestions: ['web-01', 'db-primary'] })],
    ['FilterChips', el('FilterChips', { filters: activeFilters })],
    ['FilterChips without reset', el('FilterChips', { filters: activeFilters.slice(0, 1), resetLabel: false })],
    ['FilterPanel open', el('FilterPanel', { filters: activeFilters, defaultOpen: true }, el('p', {}, 'Form'))],
    ['FilterPanel drawer, no filters', el('FilterPanel', { display: 'drawer', label: 'Refine search' })],
    ['ConditionBuilder', el('ConditionBuilder', { fields: conditionFields, defaultValue: conditionTree })],
    [
        'ConditionBuilder negatable, negated group',
        el('ConditionBuilder', {
            fields: conditionFields,
            negatable: true,
            defaultValue: { ...conditionTree, children: [{ ...conditionTree.children[2], not: true }] },
        }),
    ],
    [
        'ConditionBuilder empty, disabled',
        el('ConditionBuilder', { fields: conditionFields, disabled: true, maxDepth: 0, label: 'Rules' }),
    ],
    [
        'DataTable advanced filter',
        el('DataTable', {
            data: fleet,
            columns: fleetColumns,
            caption: 'Server',
            getRowId,
            advancedFilter: true,
            advancedFilterValue: {
                type: 'group',
                id: 'root',
                combinator: 'and',
                children: [{ type: 'rule', id: 'r1', field: 'load', operator: 'gt', value: 40 }],
            },
            $scoped: advancedFilterEditor,
        }),
    ],
    [
        'Wizard',
        el('Wizard', {
            steps: [{ label: 'Contact', description: 'Name and email' }, { label: 'Address' }],
            $slots: { summary: el('p', {}, 'All correct?') },
            $scoped: {
                step: {
                    react: 'renderStep',
                    args: (index: number) => ({ index }),
                    render: ({ index }: { index: number }) => el('p', {}, `Step ${index + 1}`),
                },
            },
        }),
    ],
    ['AiLabel', el('AiLabel', {})],
    ['AiLabel small, no explanation', el('AiLabel', { size: 'sm', explanation: false, label: 'Translated with AI' })],
    [
        'ConfigProvider',
        el(
            'ConfigProvider',
            { size: 'sm', theme: 'ocean', mode: 'dark', locale: 'en-US' },
            el('Button', {}, 'Save'),
            el('PasswordInput', { 'aria-label': 'Password' })
        ),
    ],
    ['ConfigProvider without wrapper', el('ConfigProvider', { size: 'lg' }, el('Button', {}, 'Save'))],
    ['Watermark', el('Watermark', { text: 'Confidential' }, el('p', {}, 'Content'))],
    [
        'Watermark lines, angle, opacity',
        el('Watermark', { text: ['Draft', '2026'], rotate: -30, opacity: 0.2, gap: [60, 40] }, el('p', {}, 'Text')),
    ],
    ['RingProgress', el('RingProgress', { value: 72, label: 'Storage', roundCaps: true })],
    [
        'RingProgress segments',
        el('RingProgress', {
            label: 'Storage',
            size: 'lg',
            segments: [
                { value: 30, label: 'Documents' },
                { value: 20, label: 'Photos', color: 'success' },
            ],
        }),
    ],
    [
        'RingProgress hidden legend, small',
        el('RingProgress', {
            label: 'Budget',
            size: 'sm',
            legend: false,
            segments: [{ value: 60, label: 'Allocated' }],
        }),
    ],
    ['QrCode', el('QrCode', { value: 'https://wirecore.dev', showValue: true, download: true })],
    [
        'QrCode logo, size, label',
        el('QrCode', {
            value: 'https://wirecore.dev',
            logo: '/logo.svg',
            size: 120,
            errorCorrection: 'Q',
            label: 'To the website',
        }),
    ],
    ['DownloadTrigger', el('DownloadTrigger', { data: 'a;b', fileName: 'data.csv' })],
    [
        'DownloadTrigger label, size',
        el('DownloadTrigger', { url: '/report.pdf', fileName: 'report.pdf', size: 'sm' }, 'Report'),
    ],
    ['Marquee', el('Marquee', { label: 'Partner' }, el('span', {}, 'Alpha'), el('span', {}, 'Beta'))],
    [
        'Marquee fade, paused, no button',
        el('Marquee', { fade: true, paused: true, pauseButton: false, side: 'end' }, el('span', {}, 'Announcement')),
    ],
    ['AngleSlider', el('AngleSlider', { label: 'Direction', defaultValue: 45, marks: [0, 90, 180, 270] })],
    [
        'AngleSlider in Field',
        el('Field', { label: 'Angle' }, el('AngleSlider', { defaultValue: 90, showValue: false })),
    ],
    ['ColorSwatchPicker', el('ColorSwatchPicker', { items: swatchItems, defaultValue: '#1e66f5' })],
    [
        'ColorSwatchPicker labels, small',
        el('ColorSwatchPicker', { items: swatchItems, showLabels: true, size: 'sm', label: 'Accent', name: 'accent' }),
    ],
    ['JsonInput', el('Field', { label: 'Configuration' }, el('JsonInput', { defaultValue: '{"a":1}' }))],
    ['JsonInput invalid', el('JsonInput', { defaultValue: '{"a":', 'aria-label': 'JSON', formatButton: false })],
    ['JsonViewer', el('JsonViewer', { data: jsonSample, search: true })],
    [
        'JsonViewer closed, types',
        el('JsonViewer', { data: jsonSample, defaultExpandedDepth: 0, showTypes: true, copyable: false }),
    ],
    ['SignaturePad', el('SignaturePad', { name: 'signature' })],
    [
        'SignaturePad in Field, typed',
        el('Field', { label: 'Customer signature' }, el('SignaturePad', { typedAlternative: true })),
    ],
    ['ImageCropper', el('ImageCropper', { src: '/photo.jpg', aspectRatio: 1, cropShape: 'circle' })],
    ['ImageCropper without toolbar', el('ImageCropper', { src: '/photo.jpg', toolbar: false })],
    [
        'FloatingPanel trigger',
        el(
            'FloatingPanel',
            { title: 'Notes', $slots: { trigger: el('Button', {}, 'Open notes') } },
            el('p', {}, 'Text')
        ),
    ],
    [
        'Mentions',
        el('Mentions', { items: mentionPeople, defaultValue: 'Hello @[Anna Berg](anna)!', 'aria-label': 'Message' }),
    ],
    [
        'Mentions in Field, triggers',
        el(
            'Field',
            { label: 'Comment' },
            el('Mentions', {
                triggers: [
                    { char: '@', items: mentionPeople },
                    { char: '#', items: ['Release', 'Bug'] },
                ],
                placeholder: '@ or #',
                name: 'comment',
            })
        ),
    ],
    ['PhoneInput', el('Field', { label: 'Phone' }, el('PhoneInput', { defaultValue: '+4930123456' }))],
    ['PhoneInput country, name', el('PhoneInput', { defaultCountry: 'AT', name: 'phone', 'aria-label': 'Mobile' })],
    ['ColorInput', el('Field', { label: 'Colour' }, el('ColorInput', { defaultValue: '#1e66f5' }))],
    ['ColorInput oklch', el('ColorInput', { defaultValue: '#1e66f5', format: 'oklch', 'aria-label': 'Accent' })],
    [
        'ColorPicker oklch',
        el('ColorPicker', { defaultValue: 'oklch(55% 0.2 260)', format: 'oklch', 'aria-label': 'Accent' }),
    ],
    ['EmojiPicker', el('EmojiPicker', {})],
    [
        'EmojiPicker own emojis, no search',
        el('EmojiPicker', {
            search: false,
            columns: 4,
            recent: false,
            emojis: [
                { emoji: '👍', name: 'Thumbs up', category: 'people' },
                { emoji: '🎉', name: 'Confetti', category: 'activities' },
            ],
        }),
    ],
    ['Sortable', el('Sortable', { defaultValue: sortableItems, label: 'Tasks' })],
    [
        'Sortable grid, strings, disabled',
        el('Sortable', {
            defaultValue: ['A', 'B', 'C', 'D'],
            orientation: 'grid',
            columns: 2,
            disabled: true,
            'aria-label': 'Tiles',
        }),
    ],
    ['Sortable empty group', el('Sortable', { defaultValue: [], group: 'kanban', label: 'Done' })],
    ['LogViewer', el('LogViewer', { lines: logLines })],
    [
        'LogViewer plain, more',
        el('LogViewer', { lines: ['one', 'two'], search: false, lineNumbers: false, hasMore: true, label: 'Build' }),
    ],
    [
        'Progress segments',
        el('Progress', {
            value: 0,
            label: 'Storage',
            segments: [
                { value: 30, label: 'Documents', tooltip: '30 GB' },
                { value: 20, label: 'Photos', color: 'success' },
            ],
        }),
    ],
    ['Progress steps, striped', el('Progress', { value: 2, max: 4, steps: 4, label: 'Step 2 of 4', showValue: false })],
    ['Progress striped, animated', el('Progress', { value: 40, label: 'Upload', striped: true, animated: true })],
    ['Progress vertical', el('Progress', { value: 60, label: 'Fill level', orientation: 'vertical' })],
    ['Spinner value', el('Spinner', { value: 40, label: 'Export' })],
    [
        'Knob template, stroke, colour',
        el('Knob', { label: 'Level', defaultValue: 30, valueTemplate: '{value} %', strokeWidth: 12, color: 'success' }),
    ],
    [
        'MeterGroup vertical, legend start stacked',
        el('MeterGroup', {
            label: 'Storage',
            orientation: 'vertical',
            legendPosition: 'start',
            legendOrientation: 'vertical',
            items: [
                { label: 'Apps', value: 30 },
                { label: 'Photos', value: 20 },
            ],
        }),
    ],
    [
        'FileUpload button, preview, upload',
        el('FileUpload', {
            label: 'Avatar',
            variant: 'button',
            preview: true,
            hint: 'PNG or JPG',
            accept: ['image/png', 'image/jpeg'],
            upload: () => Promise.resolve(),
        }),
    ],
    [
        'Select standalone',
        el('Field', { label: 'Country' }, el('Select', { items: selectItems, standalone: true, 'aria-label': 'Area' })),
    ],

    // App patterns, chat, auth, Markdown, charts, editor and code (C10b)
    [
        'Markdown',
        el('Markdown', {
            source: [
                '# Title',
                'A **bold**, *italic* and ~~struck~~ text with `code` and a [link](https://wirecore.de "Start").',
                '',
                '- Item one',
                '- [x] Done',
                '',
                '1. First',
                '2. Second',
                '',
                '> Quote',
                '',
                '| Name | Value |',
                '| :--- | ---: |',
                '| A | 1 |',
                '',
                '```ts',
                'const a = 1;',
                '```',
                '',
                '---',
            ].join('\n'),
        }),
    ],
    [
        'Markdown hostile input, own code blocks',
        el('Markdown', {
            source: '<script>alert(1)</script> [x](javascript:alert(1)) <img src=x onerror=alert(1)>\n\n```\nplain\n```',
            headingLevel: 3,
            linkTarget: '_blank',
            $scoped: {
                code: {
                    react: 'renderCode',
                    args: (code: { code: string }) => code,
                    render: ({ code }: { code: string }) => el('pre', { 'data-own': 'true' }, code),
                },
            },
        }),
    ],
    [
        'ChatMessage incoming with attachments',
        el('ChatMessage', {
            text: 'Here is the **report**.',
            author: 'Anna Berg',
            time: '2026-10-20T09:15:00',
            attachments: [{ name: 'report.pdf', href: '/report.pdf', size: 204800 }],
        }),
    ],
    [
        'ChatMessage own, read, grouped, plain text',
        el('ChatMessage', {
            text: 'Thanks!\nSee you tomorrow',
            align: 'end',
            status: 'read',
            grouped: true,
            markdown: false,
        }),
    ],
    ['ChatMessage system', el('ChatMessage', { text: 'Ben joined', align: 'center' })],
    ['ChatMessage streaming, empty', el('ChatMessage', { author: 'Assistant', streaming: true })],
    [
        'ChatMessage streaming with extras',
        el('ChatMessage', {
            author: 'Assistant',
            text: 'The answer grows',
            streaming: true,
            $slots: {
                before: el('ChatThinking', { active: true }),
                after: el('ChatSources', { sources: [{ title: 'Handbook', href: 'https://docs.wirecore.de/start' }] }),
            },
        }),
    ],
    [
        'ChatMessages',
        el('ChatMessages', {
            now: '2026-10-21T12:00:00',
            messages: [
                { id: 1, text: 'Hello', author: 'Anna Berg', time: '2026-10-20T09:00:00' },
                { id: 2, text: 'How are you?', author: 'Anna Berg', time: '2026-10-20T09:01:00' },
                { id: 3, text: 'Good, thanks', own: true, status: 'sent', time: '2026-10-21T08:00:00' },
                { id: 4, text: 'Anna left the chat', system: true, time: '2026-10-21T08:05:00' },
            ],
        }),
    ],
    ['ChatMessages empty, more', el('ChatMessages', { messages: [], hasMore: true, label: 'Support' })],
    ['ChatPrompt', el('ChatPrompt', {})],
    [
        'ChatPrompt attachments, responding',
        el('ChatPrompt', { attachments: true, responding: true, defaultValue: 'Question', sendOn: 'mod-enter' }),
    ],
    ['ChatPrompt disabled, no hint', el('ChatPrompt', { disabled: true, hint: false, label: 'Reply' })],
    [
        'ChatSources open',
        el('ChatSources', {
            defaultOpen: true,
            linkTarget: '_blank',
            sources: [
                { title: 'Handbook', href: 'https://www.wirecore.de/handbook', description: 'Chapter 3' },
                { title: 'FAQ', href: '/faq' },
            ],
        }),
    ],
    [
        'ChatToolCall running, open',
        el('ChatToolCall', { name: 'Weather', status: 'running', input: { city: 'Hamburg' }, defaultOpen: true }),
    ],
    ['ChatToolCall error', el('ChatToolCall', { name: 'Search', status: 'error', output: 'Timeout' })],
    ['ChatThinking done', el('ChatThinking', { text: 'Check the data first.', duration: 4, defaultOpen: true })],
    [
        'Kanban',
        el('Kanban', {
            label: 'Project',
            defaultColumns: [
                { id: 'open', title: 'Open', items: sortableItems, limit: 3, hasMore: true },
                { id: 'doing', title: 'In progress', items: [sortableItems[0]], limit: 1 },
                { id: 'review', title: 'Review', items: sortableItems, limit: 2 },
                { id: 'done', title: 'Done', items: [], collapsed: true },
            ],
        }),
    ],
    [
        'Kanban own cards and add',
        el('Kanban', {
            titleTag: 'h2',
            disabled: true,
            defaultColumns: [{ id: 'a', title: 'Backlog', items: sortableItems.slice(0, 1) }],
            $scoped: {
                card: {
                    react: 'renderCard',
                    args: (item: { label: string }) => ({ item }),
                    render: ({ item }: { item: { label: string } }) => el('strong', {}, item.label),
                },
                add: {
                    react: 'renderAdd',
                    args: (column: { title: string }) => ({ column }),
                    render: ({ column }: { column: { title: string } }) =>
                        el('Button', { size: 'sm' }, `Card in ${column.title}`),
                },
            },
        }),
    ],
    ['SessionTimeout', el('SessionTimeout', { expiresAt: '2099-01-01T00:00:00Z' })],
    [
        'BarsList',
        el('BarsList', {
            label: 'Page views',
            showTitle: true,
            labelHeader: 'Page',
            valueHeader: 'Views',
            items: [
                { label: '/start', value: 1240, href: '/start' },
                { label: '/pricing', value: 830, tone: 'success' },
                { label: '/contact', value: 0 },
            ],
        }),
    ],
    [
        'Funnel',
        el('Funnel', {
            title: 'Orders',
            stages: [
                { label: 'Visits', value: 10000 },
                { label: 'Cart', value: 2400 },
                { label: 'Purchase', value: 610 },
            ],
        }),
    ],
    [
        'Funnel hidden title, no table',
        el('Funnel', {
            title: 'Leads',
            hideTitle: true,
            table: false,
            conversion: false,
            tone: 'info',
            stages: [{ label: 'A', value: 5 }],
        }),
    ],
    [
        'BulletChart',
        el('BulletChart', {
            label: 'Revenue',
            description: 'Thousand €',
            value: 270,
            target: 250,
            max: 300,
            ranges: [150, 225, 300],
        }),
    ],
    ['BulletChart plain', el('BulletChart', { label: 'Tickets', value: 12, max: 20, tone: 'warn' })],
    [
        'RadialBar',
        el('RadialBar', {
            label: 'Goals',
            showTitle: true,
            items: [
                { label: 'Revenue', value: 72 },
                { label: 'New customers', value: 45, tone: 'success' },
                { label: 'Tickets', value: 30, max: 40 },
            ],
        }),
    ],
    ['RadialBar small', el('RadialBar', { label: 'Storage', size: 'sm', items: [{ label: 'Used', value: 0 }] })],
    [
        'BarChart brush, references, second axis',
        el('BarChart', {
            title: 'Revenue and margin',
            categoryKey: 'month',
            data: [
                { month: 'Jan', revenue: 120, margin: 12 },
                { month: 'Feb', revenue: 140, margin: 15 },
                { month: 'Mar', revenue: null, margin: 9 },
            ],
            series: [
                { key: 'revenue', label: 'Revenue' },
                { key: 'margin', label: 'Margin', axis: 'end', tone: 'success' },
            ],
            references: [
                { value: 130, label: 'Target' },
                { from: 100, to: 110 },
            ],
            brush: true,
            defaultRange: [0, 1],
        }),
    ],
    [
        'LineChart area, log scale, no table',
        el('LineChart', {
            title: 'Requests',
            hideTitle: true,
            table: false,
            area: true,
            scale: 'logarithmic',
            categoryKey: 'day',
            data: [
                { day: 'Mon', value: 10 },
                { day: 'Tue', value: 1000 },
            ],
            series: [{ key: 'value' }],
        }),
    ],
    [
        'CompositeChart',
        el('CompositeChart', {
            title: 'Visits',
            categoryKey: 'q',
            data: [{ q: 'Q1', visits: 3, rate: 0.4 }],
            series: [
                { key: 'visits', label: 'Visits' },
                { key: 'rate', label: 'Rate', type: 'line', axis: 'end' },
            ],
        }),
    ],
    [
        'WaterfallChart',
        el('WaterfallChart', {
            title: 'Result',
            steps: [
                { label: 'Revenue', value: 500 },
                { label: 'Costs', value: -320 },
                { label: 'Result', total: true },
            ],
        }),
    ],
    [
        'PieChart donut',
        el('PieChart', {
            title: 'Tickets by status',
            donut: true,
            slices: [
                { label: 'Open', value: 3 },
                { label: 'Done', value: 9, tone: 'success' },
            ],
        }),
    ],
    [
        'PieChart no legend, no table',
        el('PieChart', { title: 'Shares', legend: false, table: false, slices: [{ label: 'A', value: 1 }] }),
    ],
    [
        'CodeHighlight file name, wrap toggle, diff, expandable',
        el('CodeHighlight', {
            code: '-const a = 1;\n+const a = 2;\n console.log(a);',
            fileName: 'src/main.ts',
            // Plain, so the DOM does not depend on when Shiki is ready
            language: 'text',
            wrapToggle: true,
            diff: true,
            maxHeight: '4rem',
            expandable: true,
        }),
    ],
    [
        'CodeHighlight added lines, no header',
        el('CodeHighlight', {
            code: 'a\nb\nc',
            addedLines: [2],
            removedLines: [3],
            header: false,
            wrap: true,
            lineNumbers: true,
        }),
    ],
    [
        'CodeHighlightTabs',
        el('CodeHighlightTabs', {
            defaultValue: 'styles.css',
            // The visible file plain, so the DOM does not depend on when Shiki is ready (highlighting: apps.test.ts)
            files: [
                { name: 'App.vue', code: '<template><p>Hello</p></template>' },
                { name: 'styles.css', code: 'p { color: red; }', highlightLines: [1], language: 'text' },
                { name: 'Dockerfile', code: 'FROM node:26' },
            ],
        }),
    ],
    ['InlineCode', el('p', {}, 'Install with ', el('InlineCode', { code: 'pnpm add @wirecore/wirelayer-vue' }), '.')],
    // pdf.js loads in the browser only: the server and the first render show the loading state with the toolbar
    ['PdfViewer loading', el('PdfViewer', { src: '/document.pdf' })],
    [
        'PdfViewer tools, side bar, height, label',
        el('PdfViewer', {
            src: '/document.pdf',
            toolbar: ['sidebar', 'page', 'download'],
            sidebar: true,
            height: '400px',
            label: 'Proposal (PDF)',
            zoom: 1.5,
            page: 2,
        }),
    ],
    [
        'PdfViewer without toolbar, own attributes',
        el('PdfViewer', { src: '/document.pdf', toolbar: false, id: 'contract', class: 'max-w-3xl' }),
    ],
    [
        'Editor new tools, sticky, counter, table of contents',
        el('Editor', {
            'aria-label': 'Report',
            stickyToolbar: true,
            counter: true,
            maxLength: 200,
            tableOfContents: true,
            placeholder: 'Enter text',
            defaultValue:
                '<h2>Introduction</h2><p style="text-align: center">Centre</p><h3>Details</h3><p>H<sub>2</sub>O</p>',
            toolbar: [
                'alignLeft',
                'alignCenter',
                'alignRight',
                'alignJustify',
                '|',
                'textColor',
                'backgroundColor',
                'subscript',
                'superscript',
                '|',
                'details',
                'invisibleCharacters',
                'source',
            ],
        }),
    ],
    ['Editor read-only', el('Editor', { 'aria-label': 'Contract', readonly: true, defaultValue: '<p>Read only</p>' })],
    [
        'AuthForm sign in with providers',
        el('AuthForm', {
            $slots: { providers: el('Button', { variant: 'outline', block: true }, 'Sign in with company account') },
        }),
    ],
    [
        'AuthForm sign up, h2',
        el('AuthForm', { defaultMode: 'signUp', titleTag: 'h2', error: 'This address is already registered' }),
    ],
    ['AuthForm code', el('AuthForm', { defaultMode: 'code', codeLength: 4 })],
    ['AuthForm reset sent', el('AuthForm', { defaultMode: 'reset', sent: true, modes: ['signIn', 'reset'] })],
    [
        'AuthLayout',
        el(
            'AuthLayout',
            {
                image: '/login.jpg',
                side: 'end',
                $slots: { brand: 'WireLayer', teaser: el('p', {}, 'Everything in one place.'), footer: 'Legal notice' },
            },
            el('AuthForm', {})
        ),
    ],
];
