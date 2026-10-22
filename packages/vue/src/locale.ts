import { resolveLocalizedLocale, type ResolvedLocale, type Translations } from '@wirecore/wirelayer-recipes';
import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue';

const key: InjectionKey<ComputedRef<ResolvedLocale>> = Symbol('wirecore-locale');
const fallback = computed(() => resolveLocalizedLocale());

export function provideLocale(locale: ComputedRef<ResolvedLocale>) {
    provide(key, locale);
}

/** Locale, writing direction and texts of the nearest LocaleProvider – German without one */
export function useLocale(): ComputedRef<ResolvedLocale> {
    return inject(key, fallback);
}

// A read-only view whose properties always come from `read()`, so a render that reads them follows a language switch
function live<T extends object>(read: () => T): T {
    return new Proxy({} as T, {
        get: (_, property) => Reflect.get(read(), property),
        has: (_, property) => Reflect.has(read(), property),
        ownKeys: () => Reflect.ownKeys(read()),
        getOwnPropertyDescriptor: (_, property) =>
            Reflect.has(read(), property)
                ? { value: Reflect.get(read(), property), enumerable: true, configurable: true }
                : undefined,
    });
}

/** Texts of the nearest LocaleProvider; `const t = translations.dataTable` stays current, too */
export function useTranslations(): Translations {
    const locale = useLocale();
    const sections = Object.keys(locale.value.translations).map((name) => [
        name,
        live(() => Reflect.get(locale.value.translations, name) as object),
    ]);
    return Object.fromEntries(sections) as Translations;
}
