import {
    defaultLocale,
    resolveLocalizedLocale,
    type ResolvedLocale,
    type Translations,
} from '@wirecore/wirelayer-recipes/native';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

export interface LocaleProviderProps {
    /** BCP 47 tag, e.g. "en-US": texts, number and date formats */
    locale?: string;
    /** Texts of the language, e.g. `fr` from `locales/fr` – else built in (de, en), registerLocale or English */
    translations?: Translations;
    children?: ReactNode;
}

const LocaleContext = createContext<ResolvedLocale>(resolveLocalizedLocale());

/** Same API as in @wirecore/wirelayer-vue and @wirecore/wirelayer-react – the writing direction comes from the app (I18nManager) */
export function LocaleProvider({ locale = defaultLocale, translations, children }: LocaleProviderProps) {
    // Numbers in the texts follow the locale (digits, grouping) – see localizeTexts
    const value = useMemo(() => resolveLocalizedLocale(locale, translations), [locale, translations]);
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Locale and texts of the nearest LocaleProvider – English (en-US) without one */
export function useLocale(): ResolvedLocale {
    return useContext(LocaleContext);
}

/** Texts of the nearest LocaleProvider */
export function useTranslations(): Translations {
    return useContext(LocaleContext).translations;
}
