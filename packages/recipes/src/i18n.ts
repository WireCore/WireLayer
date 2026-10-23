// UI texts of the components – shared by @wirecore/wirelayer-vue and @wirecore/wirelayer-react so both read the same to assistive
// tech. English is the default and built in; LocaleProvider switches the language (see resolveLocale). German and the
// further languages are separate modules (./locales/<code>.ts, `@wirecore/wirelayer-recipes/locales/<code>`) that an app
// registers with registerLocale, so they do not add to the default bundle.

// The German texts define the shape of every language (type only – they are not part of this bundle)
import type { de } from './locales/de.js';

type CalendarView = 'day' | 'month' | 'year';

/** All texts of one language; a custom language passes a complete set to LocaleProvider */
export type Translations = typeof de;

/**
 * Texts by plural category of the locale (Intl.PluralRules) – `other` is required; `{count}` is the number. Exact
 * values win over the category: `{ '=1': 'Katru dienu', one: 'Ik pēc {count} dienas', … }` (Latvian "one" also
 * covers 21, 31 …)
 */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule | `=${number}`, string>> & { other: string };

/** The form for the count in the locale, "{count}" replaced by the formatted number: 1 → "1 Eintrag geladen" */
export function pluralText(forms: PluralForms, count: number, locale = defaultLocale): string {
    const form = forms[`=${count}`] ?? forms[new Intl.PluralRules(locale).select(count)] ?? forms.other;
    return form.replaceAll('{count}', new Intl.NumberFormat(locale).format(count));
}

/** 1 → "1st", 2 → "2nd", 11 → "11th" */
const englishOrdinal = (value: number) => {
    const suffix = { one: 'st', two: 'nd', few: 'rd', other: 'th' } as Record<string, string>;
    return `${value}${suffix[new Intl.PluralRules('en-US', { type: 'ordinal' }).select(value)] ?? 'th'}`;
};

const nextEn: Record<CalendarView, string> = { day: 'Next month', month: 'Next year', year: 'Next decade' };
const previousEn: Record<CalendarView, string> = {
    day: 'Previous month',
    month: 'Previous year',
    year: 'Previous decade',
};
const viewNamesEn: Record<CalendarView, string> = { day: 'days', month: 'months', year: 'years' };

