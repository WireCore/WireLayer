// German texts of the components – they define the shape of every language (Translations in ../i18n.ts). Not built
// in, so they cost nothing until imported: registerLocale('de', de) at app start, or
// <LocaleProvider locale="de-DE" :translations="de">.
import type { PluralForms } from '../i18n.js';

type CalendarView = 'day' | 'month' | 'year';

const next: Record<CalendarView, string> = {
    day: 'Nächster Monat',
    month: 'Nächstes Jahr',
    year: 'Nächstes Jahrzehnt',
};
const previous: Record<CalendarView, string> = {
    day: 'Vorheriger Monat',
    month: 'Vorheriges Jahr',
    year: 'Vorheriges Jahrzehnt',
};
const viewNames: Record<CalendarView, string> = { day: 'Tage', month: 'Monate', year: 'Jahre' };

export const de = {
    common: {
        close: 'Schließen',
        cancel: 'Abbrechen',
        confirm: 'Bestätigen',
        placeholder: 'Bitte wählen',
        loading: 'Wird geladen',
        empty: 'Keine Einträge',
        noResults: 'Keine Treffer',
        selectedCount: (count: number) => `${count} ausgewählt`,
    },
    toast: { label: 'Benachrichtigungen' },
    menu: { title: 'Aktionen', search: 'Menü durchsuchen' },
    menubar: { menu: 'Menü' },
    dialog: { maximize: 'Maximieren', restore: 'Verkleinern' },
    /** confirm() and prompt() */
    confirm: {
        typeToConfirm: (text: string) => `Zur Bestätigung „${text}“ eingeben`,
        mismatch: 'Die Eingabe stimmt nicht überein',
    },
    breadcrumb: { label: 'Pfad', more: 'Ausgeblendete Ebenen' },
    siteHeader: { navigation: 'Hauptnavigation', menu: 'Menü' },
    modeToggle: { light: 'Helles Design aktivieren', dark: 'Dunkles Design aktivieren' },
    pagination: {
        rootLabel: 'Seitennavigation',
        prevTriggerLabel: 'Vorherige Seite',
        nextTriggerLabel: 'Nächste Seite',
        itemLabel: (details: { page: number; totalPages: number }) => `Seite ${details.page} von ${details.totalPages}`,
        summary: (range: { start: number; end: number; count: number }) =>
            `${range.start}–${range.end} von ${range.count}`,
        firstTriggerLabel: 'Erste Seite',
        lastTriggerLabel: 'Letzte Seite',
        /** Compact variant: the current page between the arrows */
        compact: (page: number, totalPages: number) => `Seite ${page} von ${totalPages}`,
        pageSize: 'Pro Seite',
        jumper: 'Gehe zu Seite',
    },
    saveStatus: {
        idle: '',
        saving: 'Wird gespeichert …',
        saved: 'Gespeichert',
        error: 'Speichern fehlgeschlagen',
    },
    slider: { thumbs: ['Minimum', 'Maximum'] },
    numberInput: { incrementLabel: 'Erhöhen', decrementLabel: 'Verringern' },
    passwordInput: {
        visibilityTrigger: (visible: boolean): string => (visible ? 'Passwort verbergen' : 'Passwort anzeigen'),
    },
    combobox: { triggerLabel: 'Vorschläge anzeigen', clearTriggerLabel: 'Eingabe löschen', search: 'Suchen …' },
    datePicker: {
        dayCell: (state: { valueText: string; selected: boolean; unavailable: boolean }) =>
            state.unavailable
                ? `Nicht verfügbar: ${state.valueText}`
                : state.selected
                  ? `Ausgewählt: ${state.valueText}`
                  : state.valueText,
        nextTrigger: (view: CalendarView) => next[view],
        prevTrigger: (view: CalendarView) => previous[view],
        viewTrigger: (_view: CalendarView, nextView: CalendarView | undefined) =>
            nextView ? `${viewNames[nextView]} anzeigen` : 'Ansicht wechseln',
        monthSelect: 'Monat wählen',
        yearSelect: 'Jahr wählen',
        clearTrigger: 'Datum löschen',
        trigger: (open: boolean): string => (open ? 'Kalender schließen' : 'Kalender öffnen'),
        content: 'Kalender',
        placeholder: () => ({ year: 'JJJJ', month: 'MM', day: 'TT' }),
        /** Name of the week column (its visible header is weekColumnShort) */
        weekColumnHeader: 'Kalenderwoche',
        weekColumnShort: 'KW',
        weekNumberCell: (week: number) => `Kalenderwoche ${week}`,
        presetTrigger: (value: string[]) => value.join(' – '),
    },
    /** Calendar extras: button bar, several chosen days, time zone */
    calendar: {
        today: 'Heute',
        clear: 'Löschen',
        /** Field of a DatePicker with selectionMode multiple */
        noDates: 'Kein Datum gewählt',
        datesSelected: { one: '{count} Tag ausgewählt', other: '{count} Tage ausgewählt' } as PluralForms,
        timeZone: (name: string) => `Zeitzone: ${name}`,
    },
    quarterPicker: {
        /** Text of a quarter in the field and on its button */
        quarter: (quarter: number, year: number) => `Q${quarter} ${year}`,
        /** Name of a quarter button: its text and the months */
        quarterButton: (quarter: number, year: number, months: string) => `Q${quarter} ${year}, ${months}`,
        trigger: 'Quartal wählen',
        content: 'Quartale',
        prevYear: 'Vorheriges Jahr',
        nextYear: 'Nächstes Jahr',
        clearTrigger: 'Quartal löschen',
        placeholder: 'Q1 2026',
    },
    durationInput: {
        clearTrigger: 'Dauer löschen',
        days: 'Tage',
        hours: 'Stunden',
        minutes: 'Minuten',
        seconds: 'Sekunden',
    },
    timeGrid: {
        label: 'Freie Termine',
        empty: 'Keine freien Termine',
        loading: 'Termine werden geladen',
        available: { one: '{count} freier Termin', other: '{count} freie Termine' } as PluralForms,
    },
    miniCalendar: {
        label: 'Tage',
        previous: 'Vorherige Tage',
        next: 'Nächste Tage',
    },
    /** DateInput: placeholders of the parts and names of their spin buttons */
    dateInput: {
        placeholder: () => ({
            day: 'TT',
            month: 'MM',
            year: 'JJJJ',
            hour: 'hh',
            minute: 'mm',
            second: 'ss',
            dayPeriod: '--',
            era: '--',
        }),
    },
    splitButton: { more: 'Weitere Aktionen' },
    confirmPopup: { confirm: 'Ja', cancel: 'Abbrechen' },
    passwordStrength: {
        levels: ['Zu kurz', 'Schwach', 'Mittel', 'Gut', 'Stark'],
        label: (level: string) => `Passwortstärke: ${level}`,
    },
    /** Field and text controls (Input, Textarea, PasswordInput, NumberInput …) */
    field: { optional: 'optional', clear: 'Eingabe löschen' },
    textarea: {
        /** Visible counter */
        counter: (length: number, max: number) => `${length} / ${max}`,
        /** Announced after typing pauses */
        remaining: (remaining: number, max: number) =>
            remaining <= 0 ? `Höchstlänge von ${max} Zeichen erreicht` : `Noch ${remaining} von ${max} Zeichen`,
    },
    formErrorSummary: {
        title: (count: number) =>
            count === 1 ? 'Bitte korrigieren Sie 1 Angabe' : `Bitte korrigieren Sie ${count} Angaben`,
    },
    passwordRequirements: { label: 'Anforderungen an das Passwort', met: 'erfüllt', unmet: 'nicht erfüllt' },
    dataView: {
        layout: 'Ansicht',
        list: 'Liste',
        grid: 'Raster',
        loadMore: 'Mehr laden',
        /** Names the list of loading placeholders */
        loading: 'Einträge werden geladen',
        shown: (count: number, total: number) => `${count} von ${total} angezeigt`,
    },
    orderList: {
        top: 'Ganz nach oben',
        up: 'Nach oben',
        down: 'Nach unten',
        bottom: 'Ganz nach unten',
        moved: (label: string, position: number, count: number) => `${label}: Position ${position} von ${count}`,
    },
    pickList: {
        source: 'Verfügbar',
        target: 'Ausgewählt',
        add: 'Ausgewählte hinzufügen',
        addAll: 'Alle hinzufügen',
        remove: 'Ausgewählte entfernen',
        removeAll: 'Alle entfernen',
        moved: (count: number, target: string) =>
            `${count === 1 ? '1 Eintrag' : `${count} Einträge`} nach „${target}“ verschoben`,
        /** Search field of one list */
        filter: (list: string) => `${list} durchsuchen`,
        /** Drag and drop: where the dragged items go */
        dropHint: (list: string) => `Hierher ziehen: ${list}`,
    },
    appShell: {
        skipLink: 'Zum Inhalt springen',
        openNavigation: 'Navigation öffnen',
        navigation: 'Navigation',
        collapseNavigation: 'Navigation einklappen',
        expandNavigation: 'Navigation ausklappen',
        resizeNavigation: 'Breite der Navigation ändern',
        resizeAside: 'Breite der Seitenleiste ändern',
    },
    commandPalette: {
        label: 'Befehle',
        placeholder: 'Suchen oder Befehl eingeben …',
        empty: 'Nichts gefunden',
        navigate: 'auswählen',
        run: 'ausführen',
        close: 'schließen',
    },
    /** Option lists: Select, MultiSelect, Combobox, Listbox, TagsInput suggestions */
    select: {
        clear: 'Auswahl löschen',
        filter: 'Optionen filtern',
        selectAll: 'Alle auswählen',
        removeItem: (label: string) => `${label} entfernen`,
        removed: (label: string) => `${label} entfernt`,
        maxReached: (max: number) => `Höchstens ${max} auswählbar`,
        suggestions: 'Vorschläge',
    },
    /** Standalone Chip: name of the remove button */
    chip: { remove: (label?: string): string => (label ? `${label} entfernen` : 'Entfernen') },
    tagsInput: {
        clearTriggerLabel: 'Alle entfernen',
        deleteTagTriggerLabel: (value: string) => `${value} entfernen`,
        tagAdded: (value: string) => `${value} hinzugefügt`,
        tagsPasted: (values: string[]) => `${values.length} Einträge eingefügt`,
        tagEdited: (value: string) => `${value} wird bearbeitet`,
        tagUpdated: (value: string) => `${value} geändert`,
        tagDeleted: (value: string) => `${value} entfernt`,
        tagSelected: (value: string) => `${value} ausgewählt, Rücktaste zum Entfernen`,
    },
    navigationMenu: { rootLabel: 'Hauptnavigation' },
    megaMenu: {
        rootLabel: 'Hauptnavigation',
        /** Menu button and drawer title on small screens */
        menu: 'Menü',
        /** Chevron button next to an entry that is a link itself */
        submenu: (label: string) => `${label}: Untermenü`,
        showAll: 'Alle anzeigen',
        showAllOf: (title: string) => `Alle anzeigen: ${title}`,
        /** Link of the featured area */
        featuredLink: 'Mehr erfahren',
        /** In the drawer: link to the page of an entry that also has a panel */
        overview: (label: string) => `${label} – Übersicht`,
    },
    pageHeader: { back: 'Zurück' },
    bottomNavigation: { label: 'Navigation' },
    banner: { dismiss: 'Hinweis schließen' },
    notificationCenter: {
        label: 'Benachrichtigungen',
        markAllRead: 'Alle als gelesen markieren',
        markRead: 'Als gelesen markieren',
        unread: 'Ungelesen',
        unreadCount: (count: number | string) => `${count} ungelesen`,
        empty: 'Keine Benachrichtigungen',
        loadMore: 'Mehr laden',
        older: 'Älter',
        /** Polite announcement of new notifications */
        announce: (count: number, title: string) =>
            count === 1 ? `Neue Benachrichtigung: ${title}` : `${count} neue Benachrichtigungen`,
    },
    result: {
        success: 'Erledigt',
        info: 'Hinweis',
        warn: 'Achtung',
        error: 'Etwas ist schiefgelaufen',
        '403': 'Kein Zugriff',
        '404': 'Seite nicht gefunden',
        '500': 'Serverfehler',
        description403: 'Sie haben keine Berechtigung, diese Seite zu sehen.',
        description404: 'Die Seite existiert nicht oder wurde verschoben.',
        description500: 'Auf dem Server ist ein Fehler aufgetreten. Bitte versuchen Sie es später noch einmal.',
    },
    tour: {
        nextStep: 'Weiter',
        prevStep: 'Zurück',
        close: 'Tour beenden',
        skip: 'Überspringen',
        done: 'Fertig',
        progressText: (details: { current: number; total: number }) => `${details.current + 1} von ${details.total}`,
    },
    tableOfContents: { title: 'Auf dieser Seite' },
    spoiler: { show: 'Mehr anzeigen', hide: 'Weniger anzeigen' },
    navigationProgress: { label: 'Seite wird geladen' },
    copyButton: { label: 'Kopieren', copied: 'In die Zwischenablage kopiert' },
    actionBar: { label: 'Aktionen für die Auswahl', clear: 'Auswahl aufheben' },
    heatmap: { less: 'Weniger', more: 'Mehr', empty: 'kein Wert' },
    scheduler: {
        /** React Native: accessibility actions that move an event (±slot, ±day) */
        shift: (minutes: number, days: number) =>
            days
                ? `${Math.abs(days) === 1 ? '1 Tag' : `${Math.abs(days)} Tage`} ${days > 0 ? 'später' : 'früher'}`
                : `${Math.abs(minutes)} Minuten ${minutes > 0 ? 'später' : 'früher'}`,
        label: 'Kalender',
        today: 'Heute',
        previous: 'Zurück',
        next: 'Weiter',
        view: 'Ansicht',
        views: {
            day: 'Tag',
            week: 'Woche',
            month: 'Monat',
            agenda: 'Liste',
            timeline: 'Zeitachse',
            year: 'Jahr',
        } as Record<string, string>,
        allDay: 'Ganztägig',
        more: (count: number) => `+${count} weitere`,
        newEvent: (date: string) => `Neuer Termin am ${date}`,
        empty: 'Keine Termine',
        changed: (title: string, when: string) => `${title}: ${when}`,
        /** Resources */
        resource: 'Ressource',
        allResources: 'Alle Ressourcen',
        previousResources: 'Vorherige Ressourcen',
        nextResources: 'Nächste Ressourcen',
        resourceRange: (from: number, to: number, count: number) => `Ressourcen ${from}–${to} von ${count}`,
        resourceFilter: 'Ressource',
        newEventFor: (resource: string, date: string) => `Neuer Termin für ${resource} am ${date}`,
        /** Timeline */
        range: 'Zeitraum',
        ranges: { day: 'Tag', week: 'Woche', month: 'Monat' } as Record<string, string>,
        zoomIn: 'Vergrößern',
        zoomOut: 'Verkleinern',
        /** Series */
        series: 'Serientermin',
        seriesTitle: 'Serientermin ändern',
        seriesQuestion: (title: string) => `„${title}“ gehört zu einer Serie. Was soll sich ändern?`,
        onlyThis: 'Nur dieser Termin',
        allInSeries: 'Alle Termine der Serie',
        /** Rules for dropping */
        rejected: (title: string, reason: string) => `${title} lässt sich hier nicht ablegen: ${reason}`,
        notAllowed: 'nicht erlaubt',
        overlaps: (title: string) => `überschneidet sich mit ${title}`,
        /** Year view and "+N more" */
        eventCount: { one: '{count} Termin', other: '{count} Termine' } as PluralForms,
        closed: 'Außerhalb der Geschäftszeiten',
        loading: 'Termine werden geladen',
        loaded: { one: '{count} Termin geladen', other: '{count} Termine geladen' } as PluralForms,
        error: 'Die Termine konnten nicht geladen werden.',
        retry: 'Erneut versuchen',
    },
    recurrence: {
        DAILY: { one: 'Täglich', other: 'Alle {count} Tage' } as PluralForms,
        WEEKLY: { one: 'Wöchentlich', other: 'Alle {count} Wochen' } as PluralForms,
        MONTHLY: { one: 'Monatlich', other: 'Alle {count} Monate' } as PluralForms,
        YEARLY: { one: 'Jährlich', other: 'Alle {count} Jahre' } as PluralForms,
        on: (what: string) => `am ${what}`,
        /** "2. Montag", "letzten Freitag" */
        nthWeekday: (nth: number, weekday: string) =>
            nth === -1 ? `letzten ${weekday}` : nth < 0 ? `${-nth}.-letzten ${weekday}` : `${nth}. ${weekday}`,
        /** Monthly by position: "Jeden 2. Montag im Monat" */
        monthlyNth: (what: string) => `Jeden ${what} im Monat`,
        /** Day of the month: "15.", "letzten Tag" */
        monthDay: (day: number) => (day === -1 ? 'letzten Tag' : day < 0 ? `${-day}.-letzten Tag` : `${day}.`),
        /** Yearly: "2. Montag im Mai", "24. Dezember" */
        inMonth: (what: string, month: string) => `${what} im ${month}`,
        dayOfMonth: (day: string, month: string) => `${day} ${month}`,
        times: { one: 'einmal', other: '{count} Mal' } as PluralForms,
        until: (date: string) => `bis ${date}`,
    },
    gantt: {
        label: 'Projektplan',
        task: 'Aufgabe',
        start: 'Start',
        end: 'Ende',
        duration: 'Dauer',
        days: { one: '{count} Tag', other: '{count} Tage' } as PluralForms,
        milestone: 'Meilenstein',
        group: 'Gruppe',
        progress: (percent: number) => `${percent} % erledigt`,
        dependsOn: (names: string) => `hängt ab von ${names}`,
        critical: 'kritischer Pfad',
        zoom: 'Zoom',
        zooms: { day: 'Tag', week: 'Woche', month: 'Monat', quarter: 'Quartal' } as Record<string, string>,
        today: 'Heute',
        week: (week: number) => `KW ${week}`,
        quarter: (quarter: number) => `Q${quarter}`,
        changed: (name: string, when: string) => `${name}: ${when}`,
        progressChanged: (name: string, percent: number) => `${name}: ${percent} % erledigt`,
        linked: (from: string, to: string) => `${to} hängt jetzt von ${from} ab`,
        addDependency: 'Abhängigkeit hinzufügen…',
        dependencyTitle: (name: string) => `Vorgänger von „${name}“`,
        predecessor: 'Vorgänger',
        noPredecessor: 'Keine Aufgabe möglich',
        addDependencyConfirm: 'Hinzufügen',
        empty: 'Keine Aufgaben',
    },
    codeHighlight: {
        copy: 'Code kopieren',
        showMore: 'Gesamten Code anzeigen',
        showLess: 'Code einklappen',
        wrap: 'Zeilen umbrechen',
        files: 'Dateien',
        added: 'hinzugefügt',
        removed: 'entfernt',
    },
    pdfViewer: {
        label: 'PDF-Dokument',
        toolbar: 'PDF-Werkzeuge',
        pages: 'Seiten des Dokuments',
        sidebar: 'Seitenleiste',
        thumbnails: 'Seiten',
        outline: 'Inhalt',
        noOutline: 'Kein Inhaltsverzeichnis',
        pageLabel: (page: number) => `Seite ${page}`,
        page: 'Seite',
        ofPages: (count: number) => `von ${count}`,
        pageStatus: (page: number, count: number) => `Seite ${page} von ${count}`,
        previousPage: 'Vorherige Seite',
        nextPage: 'Nächste Seite',
        zoom: 'Zoom',
        zoomIn: 'Vergrößern',
        zoomOut: 'Verkleinern',
        pageWidth: 'Seitenbreite',
        pageFit: 'Ganze Seite',
        rotate: 'Im Uhrzeigersinn drehen',
        search: 'Suchen',
        searchField: 'Im Dokument suchen',
        matchCase: 'Groß-/Kleinschreibung beachten',
        previousMatch: 'Vorheriger Treffer',
        nextMatch: 'Nächster Treffer',
        closeSearch: 'Suche schließen',
        matches: (current: number, total: number) => `Treffer ${current} von ${total}`,
        noMatches: 'Keine Treffer',
        searching: 'Wird gesucht …',
        wrappedTop: 'weiter am Ende',
        wrappedBottom: 'weiter am Anfang',
        download: 'Herunterladen',
        print: 'Drucken',
        printing: (page: number, count: number) => `Druck wird vorbereitet: Seite ${page} von ${count}`,
        fullscreen: 'Vollbild',
        loading: 'PDF wird geladen',
        loaded: (count: number) => (count === 1 ? 'PDF geladen, 1 Seite' : `PDF geladen, ${count} Seiten`),
        error: 'Das PDF konnte nicht geladen werden.',
        invalid: 'Die Datei ist kein gültiges PDF oder beschädigt.',
        missing: 'Das PDF wurde nicht gefunden.',
        passwordTitle: 'Geschütztes PDF',
        passwordDescription: 'Geben Sie das Passwort ein, um das Dokument zu öffnen.',
        passwordLabel: 'Passwort',
        passwordWrong: 'Das Passwort ist falsch. Bitte erneut versuchen.',
        passwordSubmit: 'Öffnen',
        passwordRequired: 'Ohne Passwort lässt sich das PDF nicht öffnen.',
        fileName: 'dokument.pdf',
        /** React Native: share or open the file; the web has no viewer for react-native-pdf */
        share: 'Teilen',
        unsupported: 'Die PDF-Ansicht gibt es nur in der App (iOS und Android).',
    },
    compare: {
        label: 'Vorher-Nachher-Vergleich',
        before: 'Vorher',
        after: 'Nachher',
        valueText: (percent: number) => `${percent} % vorher, ${100 - percent} % nachher`,
    },
    sankey: { source: 'Von', target: 'Nach', value: 'Wert' },
    treemap: { share: (value: string, percent: string) => `${value} · ${percent}` },
    countdown: {
        days: (count: number): string => (count === 1 ? 'Tag' : 'Tage'),
        hours: (count: number): string => (count === 1 ? 'Stunde' : 'Stunden'),
        minutes: (count: number): string => (count === 1 ? 'Minute' : 'Minuten'),
        seconds: (count: number): string => (count === 1 ? 'Sekunde' : 'Sekunden'),
    },
    rangePresets: {
        thisWeek: 'Diese Woche',
        lastWeek: 'Letzte Woche',
        thisMonth: 'Dieser Monat',
        lastMonth: 'Letzter Monat',
        thisQuarter: 'Dieses Quartal',
        lastQuarter: 'Letztes Quartal',
        thisYear: 'Dieses Jahr',
        lastYear: 'Letztes Jahr',
        last3Days: 'Letzte 3 Tage',
        last7Days: 'Letzte 7 Tage',
        last14Days: 'Letzte 14 Tage',
        last30Days: 'Letzte 30 Tage',
        last90Days: 'Letzte 90 Tage',
        last3Months: 'Letzte 3 Monate',
        last6Months: 'Letzte 6 Monate',
        last12Months: 'Letzte 12 Monate',
        last4Quarters: 'Letzte 4 Quartale',
        last3Years: 'Letzte 3 Jahre',
        last5Years: 'Letzte 5 Jahre',
    } as Record<string, string>,
    splitter: { resize: (panel: string) => `Größe von „${panel}“ ändern` },
    image: {
        preview: (alt: string) => `Vergrößert anzeigen: ${alt}`,
        zoomIn: 'Vergrößern',
        zoomOut: 'Verkleinern',
        rotate: 'Drehen',
        close: 'Schließen',
    },
    inplace: { edit: 'bearbeiten' },
    scrollTop: { label: 'Nach oben' },
    blockUi: { label: 'Wird geladen' },
    speedDial: { label: 'Aktionen' },
    stepper: {
        prev: 'Zurück',
        next: 'Weiter',
        finish: 'Abschließen',
        /** React Native: status of a step and the progress */
        status: { done: 'abgeschlossen', active: 'aktueller Schritt', todo: 'offen' } as Record<string, string>,
        progress: (step: number, count: number) => `Schritt ${step} von ${count}`,
    },
    dataTable: {
        row: (index: number) => `Zeile ${index + 1}`,
        selectAll: 'Alle Zeilen dieser Seite auswählen',
        selectRow: (row: string) => `${row} auswählen`,
        subRows: (row: string) => `Unterzeilen von ${row}`,
        search: (caption: string) => `${caption} durchsuchen`,
        searchPlaceholder: 'Suchen …',
        filter: (header: string) => `${header} filtern`,
        filterAll: 'Alle',
        columns: 'Spalten',
        export: 'Exportieren (CSV)',
        resize: (header: string) => `Breite von ${header}`,
        edit: (header: string, value: string) => `${value || 'leer'}, ${header} bearbeiten`,
        results: (count: number) => (count === 1 ? '1 Eintrag' : `${count} Einträge`),
        group: (header: string, value: string, count: number) => `${header}: ${value}, ${count} Einträge`,
        matchModes: {
            startsWith: 'Beginnt mit',
            contains: 'Enthält',
            notContains: 'Enthält nicht',
            endsWith: 'Endet mit',
            equals: 'Ist gleich',
            notEquals: 'Ist nicht gleich',
            lt: 'Kleiner als',
            lte: 'Kleiner oder gleich',
            gt: 'Größer als',
            gte: 'Größer oder gleich',
            between: 'Zwischen',
            in: 'Ist eins von',
            dateIs: 'Am',
            dateIsNot: 'Nicht am',
            dateBefore: 'Vor',
            dateAfter: 'Nach',
        } as Record<string, string>,
        operator: 'Verknüpfung',
        matchAll: 'Alle Bedingungen erfüllt',
        matchAny: 'Eine Bedingung erfüllt',
        matchMode: (index: number) => `Bedingung ${index + 1}`,
        value: (index: number) => `Wert ${index + 1}`,
        from: 'Von',
        to: 'Bis',
        addRule: 'Bedingung hinzufügen',
        removeRule: (index: number) => `Bedingung ${index + 1} entfernen`,
        apply: 'Anwenden',
        clear: 'Zurücksetzen',
        filterMenu: (header: string, active: boolean) =>
            active ? `Filter für ${header}, aktiv` : `Filter für ${header}`,
        yes: 'Ja',
        no: 'Nein',
        columnMenu: (header: string) => `Optionen für ${header}`,
        sortAscending: 'Aufsteigend sortieren',
        sortDescending: 'Absteigend sortieren',
        clearSort: 'Sortierung entfernen',
        /** React Native: sheets for sorting and the column filters */
        sortBy: 'Sortieren',
        filters: 'Filter',
        sortPriority: (position: number, desc: boolean) =>
            `${position}. Sortierung, ${desc ? 'absteigend' : 'aufsteigend'}`,
        pinStart: 'Am Anfang fixieren',
        pinEnd: 'Am Ende fixieren',
        unpin: 'Nicht mehr fixieren',
        moveEarlier: 'Eine Spalte nach vorne',
        moveLater: 'Eine Spalte nach hinten',
        hideColumn: 'Ausblenden',
        groupBy: 'Nach dieser Spalte gruppieren',
        ungroup: 'Gruppierung aufheben',
        columnMoved: (header: string, position: number, count: number) =>
            `${header} ist jetzt Spalte ${position} von ${count}`,
        density: 'Zeilenhöhe',
        densities: { sm: 'Kompakt', md: 'Normal', lg: 'Großzügig' },
        fullscreen: 'Vollbild',
        exitFullscreen: 'Vollbild beenden',
        rowNumber: 'Nr.',
        expandAll: 'Alle Zeilen aufklappen',
        collapseAll: 'Alle Zeilen zuklappen',
        details: (row: string) => `Details zu ${row}`,
        actions: 'Aktionen',
        rowActions: (row: string) => `Aktionen für ${row}`,
        moveRow: (row: string) => `${row} verschieben`,
        rowMoved: (row: string, position: number, count: number) =>
            `${row} ist jetzt an Position ${position} von ${count}`,
        editRow: (row: string) => `${row} bearbeiten`,
        saveRow: (row: string) => `${row} speichern`,
        cancelEdit: (row: string) => `Bearbeiten von ${row} abbrechen`,
        rowsPerPage: 'Zeilen pro Seite',
        exportAll: 'Alle Zeilen',
        exportSelection: 'Ausgewählte Zeilen',
        filterToggle: 'Filter anzeigen',
        rowCount: (count: number) => (count === 1 ? '1 Zeile' : `${count} Zeilen`),
        filteredCount: (count: number) => `${count} gefiltert`,
        copy: (header: string, value: string) => `${value}, ${header} kopieren`,
        selectAllRows: 'Alle Zeilen auswählen',
        select: 'Auswahl',
        reorder: 'Reihenfolge',
        footer: 'Summenzeile',
        aggregates: {
            sum: (value: string) => `Summe ${value}`,
            avg: (value: string) => `Ø ${value}`,
            min: (value: string) => `Min. ${value}`,
            max: (value: string) => `Max. ${value}`,
            count: (value: string) => `Anzahl ${value}`,
        } as Record<string, (value: string) => string>,
        exportMenu: 'Exportieren',
        exportXlsx: 'Exportieren (Excel)',
        exportAs: (format: 'csv' | 'xlsx', selection: boolean) =>
            `${selection ? 'Ausgewählte Zeilen' : 'Alle Zeilen'} als ${format === 'xlsx' ? 'Excel' : 'CSV'}`,
        cellsCopied: (count: number) => (count === 1 ? '1 Zelle kopiert' : `${count} Zellen kopiert`),
        cellsPasted: (count: number, invalid: number) =>
            `${count === 1 ? '1 Zelle' : `${count} Zellen`} eingefügt${invalid ? `, ${invalid} ungültig` : ''}`,
        pasteErrors: {
            number: 'Keine Zahl',
            date: 'Kein Datum',
            option: 'Keine der Auswahlmöglichkeiten',
            boolean: 'Weder Ja noch Nein',
            readonly: 'Nicht bearbeitbar',
        } as Record<string, string>,
        changes: (count: number) => (count === 1 ? '1 Änderung' : `${count} Änderungen`),
        changed: 'geändert',
        saveChanges: 'Speichern',
        discardChanges: 'Verwerfen',
        changesSaved: (count: number) => (count === 1 ? '1 Änderung gespeichert' : `${count} Änderungen gespeichert`),
        changesDiscarded: 'Änderungen verworfen',
        undo: 'Rückgängig',
        redo: 'Wiederholen',
        undone: (count: number) => (count === 1 ? '1 Zelle zurückgesetzt' : `${count} Zellen zurückgesetzt`),
        redone: (count: number) => (count === 1 ? '1 Zelle wiederhergestellt' : `${count} Zellen wiederhergestellt`),
        rowMovedToGroup: (row: string, group: string, position: number, count: number) =>
            `${row} ist jetzt in ${group}, Position ${position} von ${count}`,
        rowMovedInTree: (row: string, parent: string | null, position: number, count: number) =>
            `${row} verschoben${parent ? ` nach ${parent}` : ''}, Position ${position} von ${count}`,
        find: 'In Tabelle suchen',
        findMatches: (current: number, total: number) => (total ? `Treffer ${current} von ${total}` : 'Keine Treffer'),
        findNext: 'Nächster Treffer',
        findPrevious: 'Vorheriger Treffer',
        findClose: 'Suche schließen',
        total: 'Gesamt',
        columnGroupEarlier: (header: string) => `${header} nach vorne`,
        columnGroupLater: (header: string) => `${header} nach hinten`,
    },
    dataSource: {
        loading: 'Wird geladen',
        loaded: { one: '{count} Eintrag geladen', other: '{count} Einträge geladen' } as PluralForms,
        empty: 'Keine Einträge gefunden',
        error: 'Die Daten konnten nicht geladen werden.',
        retry: 'Erneut versuchen',
        minSearch: (count: number) => `Bitte mindestens ${count} Zeichen eingeben`,
        /** Button at the end of a growing list */
        loadMore: 'Mehr laden',
        loadingMore: 'Weitere Einträge werden geladen',
    },
    dateRange: {
        start: 'Beginn',
        end: 'Ende',
        clearTrigger: 'Zeitraum löschen',
    },
    timePicker: {
        trigger: 'Uhrzeit wählen',
        clearTrigger: 'Uhrzeit löschen',
        /** TimeRangePicker */
        clearRange: 'Uhrzeiten löschen',
    },
    dateSegments: {
        day: 'Tag',
        month: 'Monat',
        year: 'Jahr',
        hour: 'Stunde',
        minute: 'Minute',
        second: 'Sekunde',
        dayPeriod: 'Tageszeit',
    } as Record<string, string>,
    pinInput: { inputLabel: (index: number, length: number) => `Stelle ${index + 1} von ${length}` },
    rating: { ratingValueText: (index: number) => (index === 1 ? '1 Stern' : `${index} Sterne`) },
    carousel: {
        nextTrigger: 'Nächstes Bild',
        prevTrigger: 'Vorheriges Bild',
        indicator: (index: number) => `Bild ${index + 1} zeigen`,
        item: (index: number, count: number) => `Bild ${index + 1} von ${count}`,
        autoplayStart: 'Automatisch abspielen',
        autoplayStop: 'Abspielen anhalten',
        progressText: (details: { page: number; totalPages: number }) => `${details.page + 1} / ${details.totalPages}`,
    },
    chart: {
        showTable: 'Daten als Tabelle',
        /** Header of the label column */
        category: 'Kategorie',
        sparkline: (label: string, first: string, last: string, min: string, max: string) =>
            `${label}: von ${first} auf ${last}, Tiefstwert ${min}, Höchstwert ${max}`,
        /** Column of a dataset without label */
        series: (index: number) => `Reihe ${index + 1}`,
        /** Waterfall: a step and the running sum */
        change: 'Veränderung',
        total: 'Summe',
        /** Brush: the shown range */
        brush: 'Ausschnitt',
        brushThumbs: ['Beginn', 'Ende'],
        legend: 'Legende',
        share: 'Anteil',
        value: 'Wert',
        references: 'Referenzwerte',
        /** Funnel: stage and conversion */
        stage: 'Schritt',
        conversion: 'Umwandlung',
        fromPrevious: (percent: string) => `${percent} vom vorherigen Schritt`,
        /** Bullet chart: value, maximum and target */
        target: 'Ziel',
        bulletValue: (value: string, max: string, target?: string) =>
            target ? `${value} von ${max}, Ziel ${target}` : `${value} von ${max}`,
    },
    editor: {
        toolbar: 'Formatierung',
        bold: 'Fett',
        italic: 'Kursiv',
        underline: 'Unterstrichen',
        strike: 'Durchgestrichen',
        heading2: 'Überschrift',
        heading3: 'Zwischenüberschrift',
        bulletList: 'Aufzählung',
        orderedList: 'Nummerierte Liste',
        blockquote: 'Zitat',
        code: 'Code',
        link: 'Link',
        undo: 'Rückgängig',
        redo: 'Wiederholen',
        linkUrl: 'Linkadresse',
        linkApply: 'Übernehmen',
        linkRemove: 'Link entfernen',
        linkCancel: 'Abbrechen',
        taskList: 'Aufgabenliste',
        codeBlock: 'Codeblock',
        horizontalRule: 'Trennlinie',
        image: 'Bild',
        imageUrl: 'Bildadresse',
        imageAlt: 'Alternativtext',
        imageDecorative: 'Nur Schmuck (ohne Alternativtext)',
        imageUpload: 'Datei wählen',
        imageInsert: 'Einfügen',
        imageUpdate: 'Übernehmen',
        table: 'Tabelle',
        tableBar: 'Tabelle bearbeiten',
        tableActions: {
            insertTable: 'Tabelle einfügen',
            addRowBefore: 'Zeile darüber',
            addRowAfter: 'Zeile darunter',
            addColumnBefore: 'Spalte davor',
            addColumnAfter: 'Spalte danach',
            deleteRow: 'Zeile löschen',
            deleteColumn: 'Spalte löschen',
            toggleHeaderRow: 'Kopfzeile ein/aus',
            mergeOrSplit: 'Zellen verbinden/teilen',
            deleteTable: 'Tabelle löschen',
        } as Record<string, string>,
        taskItem: (text: string, checked: boolean) => `${text || 'Leere Aufgabe'}, ${checked ? 'erledigt' : 'offen'}`,
        shortcut: (letter: string, shift: boolean) => `Strg+${shift ? 'Umschalt+' : ''}${letter}`,
        alignLeft: 'Linksbündig',
        alignCenter: 'Zentriert',
        alignRight: 'Rechtsbündig',
        alignJustify: 'Blocksatz',
        textColor: 'Textfarbe',
        backgroundColor: 'Hintergrundfarbe',
        colorDefault: 'Standard',
        colors: {
            primary: 'Akzent',
            info: 'Info',
            success: 'Erfolg',
            warn: 'Warnung',
            danger: 'Fehler',
            muted: 'Gedämpft',
        } as Record<string, string>,
        subscript: 'Tiefgestellt',
        superscript: 'Hochgestellt',
        source: 'HTML-Quelltext',
        sourceField: 'HTML-Quelltext bearbeiten',
        details: 'Aufklappbarer Abschnitt',
        detailsToggle: (open: boolean): string => (open ? 'Abschnitt zuklappen' : 'Abschnitt aufklappen'),
        invisibleCharacters: 'Unsichtbare Zeichen',
        tableOfContents: 'Inhaltsverzeichnis',
        characters: (count: number, limit?: number) =>
            limit === undefined ? `${count} Zeichen` : `${count} von ${limit} Zeichen`,
        words: (count: number) => (count === 1 ? '1 Wort' : `${count} Wörter`),
        limitReached: 'Höchstlänge erreicht',
        imageUploading: 'Bild wird hochgeladen …',
        imageUploaded: 'Bild eingefügt',
        imageFailed: 'Das Bild konnte nicht hochgeladen werden',
        bubbleMenu: 'Auswahl formatieren',
        floatingMenu: 'Block einfügen',
        menuHint: 'Alt+F10: Menü',
        suggestions: 'Vorschläge',
        noSuggestions: 'Keine Treffer',
        suggestionCount: (count: number) => (count === 1 ? '1 Vorschlag' : `${count} Vorschläge`),
        mentioned: (label: string) => `${label} erwähnt`,
    },
    gallery: {
        fullscreen: 'Vollbild',
        close: 'Vollbild schließen',
        thumbnails: 'Vorschaubilder',
        thumbnail: (index: number, count: number) => `Bild ${index + 1} von ${count} zeigen`,
        /** Lightbox toolbar (fullscreen view) */
        toolbar: 'Bildwerkzeuge',
        zoomIn: 'Vergrößern',
        zoomOut: 'Verkleinern',
        resetZoom: 'Originalgröße',
        rotate: 'Drehen',
        download: 'Herunterladen',
        screen: 'Bildschirmfüllend',
        exitScreen: 'Bildschirmfüllend beenden',
        zoom: (percent: number) => `Zoom ${percent} %`,
        /** Keyboard help of the lightbox */
        shortcuts: 'Pfeiltasten: Bild wechseln · + und −: Zoom · 0: Originalgröße · R: Drehen · F: Bildschirmfüllend',
        video: 'Video',
    },
    /** Ark names the colour picker parts in English and has no translations for them */
    colorPicker: {
        trigger: (color: string) => `Farbe wählen, aktuell ${color}`,
        /** Name of the trigger without a Field or aria-label */
        name: 'Farbe',
        area: 'Sättigung und Helligkeit',
        hue: 'Farbton',
        alpha: 'Deckkraft',
        hex: 'Hex-Wert',
        swatch: (color: string) => `${color} wählen`,
        /** ColorInput: the swatch button that opens the picker */
        open: 'Farbwähler öffnen',
        eyeDropper: 'Farbe vom Bildschirm aufnehmen',
        format: 'Format',
        formats: { rgb: 'RGB', hsl: 'HSL', hsb: 'HSB', oklch: 'OKLCH' } as Record<string, string>,
        /** Names of the channel fields per format */
        channels: {
            rgb: ['Rot', 'Grün', 'Blau'],
            hsl: ['Farbton', 'Sättigung', 'Helligkeit'],
            hsb: ['Farbton', 'Sättigung', 'Hellwert'],
            oklch: ['Helligkeit', 'Buntheit', 'Farbton'],
        } as Record<string, string[]>,
        palette: 'Farben',
    },
    tree: {
        treeLabel: 'Baum',
        moved: (label: string, parent: string | null, position: number, count: number) =>
            `${label} verschoben${parent ? ` nach ${parent}` : ''}, Position ${position} von ${count}`,
        /** Row below a branch while its children load */
        loadingRow: 'Wird geladen …',
        loadingNode: (label: string) => `${label}: Wird geladen`,
        loadedNode: {
            one: '{label}: {count} Eintrag geladen',
            other: '{label}: {count} Einträge geladen',
        } as PluralForms,
        loadError: (label: string) => `${label} konnte nicht geladen werden`,
        /** Row below a branch whose children failed to load; activating it loads again */
        retry: 'Laden fehlgeschlagen – erneut versuchen',
        filter: 'Baum durchsuchen',
        matches: { one: '{count} Treffer', other: '{count} Treffer' } as PluralForms,
        noMatches: 'Keine Treffer',
        expandAll: 'Alle aufklappen',
        collapseAll: 'Alle zuklappen',
        cut: (label: string) => `${label} ausgeschnitten – mit Strg+V an einem anderen Knoten einfügen`,
        cutCancelled: 'Ausschneiden abgebrochen',
        dropDenied: 'Hier nicht möglich',
    },
    treeSelect: {
        search: 'Suchen',
        /** Chip for the selected nodes beyond `maxShown` */
        more: (count: number) => `+${count}`,
        moreLabel: (count: number) => `${count} weitere ausgewählt`,
    },
    cascadeSelect: {
        search: 'Suchen',
        /** Button next to the search field that opens the levels */
        showLevels: 'Ebenen anzeigen',
        /** First entry of a level with `changeOnSelect`: chooses the level itself */
        choose: (label: string) => `${label} wählen`,
        /** A hit of the search: the whole path */
        path: (labels: string[]) => labels.join(' › '),
    },
    timeline: {
        loadMore: 'Ältere Einträge laden',
        loading: 'Ältere Einträge werden geladen',
    },
    orgChart: {
        expand: (label: string) => `Team von ${label} anzeigen`,
        collapse: (label: string) => `Team von ${label} ausblenden`,
        loading: (label: string) => `${label}: Wird geladen`,
        retry: (label: string) => `${label}: Laden fehlgeschlagen – erneut versuchen`,
    },
    fileUpload: {
        dropzone: 'Dateien ablegen',
        itemPreview: (file: File) => `Vorschau von ${file.name}`,
        deleteFile: (file: File) => `${file.name} entfernen`,
        dropzoneText: (multiple: boolean): string =>
            multiple ? 'Dateien hierher ziehen oder' : 'Datei hierher ziehen oder',
        trigger: (multiple: boolean): string => (multiple ? 'Dateien auswählen' : 'Datei auswählen'),
        /** Messages for rejected files (Ark FileUpload error codes) */
        errors: {
            TOO_MANY_FILES: 'Zu viele Dateien',
            FILE_INVALID_TYPE: 'Dateityp nicht erlaubt',
            FILE_TOO_LARGE: 'Datei ist zu groß',
            FILE_TOO_SMALL: 'Datei ist zu klein',
            FILE_INVALID: 'Datei ist ungültig',
            FILE_EXISTS: 'Datei ist schon ausgewählt',
        } as Record<string, string>,
        upload: 'Hochladen',
        uploadAll: 'Alle hochladen',
        cancel: (file: File) => `Hochladen von ${file.name} abbrechen`,
        retry: (file: File) => `${file.name} erneut hochladen`,
        progress: (file: File) => `Fortschritt von ${file.name}`,
        status: {
            pending: 'Bereit zum Hochladen',
            uploading: (percent: number) => `Wird hochgeladen … ${percent} %`,
            done: 'Hochgeladen',
            error: 'Hochladen fehlgeschlagen',
            cancelled: 'Abgebrochen',
        },
        /** Announced when an upload ends */
        uploaded: (file: File) => `${file.name} hochgeladen`,
        failed: (file: File) => `${file.name} konnte nicht hochgeladen werden`,
        dropAccept: (multiple: boolean): string =>
            multiple ? 'Loslassen, um die Dateien hinzuzufügen' : 'Loslassen, um die Datei hinzuzufügen',
        dropReject: 'Diese Dateien sind hier nicht erlaubt',
        fullscreen: 'Dateien irgendwo ablegen',
        /** React Native: where FileUpload takes files from (the pickers of the app) */
        sources: { documents: 'Dokument wählen', photos: 'Aus Fotos wählen', camera: 'Foto aufnehmen' },
        pasted: (count: number) => (count === 1 ? '1 Datei eingefügt' : `${count} Dateien eingefügt`),
    },
    statistic: { loading: 'Wird geladen' },
    truncate: { more: 'Mehr anzeigen', less: 'Weniger anzeigen' },
    overflowList: {
        /** Hidden part of the "+N" button's name (after the visible "+N") */
        more: 'weitere',
        title: 'Weitere Einträge',
    },
    toggletip: {
        label: 'Weitere Informationen',
        labelFor: (label: string) => `Weitere Informationen zu ${label}`,
    },
    checkboxGroup: { maxReached: (max: number) => `Höchstens ${max} auswählbar` },
    skipLinks: { label: 'Sprunglinks' },
    hotkeys: {
        /** Key names for the display (Kbd `hotkey`, HotkeysDialog); Apple devices show symbols */
        keys: {
            ctrl: 'Strg',
            alt: 'Alt',
            shift: 'Umschalt',
            meta: 'Win',
            space: 'Leertaste',
            enter: 'Eingabe',
            escape: 'Esc',
            backspace: 'Rücktaste',
            delete: 'Entf',
            tab: 'Tab',
        },
        /** Between the steps of a sequence ("G dann I") */
        then: 'dann',
        title: 'Tastenkürzel',
        description: 'Alle Tastenkürzel dieser Seite',
        empty: 'Keine Tastenkürzel',
        /** Description of the "?" shortcut */
        open: 'Tastenkürzel anzeigen',
        /** Group of shortcuts without their own */
        general: 'Allgemein',
        /** Description of the CommandPalette's shortcut */
        commandPalette: 'Befehle öffnen',
    },
    persona: {
        presence: { online: 'Online', away: 'Abwesend', busy: 'Beschäftigt', offline: 'Offline' } as Record<
            string,
            string
        >,
    },
    inlineEdit: {
        edit: 'bearbeiten',
        save: 'Speichern',
        cancel: 'Abbrechen',
        empty: 'Leer',
        saving: 'Wird gespeichert …',
        /** Title of the popover */
        title: (label: string) => `${label} bearbeiten`,
    },
    searchField: { label: 'Suche', placeholder: 'Suchen …', clear: 'Suche löschen', scope: 'Suchbereich' },
    filterPanel: {
        label: 'Filter',
        toggle: 'Filter',
        /** Hidden part of the toggle's name after the visible count */
        active: 'aktiv',
        status: (count: number) =>
            count === 0 ? 'Keine Filter aktiv' : count === 1 ? '1 Filter aktiv' : `${count} Filter aktiv`,
    },
    filterChips: {
        label: 'Aktive Filter',
        remove: (label: string) => `Filter ${label} entfernen`,
        reset: 'Alle zurücksetzen',
    },
    conditionBuilder: {
        label: 'Bedingungen',
        combinator: 'Verknüpfung',
        and: 'Und',
        or: 'Oder',
        all: 'Alle Bedingungen erfüllt',
        any: 'Eine Bedingung erfüllt',
        not: 'Nicht',
        group: (path: string) => `Gruppe ${path}`,
        rule: (path: string) => `Bedingung ${path}`,
        addRule: 'Bedingung hinzufügen',
        addGroup: 'Gruppe hinzufügen',
        removeRule: (path: string) => `Bedingung ${path} entfernen`,
        removeGroup: (path: string) => `Gruppe ${path} entfernen`,
        field: 'Feld',
        operator: 'Operator',
        value: 'Wert',
        from: 'Von',
        to: 'Bis',
        yes: 'Ja',
        no: 'Nein',
        empty: 'Keine Bedingungen – alle Einträge passen',
        /** Operators beyond the DataTable match modes */
        operators: { empty: 'Ist leer', notEmpty: 'Ist nicht leer', in: 'Ist eins von' } as Record<string, string>,
        added: 'Bedingung hinzugefügt',
        groupAdded: 'Gruppe hinzugefügt',
        removed: 'Bedingung entfernt',
        groupRemoved: 'Gruppe entfernt',
        /** The DataTable's toggle */
        advanced: 'Erweiterter Filter',
    },
    formList: {
        add: 'Eintrag hinzufügen',
        item: (position: number) => `Eintrag ${position}`,
        remove: (item: string) => `${item} entfernen`,
        moveUp: (item: string) => `${item} nach oben`,
        moveDown: (item: string) => `${item} nach unten`,
        added: (item: string) => `${item} hinzugefügt`,
        removed: (item: string) => `${item} entfernt`,
        moved: (item: string, position: number) => `${item} an Position ${position} verschoben`,
        max: (max: number) => `Höchstens ${max} Einträge`,
        min: (min: number) => `Mindestens ${min} Einträge`,
    },
    keyValueEditor: {
        key: 'Schlüssel',
        value: 'Wert',
        add: 'Zeile hinzufügen',
        item: (position: number) => `Zeile ${position}`,
        duplicate: 'Schlüssel kommt mehrfach vor',
    },
    wizard: {
        summary: 'Zusammenfassung',
        validating: 'Wird geprüft …',
        invalid: 'Bitte die Angaben in diesem Schritt prüfen',
    },
    aiLabel: {
        label: 'KI-generiert',
        explanation:
            'Dieser Inhalt wurde mit künstlicher Intelligenz erstellt. Bitte prüfen Sie ihn vor der Verwendung.',
        help: 'Was bedeutet KI-generiert?',
    },
    qrCode: {
        label: (value: string) => `QR-Code: ${value}`,
        downloadPng: 'Als PNG herunterladen',
        downloadSvg: 'Als SVG herunterladen',
    },
    signaturePad: {
        label: 'Unterschrift',
        roleDescription: 'Unterschriftsfeld',
        control: 'Unterschriftsfeld – mit Maus, Stift oder Finger unterschreiben',
        placeholder: 'Hier unterschreiben',
        clear: 'Löschen',
        undo: 'Rückgängig',
        type: 'Unterschrift eintippen',
        draw: 'Unterschrift zeichnen',
        typedLabel: 'Name als Unterschrift',
        cleared: 'Unterschrift gelöscht',
    },
    imageCropper: {
        label: 'Bild zuschneiden',
        roleDescription: 'Bildzuschnitt',
        loading: 'Bild wird geladen',
        description: (zoom: number | null, rotation: number | null) =>
            `Zoom ${Math.round((zoom ?? 1) * 100)} %, gedreht um ${Math.round(rotation ?? 0)} Grad`,
        selection: (circle: boolean): string => (circle ? 'Kreisförmiger Ausschnitt' : 'Ausschnitt'),
        selectionRoleDescription: 'verschiebbarer Ausschnitt',
        instructions:
            'Pfeiltasten verschieben den Ausschnitt, Alt und Pfeiltasten ändern seine Größe, Plus und Minus zoomen.',
        selectionValue: (width: number, height: number, x: number, y: number) =>
            `${width} × ${height} Pixel, Position ${x}, ${y}`,
        zoomIn: 'Vergrößern',
        zoomOut: 'Verkleinern',
        rotateLeft: 'Nach links drehen',
        rotateRight: 'Nach rechts drehen',
        flip: 'Horizontal spiegeln',
        reset: 'Zurücksetzen',
        toolbar: 'Bild bearbeiten',
    },
    floatingPanel: {
        minimize: 'Minimieren',
        maximize: 'Maximieren',
        restore: 'Wiederherstellen',
        close: 'Schließen',
        hint: 'Alt und Pfeiltasten verschieben das Fenster, Alt, Umschalt und Pfeiltasten ändern seine Größe.',
    },
    jsonViewer: {
        label: 'JSON-Daten',
        search: 'Durchsuchen',
        copy: (path: string) => `${path} kopieren`,
        copied: (path: string) => `${path} kopiert`,
        items: (count: number) => (count === 1 ? '1 Eintrag' : `${count} Einträge`),
        keys: (count: number) => (count === 1 ? '1 Schlüssel' : `${count} Schlüssel`),
        matches: (count: number) => (count === 0 ? 'Keine Treffer' : count === 1 ? '1 Treffer' : `${count} Treffer`),
        types: {
            object: 'Objekt',
            array: 'Liste',
            string: 'Text',
            number: 'Zahl',
            boolean: 'Wahrheitswert',
            null: 'leer',
            undefined: 'undefiniert',
        } as Record<string, string>,
    },
    jsonInput: {
        format: 'Formatieren',
        valid: 'Gültiges JSON',
        invalid: 'Ungültiges JSON',
        invalidAt: (line: number, column: number) => `Ungültiges JSON in Zeile ${line}, Spalte ${column}`,
    },
    downloadTrigger: { label: 'Herunterladen' },
    marquee: { label: 'Laufband', pause: 'Laufband anhalten', play: 'Laufband fortsetzen' },
    angleSlider: { label: 'Winkel', value: (degrees: number) => `${degrees} Grad` },
    mentions: {
        label: 'Nachricht',
        suggestions: 'Vorschläge',
        /** Announced when the suggestions open or change */
        count: (count: number) =>
            count === 0 ? 'Keine Vorschläge' : count === 1 ? '1 Vorschlag' : `${count} Vorschläge`,
        hint: (triggers: string) => `${triggers} öffnet Vorschläge, Pfeiltasten wählen, Eingabe übernimmt`,
    },
    phoneInput: {
        country: 'Land',
        number: 'Telefonnummer',
        search: 'Land suchen',
    },
    colorSwatchPicker: { label: 'Farbe' },
    emojiPicker: {
        /**
         * Names and search words of the emojis in this language, one per line: "😀 Name|search words" – empty keeps the
         * English names; the English words always find, too
         */
        emojis: `😀 Grinsendes Gesicht|lachen freude fröhlich
😃 Grinsen mit großen Augen|lachen freude
😄 Lachendes Gesicht|lachen freude glücklich
😁 Strahlendes Gesicht|grinsen zähne
😆 Lachen mit zugekniffenen Augen|lachen lustig
😅 Lachen mit Schweißtropfen|erleichtert puh
🤣 Vor Lachen auf dem Boden|lachen lol lustig
😂 Tränen vor Lachen|lachen lustig weinen
🙂 Leicht lächelndes Gesicht|lächeln
🙃 Umgekehrtes Gesicht|ironie albern
😉 Zwinkerndes Gesicht|zwinkern scherz
😊 Lächeln mit lachenden Augen|freundlich erröten
😇 Lächeln mit Heiligenschein|engel unschuldig
🥰 Lächeln mit Herzen|verliebt liebe
😍 Herzaugen|verliebt liebe toll
🤩 Sternaugen|begeistert wow
😘 Kuss zuwerfen|kuss liebe
😋 Lecker|genießen essen zunge
😛 Zunge herausstrecken|frech
😜 Zwinkern mit Zunge|albern frech
🤪 Verrücktes Gesicht|albern verrückt
🤑 Geldgesicht|geld reich
🤗 Umarmung|umarmen danke
🤭 Hand vor dem Mund|kichern hoppla
🤫 Pst|leise geheim ruhe
🤔 Nachdenkliches Gesicht|denken überlegen hmm
🤐 Reißverschlussmund|schweigen geheim
🤨 Hochgezogene Augenbraue|skeptisch zweifel
😐 Neutrales Gesicht|neutral egal
😑 Ausdrucksloses Gesicht|genervt egal
😶 Gesicht ohne Mund|sprachlos
😏 Süffisantes Lächeln|grinsen schelmisch
😒 Gelangweiltes Gesicht|unzufrieden genervt
🙄 Augenrollen|genervt
😬 Grimasse|peinlich angespannt
😌 Erleichtertes Gesicht|zufrieden ruhig
😔 Nachdenklich traurig|traurig
😪 Müdes Gesicht|schläfrig
😴 Schlafendes Gesicht|schlafen müde zzz
😷 Gesicht mit Maske|krank maske
🤒 Gesicht mit Thermometer|krank fieber
🤢 Übelkeit|krank übel
🤧 Niesendes Gesicht|schnupfen erkältung
🥵 Heißes Gesicht|hitze schwitzen
🥶 Kaltes Gesicht|kalt frieren
😵 Benommenes Gesicht|schwindelig
🤯 Explodierender Kopf|überwältigt wow
🤠 Cowboy|hut
🥳 Partygesicht|feiern party geburtstag
😎 Sonnenbrille|cool lässig
🤓 Strebergesicht|nerd brille
🧐 Gesicht mit Monokel|prüfen genau
😕 Verwirrtes Gesicht|unsicher
😟 Besorgtes Gesicht|sorge
🙁 Leicht trauriges Gesicht|traurig
😮 Offener Mund|überrascht staunen
😲 Erstauntes Gesicht|überrascht schock
😳 Errötetes Gesicht|peinlich verlegen
🥺 Flehendes Gesicht|bitte bettelnd
😨 Ängstliches Gesicht|angst
😰 Besorgt mit Schweiß|angst stress
😢 Weinendes Gesicht|traurig träne
😭 Laut weinend|traurig weinen
😱 Schreiendes Gesicht|angst schock horror
😖 Verwirrtes Gesicht|frustriert
😞 Enttäuschtes Gesicht|enttäuscht traurig
😓 Niedergeschlagen mit Schweiß|stress
😩 Erschöpftes Gesicht|müde fertig
😫 Müde|erschöpft
🥱 Gähnendes Gesicht|gähnen müde langweilig
😤 Triumphierendes Gesicht|schnauben stolz
😡 Wütendes Gesicht|wut ärger
😠 Verärgertes Gesicht|ärger böse
🤬 Fluchendes Gesicht|schimpfen wut
😈 Lachender Teufel|teufel frech
💀 Totenkopf|tot schädel
💩 Kothaufen|lustig
🤡 Clown|clownsgesicht
👻 Gespenst|geist halloween
👽 Außerirdischer|alien ufo
🤖 Roboter|bot maschine ki
😺 Lachende Katze|katze
😻 Katze mit Herzaugen|katze verliebt
🙈 Nichts sehen|affe peinlich
🙉 Nichts hören|affe
🙊 Nichts sagen|affe geheim
👋 Winkende Hand|hallo tschüss winken
🤚 Erhobene Hand|stopp melden
✋ Hand|stopp halt fünf
🖖 Vulkanischer Gruß|spock
👌 OK-Zeichen|ok gut perfekt
🤌 Zusammengelegte Finger|italienisch was
✌️ Victory-Zeichen|sieg frieden
🤞 Gekreuzte Finger|glück daumen drücken
🤟 Ich liebe dich|liebe geste
🤘 Teufelsgruß|rock metal
🤙 Ruf mich an|telefon
👈 Zeigefinger links|links zeigen
👉 Zeigefinger rechts|rechts zeigen
👆 Zeigefinger nach oben|oben
👇 Zeigefinger nach unten|unten
☝️ Zeigefinger|eins hinweis
👍 Daumen hoch|gut ja zustimmung like
👎 Daumen runter|schlecht nein ablehnung
✊ Erhobene Faust|faust solidarität
👊 Faust|faustschlag
👏 Klatschende Hände|applaus bravo klatschen
🙌 Erhobene Hände|feiern hurra
👐 Offene Hände|umarmung
🤲 Handflächen nach oben|bitten
🤝 Handschlag|vereinbarung deal partner
🙏 Gefaltete Hände|bitte danke beten
✍️ Schreibende Hand|schreiben notiz
💪 Bizeps|stark kraft muskel
🧠 Gehirn|denken klug
👀 Augen|schauen sehen
👁️ Auge|sehen
👄 Mund|lippen
👶 Baby|kind säugling
🧒 Kind|kind
👦 Junge|kind
👧 Mädchen|kind
🧑 Person|mensch
👨 Mann|mensch
👩 Frau|mensch
🧓 Ältere Person|alt senior
👮 Polizist|polizei
🕵️ Detektiv|spion ermittler
👷 Bauarbeiter|baustelle helm
🧑‍💻 Person am Computer|programmieren entwickler technik
🧑‍🏫 Lehrkraft|lehrer schule
🧑‍⚕️ Ärztin oder Arzt|medizin gesundheit
🧑‍🍳 Koch|kochen küche
🦸 Superheld|held
🙋 Person mit erhobener Hand|melden frage hallo
🤷 Schulterzucken|egal weiß nicht
🤦 Hand vor die Stirn|facepalm oh nein
🙇 Verbeugung|entschuldigung danke
💁 Infoschalter-Person|info hilfe
🏃 Laufende Person|laufen rennen sport
🚶 Gehende Person|gehen spazieren
💃 Tanzende Frau|tanzen party
🕺 Tanzender Mann|tanzen party
👨‍👩‍👧 Familie|eltern kind
👥 Silhouetten|gruppe team leute
🗣️ Sprechender Kopf|sprechen reden
🐶 Hundegesicht|hund haustier
🐱 Katzengesicht|katze haustier
🐭 Mausgesicht|maus
🐹 Hamster|haustier
🐰 Hasengesicht|hase kaninchen ostern
🦊 Fuchs|fuchs
🐻 Bär|bär
🐼 Panda|bär
🐨 Koala|bär
🐯 Tigergesicht|tiger
🦁 Löwe|löwe
🐮 Kuhgesicht|kuh
🐷 Schweinegesicht|schwein
🐸 Frosch|frosch
🐵 Affengesicht|affe
🐔 Huhn|huhn vogel
🐧 Pinguin|vogel
🐦 Vogel|vogel
🦆 Ente|vogel
🦅 Adler|vogel
🦉 Eule|vogel nacht
🐝 Biene|honig insekt
🐛 Raupe|insekt
🦋 Schmetterling|insekt
🐌 Schnecke|langsam
🐞 Marienkäfer|glück insekt
🐢 Schildkröte|langsam
🐍 Schlange|reptil
🐙 Oktopus|krake meer
🐠 Tropischer Fisch|fisch meer
🐬 Delfin|meer
🐳 Wal|meer
🦈 Hai|meer
🐊 Krokodil|reptil
🦒 Giraffe|tier
🐘 Elefant|tier
🐴 Pferdegesicht|pferd
🦄 Einhorn|fantasie
🐾 Pfotenabdrücke|tier spuren
💐 Blumenstrauß|blumen geschenk
🌸 Kirschblüte|blume frühling
🌹 Rose|blume liebe
🌻 Sonnenblume|blume sommer
🌷 Tulpe|blume frühling
🌱 Keimling|pflanze wachsen
🌲 Nadelbaum|baum wald
🌳 Laubbaum|baum
🌴 Palme|urlaub strand
🌵 Kaktus|wüste pflanze
🍀 Kleeblatt|glück
🍁 Ahornblatt|herbst
🍂 Herbstlaub|herbst blätter
🌍 Weltkugel Europa und Afrika|erde welt global
🌙 Mondsichel|mond nacht
⭐ Stern|stern
🌟 Leuchtender Stern|stern glanz
⚡ Blitz|strom energie schnell
🔥 Feuer|heiß flamme trend
🌈 Regenbogen|farben
☀️ Sonne|sonnig wetter
⛅ Sonne hinter Wolke|wetter wolkig
☁️ Wolke|wetter
🌧️ Regenwolke|regen wetter
❄️ Schneeflocke|schnee winter kalt
💧 Tropfen|wasser
🌊 Welle|meer wasser
🍏 Grüner Apfel|obst
🍎 Roter Apfel|obst
🍐 Birne|obst
🍊 Mandarine|obst orange
🍋 Zitrone|obst sauer
🍌 Banane|obst
🍉 Wassermelone|obst sommer
🍇 Trauben|obst wein
🍓 Erdbeere|obst
🍒 Kirschen|obst
🍑 Pfirsich|obst
🥭 Mango|obst
🍍 Ananas|obst
🥥 Kokosnuss|obst
🥝 Kiwi|obst
🍅 Tomate|gemüse
🥑 Avocado|gemüse
🥦 Brokkoli|gemüse
🥕 Karotte|möhre gemüse
🌽 Maiskolben|mais gemüse
🌶️ Peperoni|scharf
🥔 Kartoffel|gemüse
🍄 Pilz|pilz
🥜 Erdnüsse|nüsse
🍞 Brot|bäckerei
🥐 Croissant|frühstück
🥨 Brezel|bayern
🧀 Käse|käse
🥚 Ei|frühstück
🍳 Spiegelei|frühstück braten
🥞 Pfannkuchen|frühstück
🥓 Speck|frühstück
🍔 Hamburger|burger fastfood
🍟 Pommes|fastfood
🍕 Pizza|italienisch
🌭 Hotdog|würstchen
🥪 Sandwich|brot
🌮 Taco|mexikanisch
🥗 Salat|gesund
🍝 Spaghetti|nudeln pasta
🍜 Nudelsuppe|ramen
🍣 Sushi|japanisch fisch
🍦 Softeis|eis dessert
🍩 Donut|süß
🍪 Keks|süß
🎂 Geburtstagskuchen|geburtstag torte feiern
🍰 Kuchenstück|kuchen torte
🧁 Cupcake|kuchen süß
🍫 Schokolade|süß
🍬 Bonbon|süß
🍯 Honigtopf|honig
☕ Heißgetränk|kaffee tee pause
🍵 Tee|tee
🥤 Becher mit Strohhalm|getränk
🍺 Bier|getränk prost
🍻 Anstoßende Biergläser|prost feiern
🍷 Weinglas|wein getränk
🥂 Sektgläser|anstoßen feiern prost
🍾 Sektflasche|feiern
🍽️ Teller mit Besteck|essen mahlzeit
🚗 Auto|fahrzeug
🚕 Taxi|fahrzeug
🚌 Bus|fahrzeug verkehr
🚑 Krankenwagen|notfall
🚒 Feuerwehrauto|feuerwehr
🚓 Polizeiauto|polizei
🚚 Lieferwagen|lieferung lkw versand
🚜 Traktor|landwirtschaft
🚲 Fahrrad|rad
🛴 Tretroller|roller
🏍️ Motorrad|fahrzeug
🚂 Lokomotive|zug bahn
🚆 Zug|bahn reise
🚇 U-Bahn|bahn
✈️ Flugzeug|fliegen reise urlaub
🛫 Abflug|fliegen reise
🛬 Landung|fliegen ankunft
🚀 Rakete|start launch schnell
🛸 Ufo|außerirdisch
🚁 Hubschrauber|fliegen
⛵ Segelboot|boot segeln
🚢 Schiff|boot reise
⚓ Anker|schiff
⛽ Zapfsäule|tanken benzin
🚦 Ampel|verkehr
🚧 Baustelle|arbeit sperrung
🗺️ Weltkarte|karte reise
🧭 Kompass|richtung navigation
🏔️ Schneebedeckter Berg|berg
🏖️ Strand mit Sonnenschirm|urlaub strand
🏝️ Insel|urlaub
🏠 Haus|zuhause heim
🏡 Haus mit Garten|zuhause
🏢 Bürogebäude|büro firma arbeit
🏥 Krankenhaus|klinik
🏦 Bank|geld
🏨 Hotel|reise übernachtung
🏫 Schule|bildung
🏭 Fabrik|industrie
🏰 Schloss|burg
⛪ Kirche|religion
🗼 Turm|tokio
🗽 Freiheitsstatue|new york
🎡 Riesenrad|kirmes
🌃 Nacht mit Sternen|stadt nacht
🌅 Sonnenaufgang|morgen
⏰ Wecker|zeit wecker morgen
⌛ Sanduhr|zeit warten
⏱️ Stoppuhr|zeit messen
🕐 Ein Uhr|uhr zeit
⚽ Fußball|sport ball
🏀 Basketball|sport ball
🏈 Football|sport ball
⚾ Baseball|sport ball
🎾 Tennis|sport ball
🏐 Volleyball|sport ball
🏓 Tischtennis|sport
🏸 Badminton|sport
🥅 Tor|sport
⛳ Golffahne|golf sport
🎣 Angel|angeln fisch
🎿 Ski|wintersport
🏂 Snowboarder|wintersport
🏊 Schwimmer|schwimmen sport
🚴 Radfahrer|fahrrad sport
🏆 Pokal|sieg gewinner preis
🥇 Goldmedaille|erster sieg gewinner
🥈 Silbermedaille|zweiter
🥉 Bronzemedaille|dritter
🏅 Sportmedaille|medaille preis
🎖️ Orden|auszeichnung
🎫 Eintrittskarte|ticket
🎟️ Ticket|eintritt
🎭 Theatermasken|theater kultur
🎨 Farbpalette|kunst malen design
🎬 Filmklappe|film kino
🎤 Mikrofon|singen karaoke
🎧 Kopfhörer|musik hören
🎵 Musiknote|musik
🎶 Musiknoten|musik
🎹 Klaviatur|klavier musik
🎸 Gitarre|musik
🎮 Videospiel|spielen gaming controller
🕹️ Joystick|spielen gaming
🎲 Würfel|spiel glück
🧩 Puzzleteil|puzzle lösung
♟️ Schachfigur|schach strategie
🎯 Volltreffer|ziel treffer
🎳 Bowling|spiel
🎉 Konfettibombe|feiern party glückwunsch
🎊 Konfettiball|feiern party
🎈 Luftballon|party geburtstag
🎁 Geschenk|geburtstag überraschung
🎄 Weihnachtsbaum|weihnachten
🎃 Kürbislaterne|halloween
✨ Funkeln|glanz neu magie
⌚ Armbanduhr|uhr zeit
📱 Mobiltelefon|handy smartphone
💻 Laptop|computer rechner arbeit
⌨️ Tastatur|computer tippen
🖥️ Bildschirm|computer monitor
🖨️ Drucker|drucken
🖱️ Computermaus|maus klicken
💾 Diskette|speichern
💿 CD|daten musik
📷 Kamera|foto
📹 Videokamera|video
📞 Telefonhörer|telefon anrufen
☎️ Telefon|anrufen
📺 Fernseher|tv
📻 Radio|musik
🔋 Batterie|akku energie
🔌 Stecker|strom
💡 Glühbirne|idee licht tipp
🔦 Taschenlampe|licht
🕯️ Kerze|licht
🗑️ Papierkorb|löschen müll
💰 Geldsack|geld reich
💳 Kreditkarte|bezahlen geld
💶 Euroschein|geld euro
🧾 Beleg|quittung rechnung
✉️ Briefumschlag|brief post mail
📧 E-Mail|mail nachricht
📨 Eingehender Umschlag|mail empfangen
📦 Paket|versand lieferung
📮 Briefkasten|post
📝 Notiz|schreiben memo
✏️ Bleistift|schreiben bearbeiten
🖊️ Kugelschreiber|schreiben
📁 Ordner|datei ablage
📂 Geöffneter Ordner|datei
📄 Dokument|datei seite
📊 Balkendiagramm|statistik daten chart
📈 Steigender Trend|wachstum statistik
📉 Fallender Trend|rückgang statistik
📅 Kalender|datum termin
📆 Abreißkalender|datum termin
📌 Pinnnadel|merken wichtig
📍 Stecknadel|ort standort
📎 Büroklammer|anhang
📏 Lineal|messen
✂️ Schere|schneiden
🔒 Geschlossenes Schloss|sicher gesperrt privat
🔓 Offenes Schloss|entsperrt
🔑 Schlüssel|passwort zugang
🔨 Hammer|werkzeug bauen
🛠️ Werkzeuge|reparieren einstellungen
⚙️ Zahnrad|einstellungen technik
🧰 Werkzeugkasten|werkzeug
🧲 Magnet|anziehen
🧪 Reagenzglas|labor test chemie
🔬 Mikroskop|wissenschaft forschung
🔭 Teleskop|astronomie
💊 Tablette|medizin
🩺 Stethoskop|arzt medizin
🛒 Einkaufswagen|einkaufen shop
🎒 Rucksack|schule
👓 Brille|lesen
📚 Bücher|lesen lernen bibliothek
📖 Offenes Buch|lesen
🔍 Lupe|suchen suche
🔔 Glocke|benachrichtigung
📣 Megafon|ankündigung
🏷️ Etikett|tag label preis
🔗 Link|verknüpfung kette
❤️ Rotes Herz|liebe herz
🧡 Oranges Herz|herz
💛 Gelbes Herz|herz
💚 Grünes Herz|herz
💙 Blaues Herz|herz
💜 Lila Herz|herz
🖤 Schwarzes Herz|herz
🤍 Weißes Herz|herz
💔 Gebrochenes Herz|trauer liebe
💕 Zwei Herzen|liebe
💯 Hundert Punkte|perfekt voll
💢 Ärger-Symbol|wut
💥 Zusammenstoß|knall boom
💫 Schwindelig|sterne
💬 Sprechblase|nachricht kommentar chat
💭 Gedankenblase|denken
💤 Schlafen|zzz müde
✅ Weißes Häkchen auf Grün|erledigt ja fertig ok
☑️ Abgehaktes Kästchen|erledigt
✔️ Häkchen|ok richtig
❌ Kreuz|nein falsch fehler löschen
❎ Kreuz-Schaltfläche|nein
➕ Plus|hinzufügen mehr
➖ Minus|weniger entfernen
❓ Fragezeichen|frage hilfe
❗ Ausrufezeichen|wichtig achtung
⚠️ Warnung|achtung vorsicht
⛔ Zutritt verboten|stopp verbot
🚫 Verboten|nein verbot
♻️ Recycling|umwelt
✳️ Achtzackiger Stern|stern
🆕 Neu|neu
🆗 OK|ok
🆘 SOS|hilfe notfall
🔴 Roter Kreis|rot punkt
🟠 Oranger Kreis|orange punkt
🟡 Gelber Kreis|gelb punkt
🟢 Grüner Kreis|grün punkt
🔵 Blauer Kreis|blau punkt
🟣 Lila Kreis|lila punkt
⚫ Schwarzer Kreis|schwarz punkt
⚪ Weißer Kreis|weiß punkt
🔺 Rotes Dreieck|nach oben
🔻 Rotes Dreieck nach unten|nach unten
⬆️ Pfeil nach oben|oben hoch
⬇️ Pfeil nach unten|unten runter
⬅️ Pfeil nach links|links zurück
➡️ Pfeil nach rechts|rechts weiter
🔄 Pfeile gegen den Uhrzeigersinn|aktualisieren neu laden
🔁 Wiederholen|schleife
▶️ Wiedergabe|abspielen play
⏸️ Pause|pause
⏹️ Stopp|stopp
🔇 Stumm|ton aus
🔊 Lautsprecher laut|ton an
©️ Copyright|recht
®️ Eingetragene Marke|marke
™️ Markenzeichen|marke
#️⃣ Raute|hashtag nummer
🔢 Zahlen|nummer
ℹ️ Information|info hinweis
🏁 Zielflagge|ziel rennen fertig
🚩 Dreiecksflagge|markierung warnung
🏳️ Weiße Flagge|aufgeben
🇩🇪 Flagge Deutschland|deutschland
🇦🇹 Flagge Österreich|österreich
🇨🇭 Flagge Schweiz|schweiz
🇪🇺 Flagge Europäische Union|eu europa`,
        label: 'Emojis',
        search: 'Emoji suchen',
        categoryNav: 'Kategorien',
        categories: {
            recent: 'Zuletzt verwendet',
            smileys: 'Smileys & Gefühle',
            people: 'Menschen & Gesten',
            nature: 'Tiere & Natur',
            food: 'Essen & Trinken',
            travel: 'Reisen & Orte',
            activities: 'Aktivitäten',
            objects: 'Objekte',
            symbols: 'Symbole',
        } as Record<string, string>,
        results: 'Suchergebnisse',
        empty: 'Keine Emojis gefunden',
        count: (count: number) => (count === 0 ? 'Keine Emojis' : count === 1 ? '1 Emoji' : `${count} Emojis`),
    },
    ringProgress: { label: 'Fortschritt' },
    sortable: {
        instructions:
            'Leertaste oder Eingabetaste nimmt auf. Dann mit den Pfeiltasten verschieben, mit Leertaste ablegen oder mit Escape abbrechen. Mit der Maus: ziehen, oder klicken und an der Zielstelle erneut klicken.',
        handle: (item: string) => `${item} verschieben`,
        empty: 'Keine Einträge – hierher verschieben',
        picked: (item: string, position: number, count: number) =>
            `${item} aufgenommen, Position ${position} von ${count}.`,
        moved: (item: string, position: number, count: number) => `${item}: Position ${position} von ${count}.`,
        movedTo: (item: string, container: string, position: number, count: number) =>
            `${item} in ${container}, Position ${position} von ${count}.`,
        dropped: (item: string, position: number, count: number) =>
            `${item} abgelegt, Position ${position} von ${count}.`,
        cancelled: (item: string, position: number, count: number) =>
            `Verschieben abgebrochen. ${item} wieder an Position ${position} von ${count}.`,
    },
    logViewer: {
        label: 'Protokoll',
        search: 'Protokoll durchsuchen',
        levels: { debug: 'Debug', info: 'Info', warn: 'Warnung', error: 'Fehler' } as Record<string, string>,
        levelFilter: 'Ebenen',
        autoScroll: 'Mitlaufen',
        loadMore: 'Ältere Einträge laden',
        jumpToEnd: 'Zum Ende',
        lines: (shown: number, total: number) => (shown === total ? `${total} Zeilen` : `${shown} von ${total} Zeilen`),
        empty: 'Keine Einträge',
        paused: 'Mitlaufen angehalten',
    },
    kanban: {
        /** React Native: action that moves a card to another column */
        moveTo: (column: string) => `Nach „${column}“ verschieben`,
        label: 'Board',
        count: (count: number, limit?: number) => (limit ? `${count}/${limit}` : String(count)),
        cards: (count: number, limit?: number) =>
            `${count === 1 ? '1 Karte' : `${count} Karten`}${limit ? `, Limit ${limit}` : ''}`,
        limitReached: 'WIP-Limit erreicht',
        limitExceeded: (count: number, limit: number) => `WIP-Limit überschritten: ${count} von ${limit}`,
        collapse: (column: string) => `${column} einklappen`,
        expand: (column: string) => `${column} ausklappen`,
        loadMore: 'Weitere laden',
        empty: 'Keine Karten – hierher verschieben',
    },
    chatMessages: {
        label: 'Nachrichten',
        empty: 'Noch keine Nachrichten',
        jump: 'Zu neuen Nachrichten',
        newCount: (count: number) => (count === 1 ? '1 neue Nachricht' : `${count} neue Nachrichten`),
        announce: (author: string, text: string) => `${author}: ${text}`,
        today: 'Heute',
        yesterday: 'Gestern',
        loadMore: 'Ältere Nachrichten laden',
    },
    chatMessage: {
        status: { sending: 'Wird gesendet', sent: 'Gesendet', read: 'Gelesen', error: 'Nicht gesendet' } as Record<
            string,
            string
        >,
        writing: 'Antwort wird erstellt',
        attachments: 'Anhänge',
        you: 'Sie',
        assistant: 'Assistent',
    },
    chatPrompt: {
        label: 'Nachricht',
        placeholder: 'Nachricht schreiben …',
        send: 'Senden',
        stop: 'Antwort stoppen',
        attach: 'Datei anhängen',
        removeFile: (name: string) => `${name} entfernen`,
        hint: 'Enter sendet, Umschalt+Enter für eine neue Zeile',
        hintModEnter: 'Strg+Enter sendet',
    },
    chatSources: { title: (count: number) => (count === 1 ? '1 Quelle' : `${count} Quellen`) },
    chatToolCall: {
        title: (name: string) => `Werkzeug: ${name}`,
        status: { running: 'Läuft …', done: 'Fertig', error: 'Fehler' } as Record<string, string>,
        input: 'Eingabe',
        output: 'Ergebnis',
    },
    chatThinking: {
        active: 'Denkt nach …',
        done: 'Gedankengang',
        duration: (seconds: number) => `${seconds} s nachgedacht`,
    },
    authForm: {
        titles: {
            signIn: 'Anmelden',
            signUp: 'Konto erstellen',
            reset: 'Passwort zurücksetzen',
            code: 'Code eingeben',
        } as Record<string, string>,
        descriptions: {
            signIn: 'Mit E-Mail-Adresse und Passwort',
            signUp: 'In wenigen Schritten zum eigenen Konto',
            reset: 'Wir schicken Ihnen einen Link zum Zurücksetzen.',
            code: 'Den Code aus der E-Mail oder der Authentifizierungs-App eingeben',
        } as Record<string, string>,
        submit: { signIn: 'Anmelden', signUp: 'Registrieren', reset: 'Link senden', code: 'Bestätigen' } as Record<
            string,
            string
        >,
        name: 'Name',
        email: 'E-Mail-Adresse',
        password: 'Passwort',
        passwordHint: (min: number) => `Mindestens ${min} Zeichen`,
        code: 'Einmalcode',
        remember: 'Angemeldet bleiben',
        forgot: 'Passwort vergessen?',
        or: 'oder',
        providers: 'Anmelden mit',
        noAccount: 'Noch kein Konto?',
        signUpLink: 'Registrieren',
        hasAccount: 'Schon ein Konto?',
        signInLink: 'Anmelden',
        back: 'Zurück zur Anmeldung',
        resetSent: 'Falls ein Konto zu dieser Adresse existiert, ist ein Link unterwegs.',
        sending: 'Wird gesendet …',
    },
    sessionTimeout: {
        title: 'Sitzung läuft bald ab',
        description: 'Aus Sicherheitsgründen werden Sie bei Inaktivität abgemeldet. Möchten Sie angemeldet bleiben?',
        remaining: 'Verbleibende Zeit',
        extend: 'Angemeldet bleiben',
        signOut: 'Abmelden',
        expiredTitle: 'Sitzung abgelaufen',
        expired: 'Sie wurden aus Sicherheitsgründen abgemeldet.',
        close: 'Schließen',
    },
    /** Messages of the validators (isRequired, isEmail …) */
    validation: {
        required: 'Pflichtfeld',
        email: 'Bitte eine gültige E-Mail-Adresse eingeben',
        url: 'Bitte eine gültige Adresse eingeben (https://…)',
        minLength: (min: number) => `Mindestens ${min} Zeichen`,
        maxLength: (max: number) => `Höchstens ${max} Zeichen`,
        length: (min: number, max: number) => `${min} bis ${max} Zeichen`,
        min: (min: string) => `Mindestens ${min}`,
        max: (max: string) => `Höchstens ${max}`,
        range: (min: string, max: string) => `Zwischen ${min} und ${max}`,
        number: 'Bitte eine Zahl eingeben',
        integer: 'Bitte eine ganze Zahl eingeben',
        pattern: 'Das Format stimmt nicht',
        matches: 'Die Eingaben stimmen nicht überein',
        iban: 'Bitte eine gültige IBAN eingeben',
        phone: 'Bitte eine gültige Telefonnummer eingeben',
    },
};

export default de;
