// UI texts of the components – shared by @wirecore/wirelayer-vue and @wirecore/wirelayer-react so both read the same to assistive
// tech. German is the default; LocaleProvider switches the language (see resolveLocale). German and English are built
// in; further languages are separate modules (./locales/<code>.ts, `@wirecore/wirelayer-recipes/locales/<code>`) that an app
// registers with registerLocale, so they do not add to the default bundle.

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

const de = {
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
         * Names and search words of the emojis in this language, one per line: "😀 Name|search words" – empty uses the
         * built-in German (de) or English names; the English words always find, too
         */
        emojis: '',
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
export const messages: Record<'de' | 'en', Translations> = { de, en };

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