const en: Translations = {
    common: {
        close: 'Close',
        cancel: 'Cancel',
        confirm: 'Confirm',
        placeholder: 'Select',
        loading: 'Loading',
        empty: 'No entries',
        noResults: 'No results',
        selectedCount: (count: number) => `${count} selected`,
    },
    toast: { label: 'Notifications' },
    menu: { title: 'Actions', search: 'Search the menu' },
    menubar: { menu: 'Menu' },
    dialog: { maximize: 'Maximize', restore: 'Restore' },
    confirm: {
        typeToConfirm: (text) => `Type “${text}” to confirm`,
        mismatch: 'The text does not match',
    },
    breadcrumb: { label: 'Breadcrumb', more: 'Hidden levels' },
    siteHeader: { navigation: 'Main navigation', menu: 'Menu' },
    modeToggle: { light: 'Switch to light mode', dark: 'Switch to dark mode' },
    pagination: {
        rootLabel: 'Pagination',
        prevTriggerLabel: 'Previous page',
        nextTriggerLabel: 'Next page',
        itemLabel: (details) => `Page ${details.page} of ${details.totalPages}`,
        summary: (range) => `${range.start}–${range.end} of ${range.count}`,
        firstTriggerLabel: 'First page',
        lastTriggerLabel: 'Last page',
        compact: (page, totalPages) => `Page ${page} of ${totalPages}`,
        pageSize: 'Per page',
        jumper: 'Go to page',
    },
    saveStatus: {
        idle: '',
        saving: 'Saving …',
        saved: 'Saved',
        error: 'Saving failed',
    },
    slider: { thumbs: ['Minimum', 'Maximum'] },
    numberInput: { incrementLabel: 'Increase', decrementLabel: 'Decrease' },
    passwordInput: {
        visibilityTrigger: (visible) => (visible ? 'Hide password' : 'Show password'),
    },
    combobox: { triggerLabel: 'Show suggestions', clearTriggerLabel: 'Clear input', search: 'Search …' },
    datePicker: {
        dayCell: (state) =>
            state.unavailable
                ? `Unavailable: ${state.valueText}`
                : state.selected
                  ? `Selected: ${state.valueText}`
                  : state.valueText,
        nextTrigger: (view) => nextEn[view],
        prevTrigger: (view) => previousEn[view],
        viewTrigger: (_view, nextView) => (nextView ? `Show ${viewNamesEn[nextView]}` : 'Switch view'),
        monthSelect: 'Select month',
        yearSelect: 'Select year',
        clearTrigger: 'Clear date',
        trigger: (open) => (open ? 'Close calendar' : 'Open calendar'),
        content: 'Calendar',
        placeholder: () => ({ year: 'yyyy', month: 'mm', day: 'dd' }),
        weekColumnHeader: 'Calendar week',
        weekColumnShort: 'Wk',
        weekNumberCell: (week) => `Week ${week}`,
        presetTrigger: (value) => value.join(' – '),
    },
    calendar: {
        today: 'Today',
        clear: 'Clear',
        noDates: 'No date selected',
        datesSelected: { one: '{count} day selected', other: '{count} days selected' },
        timeZone: (name) => `Time zone: ${name}`,
    },
    quarterPicker: {
        quarter: (quarter, year) => `Q${quarter} ${year}`,
        quarterButton: (quarter, year, months) => `Q${quarter} ${year}, ${months}`,
        trigger: 'Select quarter',
        content: 'Quarters',
        prevYear: 'Previous year',
        nextYear: 'Next year',
        clearTrigger: 'Clear quarter',
        placeholder: 'Q1 2026',
    },
    durationInput: {
        clearTrigger: 'Clear duration',
        days: 'Days',
        hours: 'Hours',
        minutes: 'Minutes',
        seconds: 'Seconds',
    },
    timeGrid: {
        label: 'Available times',
        empty: 'No times available',
        loading: 'Loading times',
        available: { one: '{count} time available', other: '{count} times available' },
    },
    miniCalendar: {
        label: 'Days',
        previous: 'Previous days',
        next: 'Next days',
    },
    dateInput: {
        placeholder: () => ({
            day: 'dd',
            month: 'mm',
            year: 'yyyy',
            hour: 'hh',
            minute: 'mm',
            second: 'ss',
            dayPeriod: '--',
            era: '--',
        }),
    },
    splitButton: { more: 'More actions' },
    confirmPopup: { confirm: 'Yes', cancel: 'Cancel' },
    passwordStrength: {
        levels: ['Too short', 'Weak', 'Fair', 'Good', 'Strong'],
        label: (level) => `Password strength: ${level}`,
    },
    field: { optional: 'optional', clear: 'Clear input' },
    textarea: {
        counter: (length, max) => `${length} / ${max}`,
        remaining: (remaining, max) =>
            remaining <= 0 ? `Maximum of ${max} characters reached` : `${remaining} of ${max} characters left`,
    },
    formErrorSummary: {
        title: (count) => (count === 1 ? 'Please correct 1 entry' : `Please correct ${count} entries`),
    },
    passwordRequirements: { label: 'Password requirements', met: 'met', unmet: 'not met' },
    dataView: {
        layout: 'View',
        list: 'List',
        grid: 'Grid',
        loadMore: 'Load more',
        loading: 'Loading items',
        shown: (count, total) => `${count} of ${total} shown`,
    },
    orderList: {
        top: 'Move to top',
        up: 'Move up',
        down: 'Move down',
        bottom: 'Move to bottom',
        moved: (label, position, count) => `${label}: position ${position} of ${count}`,
    },
    pickList: {
        source: 'Available',
        target: 'Selected',
        add: 'Add selected',
        addAll: 'Add all',
        remove: 'Remove selected',
        removeAll: 'Remove all',
        moved: (count, target) => `${count === 1 ? '1 item' : `${count} items`} moved to “${target}”`,
        filter: (list) => `Search ${list}`,
        dropHint: (list) => `Drop here: ${list}`,
    },
    appShell: {
        skipLink: 'Skip to content',
        openNavigation: 'Open navigation',
        navigation: 'Navigation',
        collapseNavigation: 'Collapse navigation',
        expandNavigation: 'Expand navigation',
        resizeNavigation: 'Resize navigation',
        resizeAside: 'Resize sidebar',
    },
    commandPalette: {
        label: 'Commands',
        placeholder: 'Search or type a command …',
        empty: 'Nothing found',
        navigate: 'select',
        run: 'run',
        close: 'close',
    },
    select: {
        clear: 'Clear selection',
        filter: 'Filter options',
        selectAll: 'Select all',
        removeItem: (label) => `Remove ${label}`,
        removed: (label) => `${label} removed`,
        maxReached: (max) => `At most ${max} can be selected`,
        suggestions: 'Suggestions',
    },
    chip: { remove: (label) => (label ? `Remove ${label}` : 'Remove') },
    tagsInput: {
        clearTriggerLabel: 'Remove all',
        deleteTagTriggerLabel: (value) => `Remove ${value}`,
        tagAdded: (value) => `${value} added`,
        tagsPasted: (values) => `${values.length} entries pasted`,
        tagEdited: (value) => `Editing ${value}`,
        tagUpdated: (value) => `${value} changed`,
        tagDeleted: (value) => `${value} removed`,
        tagSelected: (value) => `${value} selected, press Backspace to remove`,
    },
    navigationMenu: { rootLabel: 'Main navigation' },
    megaMenu: {
        rootLabel: 'Main navigation',
        menu: 'Menu',
        submenu: (label) => `${label} submenu`,
        showAll: 'Show all',
        showAllOf: (title) => `Show all: ${title}`,
        featuredLink: 'Learn more',
        overview: (label) => `${label} – overview`,
    },
    pageHeader: { back: 'Back' },
    bottomNavigation: { label: 'Navigation' },
    banner: { dismiss: 'Dismiss notice' },
    notificationCenter: {
        label: 'Notifications',
        markAllRead: 'Mark all as read',
        markRead: 'Mark as read',
        unread: 'Unread',
        unreadCount: (count) => `${count} unread`,
        empty: 'No notifications',
        loadMore: 'Load more',
        older: 'Older',
        announce: (count, title) => (count === 1 ? `New notification: ${title}` : `${count} new notifications`),
    },
    result: {
        success: 'Done',
        info: 'Note',
        warn: 'Attention',
        error: 'Something went wrong',
        '403': 'Access denied',
        '404': 'Page not found',
        '500': 'Server error',
        description403: 'You do not have permission to view this page.',
        description404: 'The page does not exist or has been moved.',
        description500: 'Something went wrong on the server. Please try again later.',
    },
    tour: {
        nextStep: 'Next',
        prevStep: 'Back',
        close: 'End tour',
        skip: 'Skip',
        done: 'Done',
        progressText: (details) => `${details.current + 1} of ${details.total}`,
    },
    tableOfContents: { title: 'On this page' },
    spoiler: { show: 'Show more', hide: 'Show less' },
    navigationProgress: { label: 'Loading page' },
    copyButton: { label: 'Copy', copied: 'Copied to clipboard' },
    actionBar: { label: 'Actions for the selection', clear: 'Clear selection' },
    heatmap: { less: 'Less', more: 'More', empty: 'no value' },
    scheduler: {
        shift: (minutes, days) =>
            days
                ? `${Math.abs(days) === 1 ? '1 day' : `${Math.abs(days)} days`} ${days > 0 ? 'later' : 'earlier'}`
                : `${Math.abs(minutes)} minutes ${minutes > 0 ? 'later' : 'earlier'}`,
        label: 'Calendar',
        today: 'Today',
        previous: 'Previous',
        next: 'Next',
        view: 'View',
        views: { day: 'Day', week: 'Week', month: 'Month', agenda: 'List', timeline: 'Timeline', year: 'Year' },
        allDay: 'All day',
        more: (count) => `+${count} more`,
        newEvent: (date) => `New event on ${date}`,
        empty: 'No events',
        changed: (title, when) => `${title}: ${when}`,
        resource: 'Resource',
        allResources: 'All resources',
        previousResources: 'Previous resources',
        nextResources: 'Next resources',
        resourceRange: (from, to, count) => `Resources ${from}–${to} of ${count}`,
        resourceFilter: 'Resource',
        newEventFor: (resource, date) => `New event for ${resource} on ${date}`,
        range: 'Range',
        ranges: { day: 'Day', week: 'Week', month: 'Month' },
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        series: 'Recurring event',
        seriesTitle: 'Change recurring event',
        seriesQuestion: (title) => `“${title}” is part of a series. What should change?`,
        onlyThis: 'This event',
        allInSeries: 'All events in the series',
        rejected: (title, reason) => `${title} cannot be dropped here: ${reason}`,
        notAllowed: 'not allowed',
        overlaps: (title) => `overlaps ${title}`,
        eventCount: { one: '{count} event', other: '{count} events' },
        closed: 'Outside business hours',
        loading: 'Loading events',
        loaded: { one: '{count} event loaded', other: '{count} events loaded' },
        error: 'The events could not be loaded.',
        retry: 'Try again',
    },
    recurrence: {
        DAILY: { one: 'Daily', other: 'Every {count} days' },
        WEEKLY: { one: 'Weekly', other: 'Every {count} weeks' },
        MONTHLY: { one: 'Monthly', other: 'Every {count} months' },
        YEARLY: { one: 'Yearly', other: 'Every {count} years' },
        on: (what) => `on ${what}`,
        nthWeekday: (nth, weekday) =>
            nth === -1
                ? `the last ${weekday}`
                : `the ${englishOrdinal(Math.abs(nth))}${nth < 0 ? ' last' : ''} ${weekday}`,
        monthlyNth: (what) => `Every ${what.replace(/^the /, '')} of the month`,
        monthDay: (day) =>
            day === -1 ? 'the last day' : `the ${englishOrdinal(Math.abs(day))}${day < 0 ? ' last day' : ''}`,
        inMonth: (what, month) => `${what} of ${month}`,
        dayOfMonth: (day, month) => `${month} ${day.replace(/the /g, '')}`,
        times: { one: 'once', other: '{count} times' },
        until: (date) => `until ${date}`,
    },
    gantt: {
        label: 'Project plan',
        task: 'Task',
        start: 'Start',
        end: 'End',
        duration: 'Duration',
        days: { one: '{count} day', other: '{count} days' },
        milestone: 'Milestone',
        group: 'Group',
        progress: (percent) => `${percent}% done`,
        dependsOn: (names) => `depends on ${names}`,
        critical: 'critical path',
        zoom: 'Zoom',
        zooms: { day: 'Day', week: 'Week', month: 'Month', quarter: 'Quarter' },
        today: 'Today',
        week: (week) => `W${week}`,
        quarter: (quarter) => `Q${quarter}`,
        changed: (name, when) => `${name}: ${when}`,
        progressChanged: (name, percent) => `${name}: ${percent}% done`,
        linked: (from, to) => `${to} now depends on ${from}`,
        addDependency: 'Add dependency…',
        dependencyTitle: (name) => `Predecessor of “${name}”`,
        predecessor: 'Predecessor',
        noPredecessor: 'No task possible',
        addDependencyConfirm: 'Add',
        empty: 'No tasks',
    },
    codeHighlight: {
        copy: 'Copy code',
        showMore: 'Show all code',
        showLess: 'Collapse code',
        wrap: 'Wrap lines',
        files: 'Files',
        added: 'added',
        removed: 'removed',
    },
    pdfViewer: {
        label: 'PDF document',
        toolbar: 'PDF tools',
        pages: 'Document pages',
        sidebar: 'Sidebar',
        thumbnails: 'Pages',
        outline: 'Contents',
        noOutline: 'No table of contents',
        pageLabel: (page) => `Page ${page}`,
        page: 'Page',
        ofPages: (count) => `of ${count}`,
        pageStatus: (page, count) => `Page ${page} of ${count}`,
        previousPage: 'Previous page',
        nextPage: 'Next page',
        zoom: 'Zoom',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        pageWidth: 'Page width',
        pageFit: 'Whole page',
        rotate: 'Rotate clockwise',
        search: 'Search',
        searchField: 'Search in document',
        matchCase: 'Match case',
        previousMatch: 'Previous match',
        nextMatch: 'Next match',
        closeSearch: 'Close search',
        matches: (current, total) => `Match ${current} of ${total}`,
        noMatches: 'No matches',
        searching: 'Searching …',
        wrappedTop: 'continued from the end',
        wrappedBottom: 'continued from the start',
        download: 'Download',
        print: 'Print',
        printing: (page, count) => `Preparing to print: page ${page} of ${count}`,
        fullscreen: 'Full screen',
        loading: 'Loading PDF',
        loaded: (count) => (count === 1 ? 'PDF loaded, 1 page' : `PDF loaded, ${count} pages`),
        error: 'The PDF could not be loaded.',
        invalid: 'The file is not a valid PDF or is damaged.',
        missing: 'The PDF was not found.',
        passwordTitle: 'Protected PDF',
        passwordDescription: 'Enter the password to open the document.',
        passwordLabel: 'Password',
        passwordWrong: 'The password is wrong. Please try again.',
        passwordSubmit: 'Open',
        passwordRequired: 'The PDF cannot be opened without a password.',
        fileName: 'document.pdf',
        share: 'Share',
        unsupported: 'The PDF view is only available in the app (iOS and Android).',
    },
    compare: {
        label: 'Before and after comparison',
        before: 'Before',
        after: 'After',
        valueText: (percent) => `${percent}% before, ${100 - percent}% after`,
    },
    sankey: { source: 'From', target: 'To', value: 'Value' },
    treemap: { share: (value, percent) => `${value} · ${percent}` },
    countdown: {
        days: (count) => (count === 1 ? 'Day' : 'Days'),
        hours: (count) => (count === 1 ? 'Hour' : 'Hours'),
        minutes: (count) => (count === 1 ? 'Minute' : 'Minutes'),
        seconds: (count) => (count === 1 ? 'Second' : 'Seconds'),
    },
    rangePresets: {
        thisWeek: 'This week',
        lastWeek: 'Last week',
        thisMonth: 'This month',
        lastMonth: 'Last month',
        thisQuarter: 'This quarter',
        lastQuarter: 'Last quarter',
        thisYear: 'This year',
        lastYear: 'Last year',
        last3Days: 'Last 3 days',
        last7Days: 'Last 7 days',
        last14Days: 'Last 14 days',
        last30Days: 'Last 30 days',
        last90Days: 'Last 90 days',
        last3Months: 'Last 3 months',
        last6Months: 'Last 6 months',
        last12Months: 'Last 12 months',
        last4Quarters: 'Last 4 quarters',
        last3Years: 'Last 3 years',
        last5Years: 'Last 5 years',
    },
    splitter: { resize: (panel) => `Resize “${panel}”` },
    image: {
        preview: (alt) => `View larger: ${alt}`,
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        rotate: 'Rotate',
        close: 'Close',
    },
    inplace: { edit: 'edit' },
    scrollTop: { label: 'Back to top' },
    blockUi: { label: 'Loading' },
    speedDial: { label: 'Actions' },
    stepper: {
        prev: 'Back',
        next: 'Next',
        finish: 'Finish',
        status: { done: 'completed', active: 'current step', todo: 'to do' },
        progress: (step, count) => `Step ${step} of ${count}`,
    },
    dataTable: {
        row: (index) => `Row ${index + 1}`,
        selectAll: 'Select all rows on this page',
        selectRow: (row) => `Select ${row}`,
        subRows: (row) => `Rows below ${row}`,
        search: (caption) => `Search ${caption}`,
        searchPlaceholder: 'Search …',
        filter: (header) => `Filter ${header}`,
        filterAll: 'All',
        columns: 'Columns',
        export: 'Export (CSV)',
        resize: (header) => `Width of ${header}`,
        edit: (header, value) => `${value || 'empty'}, edit ${header}`,
        results: (count) => (count === 1 ? '1 entry' : `${count} entries`),
        group: (header, value, count) => `${header}: ${value}, ${count} entries`,
        matchModes: {
            startsWith: 'Starts with',
            contains: 'Contains',
            notContains: 'Does not contain',
            endsWith: 'Ends with',
            equals: 'Equals',
            notEquals: 'Does not equal',
            lt: 'Less than',
            lte: 'Less than or equal to',
            gt: 'Greater than',
            gte: 'Greater than or equal to',
            between: 'Between',
            in: 'Is one of',
            dateIs: 'On',
            dateIsNot: 'Not on',
            dateBefore: 'Before',
            dateAfter: 'After',
        },
        operator: 'Combine',
        matchAll: 'All conditions met',
        matchAny: 'Any condition met',
        matchMode: (index) => `Condition ${index + 1}`,
        value: (index) => `Value ${index + 1}`,
        from: 'From',
        to: 'To',
        addRule: 'Add condition',
        removeRule: (index) => `Remove condition ${index + 1}`,
        apply: 'Apply',
        clear: 'Clear',
        filterMenu: (header, active) => (active ? `Filter for ${header}, active` : `Filter for ${header}`),
        yes: 'Yes',
        no: 'No',
        columnMenu: (header) => `Options for ${header}`,
        sortAscending: 'Sort ascending',
        sortDescending: 'Sort descending',
        clearSort: 'Clear sorting',
        sortBy: 'Sort',
        filters: 'Filters',
        sortPriority: (position, desc) => `sort level ${position}, ${desc ? 'descending' : 'ascending'}`,
        pinStart: 'Pin to start',
        pinEnd: 'Pin to end',
        unpin: 'Unpin',
        moveEarlier: 'Move one column back',
        moveLater: 'Move one column forward',
        hideColumn: 'Hide',
        groupBy: 'Group by this column',
        ungroup: 'Remove grouping',
        columnMoved: (header, position, count) => `${header} is now column ${position} of ${count}`,
        density: 'Row height',
        densities: { sm: 'Compact', md: 'Normal', lg: 'Comfortable' },
        fullscreen: 'Full screen',
        exitFullscreen: 'Exit full screen',
        rowNumber: 'No.',
        expandAll: 'Expand all rows',
        collapseAll: 'Collapse all rows',
        details: (row) => `Details of ${row}`,
        actions: 'Actions',
        rowActions: (row) => `Actions for ${row}`,
        moveRow: (row) => `Move ${row}`,
        rowMoved: (row, position, count) => `${row} is now at position ${position} of ${count}`,
        editRow: (row) => `Edit ${row}`,
        saveRow: (row) => `Save ${row}`,
        cancelEdit: (row) => `Cancel editing ${row}`,
        rowsPerPage: 'Rows per page',
        exportAll: 'All rows',
        exportSelection: 'Selected rows',
        filterToggle: 'Show filters',
        rowCount: (count) => (count === 1 ? '1 row' : `${count} rows`),
        filteredCount: (count) => `${count} filtered`,
        copy: (header, value) => `Copy ${value}, ${header}`,
        selectAllRows: 'Select all rows',
        select: 'Selection',
        reorder: 'Order',
        footer: 'Totals',
        aggregates: {
            sum: (value) => `Total ${value}`,
            avg: (value) => `Avg. ${value}`,
            min: (value) => `Min. ${value}`,
            max: (value) => `Max. ${value}`,
            count: (value) => `Count ${value}`,
        },
        exportMenu: 'Export',
        exportXlsx: 'Export (Excel)',
        exportAs: (format, selection) =>
            `${selection ? 'Selected rows' : 'All rows'} as ${format === 'xlsx' ? 'Excel' : 'CSV'}`,
        cellsCopied: (count) => (count === 1 ? '1 cell copied' : `${count} cells copied`),
        cellsPasted: (count, invalid) =>
            `${count === 1 ? '1 cell' : `${count} cells`} pasted${invalid ? `, ${invalid} invalid` : ''}`,
        pasteErrors: {
            number: 'Not a number',
            date: 'Not a date',
            option: 'None of the choices',
            boolean: 'Neither yes nor no',
            readonly: 'Not editable',
        },
        changes: (count) => (count === 1 ? '1 change' : `${count} changes`),
        changed: 'changed',
        saveChanges: 'Save',
        discardChanges: 'Discard',
        changesSaved: (count) => (count === 1 ? '1 change saved' : `${count} changes saved`),
        changesDiscarded: 'Changes discarded',
        undo: 'Undo',
        redo: 'Redo',
        undone: (count) => (count === 1 ? '1 cell reset' : `${count} cells reset`),
        redone: (count) => (count === 1 ? '1 cell restored' : `${count} cells restored`),
        rowMovedToGroup: (row, group, position, count) => `${row} is now in ${group}, position ${position} of ${count}`,
        rowMovedInTree: (row, parent, position, count) =>
            `${row} moved${parent ? ` into ${parent}` : ''}, position ${position} of ${count}`,
        find: 'Find in table',
        findMatches: (current, total) => (total ? `Match ${current} of ${total}` : 'No matches'),
        findNext: 'Next match',
        findPrevious: 'Previous match',
        findClose: 'Close find',
        total: 'Total',
        columnGroupEarlier: (header) => `Move ${header} back`,
        columnGroupLater: (header) => `Move ${header} forward`,
    },
    dataSource: {
        loading: 'Loading',
        loaded: { one: '{count} item loaded', other: '{count} items loaded' },
        empty: 'No items found',
        error: 'The data could not be loaded.',
        retry: 'Try again',
        minSearch: (count) => `Please enter at least ${count} characters`,
        loadMore: 'Load more',
        loadingMore: 'Loading more items',
    },
    dateRange: {
        start: 'Start',
        end: 'End',
        clearTrigger: 'Clear range',
    },
    timePicker: {
        trigger: 'Select time',
        clearTrigger: 'Clear time',
        clearRange: 'Clear times',
    },
    dateSegments: {
        day: 'Day',
        month: 'Month',
        year: 'Year',
        hour: 'Hour',
        minute: 'Minute',
        second: 'Second',
        dayPeriod: 'AM/PM',
    },
    pinInput: { inputLabel: (index, length) => `Digit ${index + 1} of ${length}` },
    rating: { ratingValueText: (index) => (index === 1 ? '1 star' : `${index} stars`) },
    carousel: {
        nextTrigger: 'Next image',
        prevTrigger: 'Previous image',
        indicator: (index) => `Show image ${index + 1}`,
        item: (index, count) => `Image ${index + 1} of ${count}`,
        autoplayStart: 'Play automatically',
        autoplayStop: 'Pause',
        progressText: (details) => `${details.page + 1} / ${details.totalPages}`,
    },
    chart: {
        showTable: 'Data as table',
        category: 'Category',
        sparkline: (label, first, last, min, max) => `${label}: from ${first} to ${last}, low ${min}, high ${max}`,
        series: (index) => `Series ${index + 1}`,
        change: 'Change',
        total: 'Total',
        brush: 'Range',
        brushThumbs: ['Start', 'End'],
        legend: 'Legend',
        share: 'Share',
        value: 'Value',
        references: 'Reference values',
        stage: 'Stage',
        conversion: 'Conversion',
        fromPrevious: (percent) => `${percent} of the previous stage`,
        target: 'Target',
        bulletValue: (value, max, target) => (target ? `${value} of ${max}, target ${target}` : `${value} of ${max}`),
    },
    editor: {
        toolbar: 'Formatting',
        bold: 'Bold',
        italic: 'Italic',
        underline: 'Underline',
        strike: 'Strikethrough',
        heading2: 'Heading',
        heading3: 'Subheading',
        bulletList: 'Bulleted list',
        orderedList: 'Numbered list',
        blockquote: 'Quote',
        code: 'Code',
        link: 'Link',
        undo: 'Undo',
        redo: 'Redo',
        linkUrl: 'Link address',
        linkApply: 'Apply',
        linkRemove: 'Remove link',
        linkCancel: 'Cancel',
        taskList: 'Task list',
        codeBlock: 'Code block',
        horizontalRule: 'Divider',
        image: 'Image',
        imageUrl: 'Image address',
        imageAlt: 'Alternative text',
        imageDecorative: 'Decorative only (no alternative text)',
        imageUpload: 'Choose file',
        imageInsert: 'Insert',
        imageUpdate: 'Apply',
        table: 'Table',
        tableBar: 'Edit table',
        tableActions: {
            insertTable: 'Insert table',
            addRowBefore: 'Row above',
            addRowAfter: 'Row below',
            addColumnBefore: 'Column before',
            addColumnAfter: 'Column after',
            deleteRow: 'Delete row',
            deleteColumn: 'Delete column',
            toggleHeaderRow: 'Header row on/off',
            mergeOrSplit: 'Merge/split cells',
            deleteTable: 'Delete table',
        },
        taskItem: (text, checked) => `${text || 'Empty task'}, ${checked ? 'done' : 'open'}`,
        shortcut: (letter, shift) => `Ctrl+${shift ? 'Shift+' : ''}${letter}`,
        alignLeft: 'Align left',
        alignCenter: 'Centre',
        alignRight: 'Align right',
        alignJustify: 'Justify',
        textColor: 'Text colour',
        backgroundColor: 'Background colour',
        colorDefault: 'Default',
        colors: {
            primary: 'Accent',
            info: 'Info',
            success: 'Success',
            warn: 'Warning',
            danger: 'Error',
            muted: 'Muted',
        },
        subscript: 'Subscript',
        superscript: 'Superscript',
        source: 'HTML source',
        sourceField: 'Edit HTML source',
        details: 'Collapsible section',
        detailsToggle: (open) => (open ? 'Collapse section' : 'Expand section'),
        invisibleCharacters: 'Invisible characters',
        tableOfContents: 'Table of contents',
        characters: (count, limit) => (limit === undefined ? `${count} characters` : `${count} of ${limit} characters`),
        words: (count) => (count === 1 ? '1 word' : `${count} words`),
        limitReached: 'Maximum length reached',
        imageUploading: 'Uploading image …',
        imageUploaded: 'Image inserted',
        imageFailed: 'The image could not be uploaded',
        bubbleMenu: 'Format selection',
        floatingMenu: 'Insert block',
        menuHint: 'Alt+F10: menu',
        suggestions: 'Suggestions',
        noSuggestions: 'No matches',
        suggestionCount: (count) => (count === 1 ? '1 suggestion' : `${count} suggestions`),
        mentioned: (label) => `${label} mentioned`,
    },
    gallery: {
        fullscreen: 'Full screen',
        close: 'Exit full screen',
        thumbnails: 'Thumbnails',
        thumbnail: (index, count) => `Show image ${index + 1} of ${count}`,
        toolbar: 'Image tools',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        resetZoom: 'Actual size',
        rotate: 'Rotate',
        download: 'Download',
        screen: 'Fill the screen',
        exitScreen: 'Exit filling the screen',
        zoom: (percent) => `Zoom ${percent} %`,
        shortcuts: 'Arrow keys: change image · + and −: zoom · 0: actual size · R: rotate · F: fill the screen',
        video: 'Video',
    },
    colorPicker: {
        trigger: (color) => `Choose color, currently ${color}`,
        name: 'Color',
        area: 'Saturation and brightness',
        hue: 'Hue',
        alpha: 'Opacity',
        hex: 'Hex value',
        swatch: (color) => `Choose ${color}`,
        open: 'Open color picker',
        eyeDropper: 'Pick a color from the screen',
        format: 'Format',
        formats: { rgb: 'RGB', hsl: 'HSL', hsb: 'HSB', oklch: 'OKLCH' },
        channels: {
            rgb: ['Red', 'Green', 'Blue'],
            hsl: ['Hue', 'Saturation', 'Lightness'],
            hsb: ['Hue', 'Saturation', 'Brightness'],
            oklch: ['Lightness', 'Chroma', 'Hue'],
        },
        palette: 'Colors',
    },
    tree: {
        treeLabel: 'Tree',
        moved: (label, parent, position, count) =>
            `${label} moved${parent ? ` to ${parent}` : ''}, position ${position} of ${count}`,
        loadingRow: 'Loading …',
        loadingNode: (label) => `${label}: Loading`,
        loadedNode: { one: '{label}: {count} item loaded', other: '{label}: {count} items loaded' },
        loadError: (label) => `${label} could not be loaded`,
        retry: 'Loading failed – try again',
        filter: 'Search the tree',
        matches: { one: '{count} match', other: '{count} matches' },
        noMatches: 'No matches',
        expandAll: 'Expand all',
        collapseAll: 'Collapse all',
        cut: (label) => `${label} cut – paste it at another node with Ctrl+V`,
        cutCancelled: 'Cut cancelled',
        dropDenied: 'Not possible here',
    },
    treeSelect: {
        search: 'Search',
        more: (count) => `+${count}`,
        moreLabel: (count) => `${count} more selected`,
    },
    cascadeSelect: {
        search: 'Search',
        showLevels: 'Show levels',
        choose: (label) => `Choose ${label}`,
        path: (labels) => labels.join(' › '),
    },
    timeline: {
        loadMore: 'Load older entries',
        loading: 'Loading older entries',
    },
    orgChart: {
        expand: (label) => `Show the team of ${label}`,
        collapse: (label) => `Hide the team of ${label}`,
        loading: (label) => `${label}: Loading`,
        retry: (label) => `${label}: Loading failed – try again`,
    },
    fileUpload: {
        dropzone: 'Drop files',
        itemPreview: (file) => `Preview of ${file.name}`,
        deleteFile: (file) => `Remove ${file.name}`,
        dropzoneText: (multiple) => (multiple ? 'Drag files here or' : 'Drag a file here or'),
        trigger: (multiple) => (multiple ? 'Choose files' : 'Choose file'),
        errors: {
            TOO_MANY_FILES: 'Too many files',
            FILE_INVALID_TYPE: 'File type not allowed',
            FILE_TOO_LARGE: 'File is too large',
            FILE_TOO_SMALL: 'File is too small',
            FILE_INVALID: 'File is invalid',
            FILE_EXISTS: 'File is already selected',
        },
        upload: 'Upload',
        uploadAll: 'Upload all',
        cancel: (file) => `Cancel upload of ${file.name}`,
        retry: (file) => `Upload ${file.name} again`,
        progress: (file) => `Progress of ${file.name}`,
        status: {
            pending: 'Ready to upload',
            uploading: (percent) => `Uploading … ${percent}%`,
            done: 'Uploaded',
            error: 'Upload failed',
            cancelled: 'Cancelled',
        },
        uploaded: (file) => `${file.name} uploaded`,
        failed: (file) => `${file.name} could not be uploaded`,
        dropAccept: (multiple) => (multiple ? 'Release to add the files' : 'Release to add the file'),
        dropReject: 'These files are not allowed here',
        fullscreen: 'Drop files anywhere',
        /** React Native: where FileUpload takes files from */
        sources: { documents: 'Choose document', photos: 'Choose from photos', camera: 'Take photo' },
        pasted: (count) => (count === 1 ? '1 file pasted' : `${count} files pasted`),
    },
    statistic: { loading: 'Loading' },
    truncate: { more: 'Show more', less: 'Show less' },
    overflowList: { more: 'more', title: 'More items' },
    toggletip: { label: 'More information', labelFor: (label) => `More information about ${label}` },
    checkboxGroup: { maxReached: (max) => `At most ${max} can be selected` },
    skipLinks: { label: 'Skip links' },
    hotkeys: {
        keys: {
            ctrl: 'Ctrl',
            alt: 'Alt',
            shift: 'Shift',
            meta: 'Win',
            space: 'Space',
            enter: 'Enter',
            escape: 'Esc',
            backspace: 'Backspace',
            delete: 'Del',
            tab: 'Tab',
        },
        then: 'then',
        title: 'Keyboard shortcuts',
        description: 'All keyboard shortcuts of this page',
        empty: 'No keyboard shortcuts',
        open: 'Show keyboard shortcuts',
        general: 'General',
        commandPalette: 'Open commands',
    },
    persona: { presence: { online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline' } },
    inlineEdit: {
        edit: 'edit',
        save: 'Save',
        cancel: 'Cancel',
        empty: 'Empty',
        saving: 'Saving …',
        title: (label) => `Edit ${label}`,
    },
    searchField: { label: 'Search', placeholder: 'Search …', clear: 'Clear search', scope: 'Search in' },
    filterPanel: {
        label: 'Filters',
        toggle: 'Filters',
        active: 'active',
        status: (count) =>
            count === 0 ? 'No filters active' : count === 1 ? '1 filter active' : `${count} filters active`,
    },
    filterChips: { label: 'Active filters', remove: (label) => `Remove filter ${label}`, reset: 'Reset all' },
    conditionBuilder: {
        label: 'Conditions',
        combinator: 'Combine with',
        and: 'And',
        or: 'Or',
        all: 'All conditions met',
        any: 'Any condition met',
        not: 'Not',
        group: (path) => `Group ${path}`,
        rule: (path) => `Condition ${path}`,
        addRule: 'Add condition',
        addGroup: 'Add group',
        removeRule: (path) => `Remove condition ${path}`,
        removeGroup: (path) => `Remove group ${path}`,
        field: 'Field',
        operator: 'Operator',
        value: 'Value',
        from: 'From',
        to: 'To',
        yes: 'Yes',
        no: 'No',
        empty: 'No conditions – all entries match',
        operators: { empty: 'Is empty', notEmpty: 'Is not empty', in: 'Is one of' },
        added: 'Condition added',
        groupAdded: 'Group added',
        removed: 'Condition removed',
        groupRemoved: 'Group removed',
        advanced: 'Advanced filter',
    },
    formList: {
        add: 'Add entry',
        item: (position) => `Entry ${position}`,
        remove: (item) => `Remove ${item}`,
        moveUp: (item) => `Move ${item} up`,
        moveDown: (item) => `Move ${item} down`,
        added: (item) => `${item} added`,
        removed: (item) => `${item} removed`,
        moved: (item, position) => `${item} moved to position ${position}`,
        max: (max) => `At most ${max} entries`,
        min: (min) => `At least ${min} entries`,
    },
    keyValueEditor: {
        key: 'Key',
        value: 'Value',
        add: 'Add row',
        item: (position) => `Row ${position}`,
        duplicate: 'Key occurs more than once',
    },
    wizard: { summary: 'Summary', validating: 'Checking …', invalid: 'Please check the entries in this step' },
    aiLabel: {
        label: 'AI-generated',
        explanation: 'This content was created with artificial intelligence. Please check it before using it.',
        help: 'What does AI-generated mean?',
    },
    qrCode: {
        label: (value) => `QR code: ${value}`,
        downloadPng: 'Download as PNG',
        downloadSvg: 'Download as SVG',
    },
    signaturePad: {
        label: 'Signature',
        roleDescription: 'signature field',
        control: 'Signature field – sign with mouse, pen or finger',
        placeholder: 'Sign here',
        clear: 'Clear',
        undo: 'Undo',
        type: 'Type signature',
        draw: 'Draw signature',
        typedLabel: 'Name as signature',
        cleared: 'Signature cleared',
    },
    imageCropper: {
        label: 'Crop image',
        roleDescription: 'Image cropper',
        loading: 'Loading image',
        description: (zoom, rotation) =>
            `Zoom ${Math.round((zoom ?? 1) * 100)}%, rotated by ${Math.round(rotation ?? 0)} degrees`,
        selection: (circle) => (circle ? 'Circular crop area' : 'Crop area'),
        selectionRoleDescription: 'movable crop area',
        instructions: 'Arrow keys move the crop area, Alt and arrow keys resize it, plus and minus zoom.',
        selectionValue: (width, height, x, y) => `${width} × ${height} pixels, position ${x}, ${y}`,
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        rotateLeft: 'Rotate left',
        rotateRight: 'Rotate right',
        flip: 'Flip horizontally',
        reset: 'Reset',
        toolbar: 'Edit image',
    },
    floatingPanel: {
        minimize: 'Minimize',
        maximize: 'Maximize',
        restore: 'Restore',
        close: 'Close',
        hint: 'Alt and arrow keys move the window, Alt, Shift and arrow keys resize it.',
    },
    jsonViewer: {
        label: 'JSON data',
        search: 'Search',
        copy: (path) => `Copy ${path}`,
        copied: (path) => `${path} copied`,
        items: (count) => (count === 1 ? '1 item' : `${count} items`),
        keys: (count) => (count === 1 ? '1 key' : `${count} keys`),
        matches: (count) => (count === 0 ? 'No matches' : count === 1 ? '1 match' : `${count} matches`),
        types: {
            object: 'object',
            array: 'array',
            string: 'string',
            number: 'number',
            boolean: 'boolean',
            null: 'null',
            undefined: 'undefined',
        },
    },
    jsonInput: {
        format: 'Format',
        valid: 'Valid JSON',
        invalid: 'Invalid JSON',
        invalidAt: (line, column) => `Invalid JSON at line ${line}, column ${column}`,
    },
    downloadTrigger: { label: 'Download' },
    marquee: { label: 'Ticker', pause: 'Pause ticker', play: 'Resume ticker' },
    angleSlider: { label: 'Angle', value: (degrees) => `${degrees} degrees` },
    mentions: {
        label: 'Message',
        suggestions: 'Suggestions',
        count: (count) => (count === 0 ? 'No suggestions' : count === 1 ? '1 suggestion' : `${count} suggestions`),
        hint: (triggers) => `${triggers} opens suggestions, arrow keys choose, Enter takes one`,
    },
    phoneInput: { country: 'Country', number: 'Phone number', search: 'Search country' },
    colorSwatchPicker: { label: 'Color' },
    emojiPicker: {
        emojis: '',
        label: 'Emojis',
        search: 'Search emoji',
        categoryNav: 'Categories',
        categories: {
            recent: 'Recently used',
            smileys: 'Smileys & emotion',
            people: 'People & gestures',
            nature: 'Animals & nature',
            food: 'Food & drink',
            travel: 'Travel & places',
            activities: 'Activities',
            objects: 'Objects',
            symbols: 'Symbols',
        },
        results: 'Search results',
        empty: 'No emojis found',
        count: (count) => (count === 0 ? 'No emojis' : count === 1 ? '1 emoji' : `${count} emojis`),
    },
    ringProgress: { label: 'Progress' },
    sortable: {
        instructions:
            'Press Space or Enter to pick up. Then move with the arrow keys, press Space to drop or Escape to cancel. With a mouse: drag, or click and click again at the target.',
        handle: (item) => `Move ${item}`,
        empty: 'No items – move here',
        picked: (item, position, count) => `${item} picked up, position ${position} of ${count}.`,
        moved: (item, position, count) => `${item}: position ${position} of ${count}.`,
        movedTo: (item, container, position, count) => `${item} in ${container}, position ${position} of ${count}.`,
        dropped: (item, position, count) => `${item} dropped, position ${position} of ${count}.`,
        cancelled: (item, position, count) => `Move cancelled. ${item} back at position ${position} of ${count}.`,
    },
    logViewer: {
        label: 'Log',
        search: 'Search log',
        levels: { debug: 'Debug', info: 'Info', warn: 'Warning', error: 'Error' },
        levelFilter: 'Levels',
        autoScroll: 'Follow',
        loadMore: 'Load older entries',
        jumpToEnd: 'Jump to end',
        lines: (shown, total) => (shown === total ? `${total} lines` : `${shown} of ${total} lines`),
        empty: 'No entries',
        paused: 'Following paused',
    },
    kanban: {
        moveTo: (column) => `Move to “${column}”`,
        label: 'Board',
        count: (count, limit) => (limit ? `${count}/${limit}` : String(count)),
        cards: (count, limit) => `${count === 1 ? '1 card' : `${count} cards`}${limit ? `, limit ${limit}` : ''}`,
        limitReached: 'WIP limit reached',
        limitExceeded: (count, limit) => `WIP limit exceeded: ${count} of ${limit}`,
        collapse: (column) => `Collapse ${column}`,
        expand: (column) => `Expand ${column}`,
        loadMore: 'Load more',
        empty: 'No cards – move one here',
    },
    chatMessages: {
        label: 'Messages',
        empty: 'No messages yet',
        jump: 'Jump to new messages',
        newCount: (count) => (count === 1 ? '1 new message' : `${count} new messages`),
        announce: (author, text) => `${author}: ${text}`,
        today: 'Today',
        yesterday: 'Yesterday',
        loadMore: 'Load older messages',
    },
    chatMessage: {
        status: { sending: 'Sending', sent: 'Sent', read: 'Read', error: 'Not sent' },
        writing: 'Writing a reply',
        attachments: 'Attachments',
        you: 'You',
        assistant: 'Assistant',
    },
    chatPrompt: {
        label: 'Message',
        placeholder: 'Write a message …',
        send: 'Send',
        stop: 'Stop reply',
        attach: 'Attach file',
        removeFile: (name) => `Remove ${name}`,
        hint: 'Enter sends, Shift+Enter for a new line',
        hintModEnter: 'Ctrl+Enter sends',
    },
    chatSources: { title: (count) => (count === 1 ? '1 source' : `${count} sources`) },
    chatToolCall: {
        title: (name) => `Tool: ${name}`,
        status: { running: 'Running …', done: 'Done', error: 'Error' },
        input: 'Input',
        output: 'Result',
    },
    chatThinking: {
        active: 'Thinking …',
        done: 'Reasoning',
        duration: (seconds) => `Thought for ${seconds} s`,
    },
    authForm: {
        titles: { signIn: 'Sign in', signUp: 'Create account', reset: 'Reset password', code: 'Enter code' },
        descriptions: {
            signIn: 'With your email address and password',
            signUp: 'Your own account in a few steps',
            reset: 'We will send you a link to reset it.',
            code: 'Enter the code from the email or your authenticator app',
        },
        submit: { signIn: 'Sign in', signUp: 'Sign up', reset: 'Send link', code: 'Confirm' },
        name: 'Name',
        email: 'E-mail address',
        password: 'Password',
        passwordHint: (min) => `At least ${min} characters`,
        code: 'One-time code',
        remember: 'Keep me signed in',
        forgot: 'Forgot password?',
        or: 'or',
        providers: 'Sign in with',
        noAccount: 'No account yet?',
        signUpLink: 'Sign up',
        hasAccount: 'Already have an account?',
        signInLink: 'Sign in',
        back: 'Back to sign in',
        resetSent: 'If an account exists for this address, a link is on its way.',
        sending: 'Sending …',
    },
    sessionTimeout: {
        title: 'Your session is about to expire',
        description: 'For your security you will be signed out when inactive. Do you want to stay signed in?',
        remaining: 'Time left',
        extend: 'Stay signed in',
        signOut: 'Sign out',
        expiredTitle: 'Session expired',
        expired: 'You have been signed out for your security.',
        close: 'Close',
    },
    validation: {
        required: 'Required',
        email: 'Please enter a valid email address',
        url: 'Please enter a valid address (https://…)',
        minLength: (min) => `At least ${min} characters`,
        maxLength: (max) => `At most ${max} characters`,
        length: (min, max) => `${min} to ${max} characters`,
        min: (min) => `At least ${min}`,
        max: (max) => `At most ${max}`,
        range: (min, max) => `Between ${min} and ${max}`,
        number: 'Please enter a number',
        integer: 'Please enter a whole number',
        pattern: 'The format does not match',
        matches: 'The entries do not match',
        iban: 'Please enter a valid IBAN',
        phone: 'Please enter a valid phone number',
    },
};

/** Built-in languages; others fall back to English unless registered (registerLocale) or passed to LocaleProvider */
/** The built-in language – German and the others are registered (registerLocale) */
export const messages: Record<'en', Translations> = { en };

const registered = new Map<string, Translations>();

/**
 * Makes the texts of a language available to resolveLocale and every LocaleProvider – once at app start, before the
 * first render: `registerLocale('fr', fr)` with `fr` from `@wirecore/wirelayer-recipes/locales/fr`. A language ("fr") serves all
 * its regions ("fr-CA"); a region ("pt-BR") takes precedence over its language. Registered texts win over the
 * built-in ones.
 */
export function registerLocale(locale: string, texts: Translations): void {
    registered.set(locale.toLowerCase(), texts);
}

// The registered texts for the longest matching prefix of the tag: "pt-BR" → "pt-br", then "pt"
function registeredTexts(locale: string): Translations | undefined {
    const parts = locale.toLowerCase().split('-');
    for (let length = parts.length; length > 0; length--) {
        const texts = registered.get(parts.slice(0, length).join('-'));
        if (texts) return texts;
    }
    return undefined;
}

/** English texts – what the components use without a LocaleProvider */
export const translations = en;

export const defaultLocale = 'en-US';

export interface ResolvedLocale {
    /** BCP 47 tag for Intl formatting, e.g. "de-DE" */
    locale: string;
    dir: 'ltr' | 'rtl';
    translations: Translations;
}

const rtlScripts = new Set(['Arab', 'Hebr', 'Thaa', 'Syrc', 'Nkoo', 'Adlm', 'Rohg', 'Mend', 'Samr', 'Mand']);

/** Writing direction of a locale ("ar-EG" → rtl) – the same rule as Ark */
export function localeDirection(locale: string): 'ltr' | 'rtl' {
    try {
        return rtlScripts.has(new Intl.Locale(locale).maximize().script ?? '') ? 'rtl' : 'ltr';
    } catch {
        return 'ltr';
    }
}

/** Texts and direction for a locale: the custom texts, a registered language, the built-in language or English */
export function resolveLocale(locale: string = defaultLocale, custom?: Translations): ResolvedLocale {
    const language = locale.split('-')[0]!.toLowerCase();
    return {
        locale,
        dir: localeDirection(locale),
        translations: custom ?? registeredTexts(locale) ?? messages[language as keyof typeof messages] ?? en,
    };
}

// Zero digits of the numbering systems localizeDigits reads: Latin, Arabic-Indic, Persian, Devanagari, Bengali, Thai,
// full width
const digitZeros = [0x30, 0x660, 0x6f0, 0x966, 0x9e6, 0xe50, 0xff10];
const digitValue = (char: string) => {
    const code = char.codePointAt(0) ?? 0;
    const zero = digitZeros.find((start) => code >= start && code <= start + 9);
    return zero === undefined ? -1 : code - zero;
};
const numberFormats = new Map<string, { format: (value: number) => string; digits: string[] }>();
const numberFormatOf = (locale: string) => {
    let entry = numberFormats.get(locale);
    if (!entry) {
        let format: Intl.NumberFormat;
        try {
            format = new Intl.NumberFormat(locale, { useGrouping: 'min2' });
        } catch {
            format = new Intl.NumberFormat(defaultLocale, { useGrouping: 'min2' });
        }
        entry = {
            format: (value) => format.format(value),
            digits: Array.from({ length: 10 }, (_, digit) => format.format(digit)),
        };
        numberFormats.set(locale, entry);
    }
    return entry;
};
// Between the parts of a date, a time, a decimal or an already grouped number
const numberJoint = /[.,:/'’\-\s\u066b\u066c]/;
const isDigit = (char: string | undefined) => char !== undefined && /\p{Nd}/u.test(char);
const isLatinLetter = (char: string | undefined) => char !== undefined && /[A-Za-z]/.test(char);

/**
 * Numbers in a text in the digits of the locale ("ar-EG": "الصفحة ٣ من ١٠"); whole numbers from 10 000 on are grouped
 * like Intl.NumberFormat ("12.345" in de-DE). Digits next to Latin letters ("Q1", "F6"), parts of dates, times and
 * decimals keep their form and only change their digits; the strings in `keep` (names, labels) stay as they are.
 */
export function localizeDigits(text: string, locale: string, keep: readonly string[] = []): string {
    if (!/\p{Nd}/u.test(text)) return text;
    const { format, digits } = numberFormatOf(locale);
    const kept: [number, number][] = [];
    for (const value of keep) {
        if (!value || !/\p{Nd}/u.test(value)) continue;
        for (let index = text.indexOf(value); index >= 0; index = text.indexOf(value, index + value.length))
            kept.push([index, index + value.length]);
    }
    return text.replace(/\p{Nd}+/gu, (run: string, offset: number) => {
        const end = offset + run.length;
        if (kept.some(([start, stop]) => offset < stop && end > start)) return run;
        if (isLatinLetter(text[offset - 1]) || isLatinLetter(text[end])) return run;
        const values = [...run].map(digitValue);
        if (values.includes(-1)) return run;
        const joined =
            (numberJoint.test(text[offset - 1] ?? '') && isDigit(text[offset - 2])) ||
            (numberJoint.test(text[end] ?? '') && isDigit(text[end + 1]));
        if (values.length >= 5 && values[0] !== 0 && !joined) return format(Number(values.join('')));
        return values.map((value) => digits[value]).join('');
    });
}

const localized = new WeakMap<object, Map<string, Translations>>();

/**
 * The texts with every number in their results formatted for the locale (see localizeDigits) – Arabic texts show
 * Arabic-Indic digits throughout in "ar-EG", Latin ones in "ar-MA". Text arguments (names, labels) stay unchanged.
 * LocaleProvider applies it; the result is cached per texts and locale.
 */
export function localizeTexts(texts: Translations, locale: string): Translations {
    let byLocale = localized.get(texts);
    if (!byLocale) localized.set(texts, (byLocale = new Map()));
    let result = byLocale.get(locale);
    if (!result) {
        const wrap = (value: unknown): unknown => {
            if (typeof value === 'function')
                return (...args: unknown[]) => {
                    const text: unknown = value(...args);
                    return typeof text === 'string'
                        ? localizeDigits(
                              text,
                              locale,
                              args.filter((arg): arg is string => typeof arg === 'string')
                          )
                        : text;
                };
            if (value && typeof value === 'object' && !Array.isArray(value))
                return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, wrap(child)]));
            return value;
        };
        result = wrap(texts) as Translations;
        byLocale.set(locale, result);
    }
    return result;
}

