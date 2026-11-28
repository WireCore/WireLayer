import { registerUnsavedChanges } from '@wirecore/wirelayer-recipes';
import { onBeforeUnmount, onMounted } from 'vue';
import { useTranslations } from '../locale.js';

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
    let unregister = () => {};
    onMounted(() => {
        unregister = registerUnsavedChanges(isDirty, () => options.message ?? translations.unsavedChanges.leave);
    });
    onBeforeUnmount(() => unregister());
}
