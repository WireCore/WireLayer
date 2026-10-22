export type DemoLocale = 'en-US' | 'de-DE';

export const isDemoLocale = (value: unknown): value is DemoLocale => value === 'en-US' || value === 'de-DE';

/** Texts of the page itself – the components bring their own (LocaleProvider) */
export const texts = {
    'en-US': {
        title: 'WireLayer Admin',
        overview: 'Overview',
        request: 'Request',
        servers: 'Servers',
        availability: 'Availability',
        storage: 'Storage used',
        tickets: 'Open tickets',
        language: 'Language',
        name: 'Name',
        email: 'Email',
        service: 'Service',
        date: 'Preferred date',
        consent: 'I agree to the processing of my data.',
        send: 'Send request',
        confirm: 'Send the request now?',
        sent: 'Request sent',
        required: 'Please fill in',
    },
    'de-DE': {
        title: 'WireLayer Admin',
        overview: 'Übersicht',
        request: 'Anfrage',
        servers: 'Server',
        availability: 'Verfügbarkeit',
        storage: 'Speicher belegt',
        tickets: 'Offene Tickets',
        language: 'Sprache',
        name: 'Name',
        email: 'E-Mail',
        service: 'Leistung',
        date: 'Wunschtermin',
        consent: 'Ich bin mit der Verarbeitung meiner Daten einverstanden.',
        send: 'Anfrage senden',
        confirm: 'Anfrage wirklich senden?',
        sent: 'Anfrage gesendet',
        required: 'Bitte ausfüllen',
    },
} satisfies Record<DemoLocale, Record<string, string>>;
