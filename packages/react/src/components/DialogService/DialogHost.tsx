import { Dialog as ArkDialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { dialog as dialogRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { X } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { dialogStore } from './dialogs.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface DialogHostProps {
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dialogRecipe>;
}

const noDialogs: never[] = [];

/** Place once in the app; open with `await openDialog({ title, content })` */
export function DialogHost({ classes, closeLabel }: DialogHostProps) {
    const dialog = useRecipe('dialog', dialogRecipe, classes);
    const translations = useTranslations();
    const stack = useSyncExternalStore(dialogStore.subscribe, dialogStore.get, () => noDialogs);
    // Closed dialogs would otherwise stay in the stack when their exit animation never ends
    useEffect(() => dialogStore.removeClosed, []);
    return stack.map((request) => {
        const styles = dialog({
            size: request.size,
            position: request.position,
            fullscreen: request.fullscreen,
            scrollBehavior: request.scrollBehavior,
            responsive: true,
        });
        return (
            <ArkDialog.Root
                key={request.id}
                open={request.open}
                onOpenChange={(details) => !details.open && request.settle(undefined)}
                onExitComplete={() => dialogStore.remove(request.id)}
                closeOnEscape={request.closeOnEscape}
                closeOnInteractOutside={request.closeOnInteractOutside}
                finalFocusEl={() => request.returnFocus}
            >
                <Portal>
                    <ArkDialog.Backdrop className={styles.backdrop()} />
                    <ArkDialog.Positioner className={styles.positioner()}>
                        <ArkDialog.Content className={styles.content()}>
                            <div className={styles.header()}>
                                {request.closable !== false && (
                                    <ArkDialog.CloseTrigger
                                        className={styles.close()}
                                        aria-label={closeLabel ?? translations.common.close}
                                    >
                                        <X className={styles.closeIcon()} aria-hidden="true" />
                                    </ArkDialog.CloseTrigger>
                                )}
                            </div>
                            <div className={styles.body()}>
                                <ArkDialog.Title className={styles.title()}>{request.title}</ArkDialog.Title>
                                {request.description && (
                                    <ArkDialog.Description className={styles.description()}>
                                        {request.description}
                                    </ArkDialog.Description>
                                )}
                                {request.content(request.settle, request.data)}
                            </div>
                        </ArkDialog.Content>
                    </ArkDialog.Positioner>
                </Portal>
            </ArkDialog.Root>
        );
    });
}
