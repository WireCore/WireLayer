import { Menu as ArkMenu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import {
    createContextMenuSource,
    createLongPress,
    menu as menuRecipe,
    type ContextMenuOpenDetails,
    type OverlayHandle,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useEffect, useRef, useState, type ReactElement, type Ref } from 'react';
import {
    MenuEntries,
    MenuStateProvider,
    useMenuBehavior,
    type MenuBehaviorOptions,
    type MenuEntry,
    type MenuItemOptions,
} from '../Menu/Menu.js';
import { useAnchoredOverlay } from '../../overlay.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ContextMenuProps extends MenuItemOptions, MenuBehaviorOptions {
    /** Items, groups, separators, checkbox items, radio groups and submenus – as in Menu */
    items: readonly MenuEntry[];
    /** Accessible name of the menu – without it the menu is named by the area's content */
    label?: string;
    /** Whether the menu is open (controlled, with onOpenChange) */
    open?: boolean;
    /** The menu opened or closed – e.g. to pause list shortcuts while it is open */
    onOpenChange?: (open: boolean) => void;
    /**
     * A right click, long press or the menu key is opening the menu, on this element (e.g. the row under the pointer –
     * select it before the menu shows); `details.source` tells pointer from keyboard, with the keyboard
     * `details.focused` is the focused element (e.g. the row with the focus)
     */
    onBeforeOpen?: (target: Element, details: ContextMenuOpenDetails) => void;
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
    open,
    onOpenChange,
    onBeforeOpen,
    closeOnScroll,
    closeOnResize,
    closeOnBlur,
    highlightFirst,
    ref,
    children,
}: ContextMenuProps) {
    const menu = useRecipe('menu', menuRecipe, classes);
    const styles = menu();
    const state = useAnchoredOverlay({ open, anchor: undefined, onOpenChange, ref, restoreFocus: true });
    const content = useRef<HTMLDivElement>(null);
    const highlight = useMenuBehavior(state.isOpen, state.handle.close, content, {
        closeOnScroll,
        closeOnResize,
        closeOnBlur,
        highlightFirst,
    });
    // Touch and pen: holding still for half a second opens the menu at the finger (open() only uses state setters);
    // one per press, which knows the pressed element
    const longPress = useRef<ReturnType<typeof createLongPress>>(null);
    // Shift+F10 and the menu key open it as well (the browser's contextmenu event)
    const [source] = useState(createContextMenuSource);
    useEffect(() => {
        const press = longPress;
        return () => press.current?.cancel();
    }, []);
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
                {...highlight}
                lazyMount
                unmountOnExit
                onSelect={(details) => onSelect?.(details.value)}
            >
                <ArkMenu.ContextTrigger
                    asChild
                    onPointerDown={(event) => {
                        const target = event.target as Element;
                        source.pointerdown();
                        longPress.current?.cancel();
                        longPress.current = createLongPress((point) => {
                            onBeforeOpen?.(target, { source: 'pointer', focused: null });
                            state.handle.open(point);
                        });
                        longPress.current.down(event);
                    }}
                    onKeyDown={(event) => source.keydown(event)}
                    onContextMenu={(event) => onBeforeOpen?.(event.target as Element, source.contextmenu())}
                    onPointerMove={(event) => longPress.current?.move(event)}
                    onPointerUp={() => longPress.current?.cancel()}
                    onPointerCancel={() => longPress.current?.cancel()}
                >
                    {children}
                </ArkMenu.ContextTrigger>
                <Portal>
                    <ArkMenu.Positioner>
                        <ArkMenu.Content
                            ref={content}
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
