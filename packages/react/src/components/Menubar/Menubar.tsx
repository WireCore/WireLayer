import { Menu as ArkMenu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import {
    inlineArrowStep,
    menu as menuRecipe,
    menubar as menubarRecipe,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Menu as MenuIcon } from 'lucide-react';
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { Menu, MenuEntries, MenuStateProvider, type MenuEntry, type MenuItemOptions } from '../Menu/Menu.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface MenubarMenu {
    label: string;
    items: readonly MenuEntry[];
}

export interface MenubarProps extends MenuItemOptions {
    menus: readonly MenubarMenu[];
    /** Name of the menu bar, e.g. "Application" */
    'aria-label'?: string;
    /** Below the md breakpoint (768px) a menu button with all menus replaces the bar */
    responsive?: boolean;
    /** Accessible name of the menu button on small screens */
    menuLabel?: string;
    /** Content before the bar, e.g. a logo */
    start?: ReactNode;
    /** Content after the bar, e.g. a search or an avatar */
    end?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof menubarRecipe>;
}

/** Menu bar (role="menubar"): arrow keys move along the bar and between open menus, arrow down opens */
export function Menubar({
    classes,
    menus,
    onSelect,
    onCheckedChange,
    onValueChange,
    linkAs,
    renderItem,
    responsive,
    menuLabel,
    start,
    end,
    'aria-label': ariaLabel,
}: MenubarProps) {
    const menu = useRecipe('menu', menuRecipe);
    const menubar = useRecipe('menubar', menubarRecipe, classes);
    const styles = menubar({ responsive });
    const menuStyles = menu();
    const translations = useTranslations();
    const bar = useRef<HTMLDivElement>(null);
    // One menu open at a time; the bar is one tab stop (roving tabindex)
    const [open, setOpen] = useState<number | null>(null);
    const [focused, setFocused] = useState(0);

    const move = (index: number, keepOpen: boolean) => {
        const next = (index + menus.length) % menus.length;
        setFocused(next);
        setOpen(keepOpen ? next : null);
        // The items are always rendered, only their tabindex changes
        if (!keepOpen) bar.current?.querySelectorAll<HTMLElement>(':scope > [role=menuitem]')[next]?.focus();
    };
    const onTriggerKey = (event: KeyboardEvent, index: number) => {
        const keys: Record<string, number | undefined> = {
            Home: 0,
            End: menus.length - 1,
        };
        const step = inlineArrowStep(event.key, event.currentTarget);
        const next = step ? index + step : keys[event.key];
        if (next === undefined) return;
        event.preventDefault();
        move(next, false);
    };
    // Inside an open menu, arrow left/right go to the neighbouring menu – unless they open or close a submenu
    const onContentKey = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
        const step = inlineArrowStep(event.key, event.currentTarget);
        if (!step) return;
        const highlighted = event.currentTarget.querySelector('[data-highlighted]');
        if (step === 1 && highlighted?.getAttribute('aria-haspopup')) return;
        event.preventDefault();
        move(index + step, true);
    };
    const itemOptions = { onSelect, onCheckedChange, onValueChange, linkAs, renderItem };

    const menubarElement = (
        <MenuStateProvider items={menus} {...itemOptions}>
            <div ref={bar} role="menubar" aria-label={ariaLabel} className={styles.base()}>
                {menus.map((entry, index) => (
                    <ArkMenu.Root
                        key={entry.label}
                        open={open === index}
                        onOpenChange={(details) =>
                            setOpen((current) => (details.open ? index : current === index ? null : current))
                        }
                        onSelect={(details) => onSelect?.(details.value)}
                        positioning={{ placement: 'bottom-start', gutter: 4 }}
                        lazyMount
                        unmountOnExit
                    >
                        <ArkMenu.Trigger
                            role="menuitem"
                            tabIndex={index === focused ? 0 : -1}
                            className={styles.item()}
                            onFocus={() => setFocused(index)}
                            onKeyDown={(event) => onTriggerKey(event, index)}
                        >
                            {entry.label}
                        </ArkMenu.Trigger>
                        <Portal>
                            <ArkMenu.Positioner>
                                <ArkMenu.Content
                                    className={menuStyles.content()}
                                    onKeyDown={(event) => onContentKey(event, index)}
                                >
                                    <MenuEntries entries={entry.items} onSelect={onSelect} />
                                </ArkMenu.Content>
                            </ArkMenu.Positioner>
                        </Portal>
                    </ArkMenu.Root>
                ))}
            </div>
        </MenuStateProvider>
    );
    // Content before/after the bar and the menu button sit outside role="menubar" (only menu items may be inside)
    if (!start && !end && !responsive) return menubarElement;
    return (
        <div className={styles.root()}>
            {start && <div className={styles.start()}>{start}</div>}
            {menubarElement}
            {responsive && (
                <Menu
                    items={menus.map((entry, index) => ({
                        value: `menubar-${index}`,
                        label: entry.label,
                        children: [...entry.items],
                    }))}
                    {...itemOptions}
                >
                    <IconButton
                        icon={MenuIcon}
                        label={menuLabel ?? translations.menubar.menu}
                        variant="text"
                        size="sm"
                        className={styles.burger()}
                    />
                </Menu>
            )}
            {end && <div className={styles.end()}>{end}</div>}
        </div>
    );
}
