// Language of the Vue and React Storybooks: the components' texts, number/date formats and writing direction.
// Each preview wraps the story in its LocaleProvider and registers the languages that are not built in (separate
// modules, registerLocale); this file only holds the toolbar.

export const localeGlobalTypes = {
    locale: {
        description: 'Language of the components',
        toolbar: {
            title: 'Language',
            icon: 'globe',
            items: [
                { value: 'en-US', title: 'English' },
                { value: 'de-DE', title: 'Deutsch' },
                // Not built in – each preview registers them (registerLocale) from its package's locales/<code>
                { value: 'fr-FR', title: 'Français' },
                { value: 'es-ES', title: 'Español' },
                { value: 'it-IT', title: 'Italiano' },
                { value: 'pt-PT', title: 'Português' },
                { value: 'pt-BR', title: 'Português (Brasil)' },
                { value: 'nl-NL', title: 'Nederlands' },
                { value: 'pl-PL', title: 'Polski' },
                { value: 'cs-CZ', title: 'Čeština' },
                { value: 'hu-HU', title: 'Magyar' },
                { value: 'lv-LV', title: 'Latviešu' },
                { value: 'tr-TR', title: 'Türkçe' },
                // Right to left; ar-EG keeps the Gregorian calendar (ar-SA would switch to the Islamic one)
                { value: 'ar-EG', title: 'العربية' },
                // Hebrew has no built-in texts: English texts, but right-to-left layout and keyboard order
                { value: 'he-IL', title: 'RTL test (he-IL)' },
            ],
            dynamicTitle: true,
        },
    },
};

export const localeInitialGlobals = { locale: 'en-US' };

export const localeOf = (globals: Record<string, unknown>) =>
    typeof globals.locale === 'string' ? globals.locale : localeInitialGlobals.locale;
