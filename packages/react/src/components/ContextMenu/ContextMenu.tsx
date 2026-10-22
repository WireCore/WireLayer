import { Menu as ArkMenu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import {
    createLongPress,
    menu as menuRecipe,
    type OverlayHandle,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useEffect, useState, type ReactElement, type Ref } from 'react';
import { MenuEntries, MenuStateProvider, type MenuEntry, type MenuItemOptions } from '../Menu/Menu.js';
import { useAnchoredOverlay } from '../../overlay.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ContextMenuProps extends MenuItemOptions {
    /** Items, groups, separators, checkbox items, radio groups and submenus – as in Menu */
    items: MenuEntry[];
    /** Accessible name of the menu – without it the menu is named by the area's content */
    label?: string;
    /** open(anchor), close(), toggle(anchor) – e.g. open(event) from your own handler */
    ref?: Ref<OverlayHandle>;
    /** The area that opens the menu */
    children: ReactElement;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof menuRecipe>;
}

/**
 * Opens at the pointer on right click, on touch screens with a long press (and with Shift+F10 or the menu key on the
 * focused area). The actions should also be reachable another way.
 */
export function ContextMenu({
    classes,
    items,
    label,
    onSelect,
    onCheckedChange,
    onValueChange,
    linkAs,
    renderItem,
    ref,
    children,
}: ContextMenuProps) {
    const menu = useRecipe('menu', menuRecipe, classes);
    const styles = menu();
    const state = useAnchoredOverlay({ open: undefined, anchor: undefined, ref, restoreFocus: true });
    // Touch and pen: holding still for half a second opens the menu at the finger (open() only uses state setters)
    const [longPress] = useState(() => createLongPress((point) => state.handle.open(point)));
    useEffect(() => longPress.cancel, [longPress]);
    return (
        <MenuStateProvider
            items={items}
            linkAs={linkAs}
            renderItem={renderItem}
            onCheckedChange={onCheckedChange}
            onValueChange={onValueChange}
        >
            <ArkMenu.Root
                open={state.isOpen}
                onOpenChange={(details) => state.onOpenChange(details.open)}
                positioning={state.positioning({})}
                anchorPoint={state.anchorPoint}
                lazyMount
                unmountOnExit
                onSelect={(details) => onSelect?.(details.value)}
            >
                <ArkMenu.ContextTrigger
                    asChild
                    onPointerDown={(event) => longPress.down(event)}
                    onPointerMove={(event) => longPress.move(event)}
                    onPointerUp={() => longPress.cancel()}
                    onPointerCancel={() => longPress.cancel()}
                >
                    {children}
                </ArkMenu.ContextTrigger>
                <Portal>
                    <ArkMenu.Positioner>
                        <ArkMenu.Content
                            className={styles.content()}
                            {...(label ? { 'aria-label': label, 'aria-labelledby': undefined } : {})}
                        >
                            <MenuEntries entries={items} onSelect={onSelect} />
                        </ArkMenu.Content>
                    </ArkMenu.Positioner>
                </Portal>
            </ArkMenu.Root>
        </MenuStateProvider>
    );
}
