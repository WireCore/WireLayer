import { registerUnsavedChanges } from '@wirecore/wirelayer-recipes';
import { useEffect, useRef } from 'react';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';

export interface UnsavedChangesOptions {
    /** Question before leaving (default: the WireLayer text of the language) */
    message?: string;
}

/**
 * Asks before the page is left while `isDirty()` – reload, closing the tab (the browser's question) and, with
 * `unsavedChangesGuard` in the router, route changes. All forms of the page share one question. With TanStack Form:
 * `useUnsavedChanges(() => !form.state.isDefaultValue)`, and `form.reset(values)` after a successful save.
 */
export function useUnsavedChanges(isDirty: () => boolean, options: UnsavedChangesOptions = {}) {
    const translations = useTranslations();
    const message = options.message ?? translations.unsavedChanges.leave;
    const latest = useRef({ isDirty, message });
    useEffect(() => {
        latest.current = { isDirty, message };
    });
    useEffect(
        () =>
            registerUnsavedChanges(
                () => latest.current.isDirty(),
                () => latest.current.message
            ),
        []
    );
}