/** resolveLocale with localized numbers in the texts (localizeTexts) – what LocaleProvider passes on */
export function resolveLocalizedLocale(locale: string = defaultLocale, custom?: Translations): ResolvedLocale {
    const resolved = resolveLocale(locale, custom);
    return { ...resolved, translations: localizeTexts(resolved.translations, resolved.locale) };
}

/** 1536 → "1,5 kB" */
export function formatFileSize(bytes: number, locale = defaultLocale): string {
    const units = ['B', 'kB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: unit ? 1 : 0 }).format(value)} ${units[unit]}`;
}

/** NumberInput without formatOptions: locale formatting, no rounding of decimals */
export const defaultNumberFormat: Intl.NumberFormatOptions = { maximumFractionDigits: 20 };

/**
 * A number as Ark's NumberInput expects it: formatted for the locale ("1.234,5"). Ark parses its value with the
 * locale – "1234.5" would become 12345 in German.
 */
export function toNumberInputValue(
    value: number | null | undefined,
    locale: string,
    options: Intl.NumberFormatOptions = defaultNumberFormat
): string | undefined {
    if (value === undefined) return undefined;
    return value === null || Number.isNaN(value) ? '' : new Intl.NumberFormat(locale, options).format(value);
}

/** Decimal and group separator of a locale: "de-DE" → { decimal: ',', group: '.' } */
export function numberSeparators(locale = defaultLocale): { decimal: string; group: string } {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    return {
        decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
        group: parts.find((part) => part.type === 'group')?.value ?? ',',
    };
}

/**
 * CSV separator a spreadsheet in the locale opens: ";" where numbers have a decimal comma ("de-DE": 1,5 – the comma
 * would split the number), "," otherwise
 */
export function csvSeparator(locale = defaultLocale): string {
    return numberSeparators(locale).decimal === ',' ? ';' : ',';
}

/**
 * Reads a number typed or pasted in either notation – "1.234,5", "1,234.5", "1234,5" and "1234.5" all give 1234.5.
 * With both separators the last one is the decimal separator; a single separator before exactly three digits is a
 * group separator if the locale uses it as such ("1.500" is 1500 in German, 1.5 in English), otherwise a decimal
 * separator; repeated separators group. Other characters (currency, units, spaces) are ignored. Null without digits.
 */
export function parseLocaleNumber(text: string, locale = defaultLocale): number | null {
    const firstDigit = text.search(/\d/);
    if (firstDigit < 0) return null;
    const negative = /[-−]/.test(text.slice(0, firstDigit));
    let digits = text.replace(/[^\d.,]/g, '');
    const lastDot = digits.lastIndexOf('.');
    const lastComma = digits.lastIndexOf(',');
    if (lastDot >= 0 && lastComma >= 0) {
        const decimalAt = Math.max(lastDot, lastComma);
        digits = `${digits.slice(0, decimalAt).replace(/[.,]/g, '')}.${digits.slice(decimalAt + 1).replace(/[.,]/g, '')}`;
    } else if (lastDot >= 0 || lastComma >= 0) {
        const separator = lastDot >= 0 ? '.' : ',';
        const count = digits.split(separator).length - 1;
        const after = digits.length - digits.lastIndexOf(separator) - 1;
        const grouping = count > 1 || (after === 3 && numberSeparators(locale).group === separator);
        digits = grouping ? digits.replaceAll(separator, '') : digits.replace(separator, '.');
    }
    const value = Number(digits);
    if (Number.isNaN(value)) return null;
    return negative ? -value : value;
}

/**
 * What a key does in a number field: "." and "," (also on the numpad) insert the decimal separator of the locale, so
 * both work in every language; a second decimal separator, decimals without `allowDecimal` and a minus without
 * `allowNegative` are blocked. `rest` is the text without the selection. Undefined: the browser handles the key.
 */
export function numberInputKey(
    key: string,
    rest: string,
    locale = defaultLocale,
    options: { allowDecimal?: boolean; allowNegative?: boolean } = {}
): { insert: string } | 'block' | undefined {
    if (key === '.' || key === ',') {
        const { decimal } = numberSeparators(locale);
        if (options.allowDecimal === false || rest.includes(decimal)) return 'block';
        return { insert: decimal };
    }
    if ((key === '-' || key === '−') && options.allowNegative === false) return 'block';
    return undefined;
}
