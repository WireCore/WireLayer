import { Dialog as ArkDialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { dialog as dialogRecipe, type RecurrenceScope } from '@wirecore/wirelayer-recipes';
import { Button } from '../Button/Button.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SchedulerSeriesDialogProps {
    open: boolean;
    title: string;
    description: string;
    cancelLabel: string;
    onlyLabel: string;
    allLabel: string;
    /** Element that gets the focus after closing (the moved event) */
    returnFocus: () => HTMLElement | null;
    onChoose: (scope: RecurrenceScope | null) => void;
}

/**
 * The question when an occurrence of a series is moved: only this one, all of the series, or cancel (alertdialog);
 * the focus goes back to the event afterwards
 */
export function SchedulerSeriesDialog({
    open,
    title,
    description,
    cancelLabel,
    onlyLabel,
    allLabel,
    returnFocus,
    onChoose,
}: SchedulerSeriesDialogProps) {
    const dialog = useRecipe('dialog', dialogRecipe, undefined);
    const styles = dialog({ responsive: true });
    return (
        <ArkDialog.Root
            open={open}
            role="alertdialog"
            finalFocusEl={returnFocus}
            lazyMount
            unmountOnExit
            onOpenChange={(details) => !details.open && onChoose(null)}
        >
            <Portal>
                <ArkDialog.Backdrop className={styles.backdrop()} />
                <ArkDialog.Positioner className={styles.positioner()}>
                    <ArkDialog.Content className={styles.content()}>
                        <div className={styles.body()}>
                            <ArkDialog.Title className={styles.title()}>{title}</ArkDialog.Title>
                            <ArkDialog.Description className={styles.description()}>
                                {description}
                            </ArkDialog.Description>
                        </div>
                        <div className={styles.footer()}>
                            <Button variant="outline" size="sm" onClick={() => onChoose(null)}>
                                {cancelLabel}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onChoose('occurrence')}>
                                {onlyLabel}
                            </Button>
                            <Button size="sm" onClick={() => onChoose('series')}>
                                {allLabel}
                            </Button>
                        </div>
                    </ArkDialog.Content>
                </ArkDialog.Positioner>
            </Portal>
        </ArkDialog.Root>
    );
}
