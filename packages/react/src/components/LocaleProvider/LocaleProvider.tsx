import { LocaleProvider as ArkLocaleProvider } from '@ark-ui/react/locale';
import {
    defaultLocale,
    resolveLocalizedLocale,
    type ResolvedLocale,
    type Translations,
} from '@wirecore/wirelayer-recipes';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

export interface LocaleProviderProps {
    /** BCP 47 tag, e.g. "en-US": texts, number and date formats and the writing direction */
    locale?: string;
    /** Texts of the language, e.g. `fr` from `locales/fr` – else built in (de, en), registerLocale or English */
    translations?: Translations;
    children?: ReactNode;
}

const LocaleContext = createContext<ResolvedLocale>(resolveLocalizedLocale());

/** Renders nothing itself; Ark's provider passes locale and direction (keyboard order) on to Ark */
export function LocaleProvider({ locale = defaultLocale, translations, children }: LocaleProviderProps) {
    // Numbers in the texts follow the locale (digits, grouping) – see localizeTexts
    const value = useMemo(() => resolveLocalizedLocale(locale, translations), [locale, translations]);
    return (
        <LocaleContext.Provider value={value}>
            <ArkLocaleProvider locale={locale}>{children}</ArkLocaleProvider>
        </LocaleContext.Provider>
    );
}

/** Locale, writing direction and texts of the nearest LocaleProvider – English (en-US) without one */
export function useLocale(): ResolvedLocale {
    return useContext(LocaleContext);
}

/** Texts of the nearest LocaleProvider */
export function useTranslations(): Translations {
    return useContext(LocaleContext).translations;
}
