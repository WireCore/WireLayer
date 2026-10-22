import {
    hotkeyRegistry,
    hotkeysDialog as hotkeysDialogRecipe,
    type HotkeyEntry,
    type HotkeyRegistry,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useState } from 'react';
import { useHotkeys, useRegisteredHotkeys } from '../../hooks/hotkeys.js';
import { Dialog, DialogContent } from '../Dialog/Dialog.js';
import { Kbd } from '../Kbd/Kbd.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface HotkeysDialogProps {
    /** Open state (controlled) */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Shortcut that opens the dialog (default "?"); `false` switches it off */
    hotkey?: string | false;
    /** Title of the dialog (default "Keyboard shortcuts") */
    title?: string;
    /** Another registry than the page's */
    registry?: HotkeyRegistry;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof hotkeysDialogRecipe>;
}

/** Dialog listing the registered shortcuts with their descriptions, grouped; opens with "?" */
export function HotkeysDialog({
    classes,
    open,
    onOpenChange,
    hotkey = '?',
    title,
    registry = hotkeyRegistry,
}: HotkeysDialogProps) {
    const hotkeysDialog = useRecipe('hotkeysDialog', hotkeysDialogRecipe, classes);
    const translations = useTranslations();
    const styles = hotkeysDialog();
    const [internal, setInternal] = useState(false);
    const isOpen = open ?? internal;
    const setOpen = (next: boolean) => {
        setInternal(next);
        onOpenChange?.(next);
    };
    useHotkeys(hotkey ? [[hotkey, () => setOpen(!isOpen)]] : [], {
        registry,
        description: translations.hotkeys.open,
        group: translations.hotkeys.general,
    });
    const entries = useRegisteredHotkeys(registry);
    // Grouped in the order the groups first appear; entries without a group under "General"
    const groups = new Map<string, HotkeyEntry[]>();
    for (const entry of entries) {
        const group = entry.group ?? translations.hotkeys.general;
        groups.set(group, [...(groups.get(group) ?? []), entry]);
    }
    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent title={title ?? translations.hotkeys.title} scrollBehavior="inside">
                <div className={styles.base()}>
                    {[...groups].map(([group, items]) => (
                        <div key={group} className={styles.group()}>
                            <h3 className={styles.groupTitle()}>{group}</h3>
                            <dl className={styles.list()}>
                                {items.map((entry) => (
                                    <div key={entry.id} className={styles.row()}>
                                        <dt className={styles.description()}>{entry.description}</dt>
                                        <dd className={styles.keys()}>
                                            <Kbd hotkey={entry.hotkey} />
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ))}
                    {!groups.size && <p className={styles.empty()}>{translations.hotkeys.empty}</p>}
                </div>
            </DialogContent>
        </Dialog>
    );
}
