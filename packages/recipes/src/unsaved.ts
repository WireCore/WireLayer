// Unsaved form input: one shared list of the forms on the page, so leaving asks once however many forms changed

interface UnsavedForm {
    isDirty: () => boolean;
    message: () => string;
}
const forms = new Set<UnsavedForm>();
const dirtyForm = () => [...forms].find((form) => form.isDirty());

// Reload, closing the tab, typing another address: the browser asks with its own text
const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!dirtyForm()) return;
    event.preventDefault();
    // Older browsers ask only with returnValue set
    event.returnValue = '';
};

/**
 * Registers a form whose input may be unsaved (`isDirty`); `message` is the question before leaving. Returns the
 * function that unregisters it. Used by `useUnsavedChanges`; browser only.
 */
export function registerUnsavedChanges(isDirty: () => boolean, message: () => string): () => void {
    const form = { isDirty, message };
    if (!forms.size) window.addEventListener('beforeunload', onBeforeUnload);
    forms.add(form);
    return () => {
        forms.delete(form);
        if (!forms.size) window.removeEventListener('beforeunload', onBeforeUnload);
    };
}

/** Whether to leave: true without unsaved input, else the answer to one `confirm()` – for own links and buttons */
export function confirmLeave(): boolean {
    const form = dirtyForm();
    return !form || window.confirm(form.message());
}

/** A route as Vue Router (`path`) or React Router (`pathname`) passes it */
export interface UnsavedChangesRoute {
    path?: string;
    pathname?: string;
}

/**
 * Router guard: leaving the page with unsaved input asks once (`confirmLeave`); false keeps the page. Only the query
 * or the hash changing does not ask. Vue Router: `router.beforeEach(unsavedChangesGuard)`.
 */
export function unsavedChangesGuard(to: UnsavedChangesRoute, from: UnsavedChangesRoute): boolean {
    return (to.path ?? to.pathname) === (from.path ?? from.pathname) || confirmLeave();
}
